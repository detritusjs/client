import { ChildProcess, fork } from 'child_process';

import { EventSpewer, Timers } from 'detritus-utils';

import { ClusterManager, ClusterManagerRestCachePayload } from '../clustermanager';
import { BucketSkip } from '../bucket';
import { BaseCollection } from '../collections/basecollection';
import { ClusterIPCOpCodes, SocketStates } from '../constants';
import { ClusterIPCError } from '../errors';

import { ClusterIPCTypes } from './ipctypes';
import { BROADCAST_EVAL_TIMEOUT, IDENTIFY_READY_TIMEOUT } from './processchild';


export { IDENTIFY_READY_TIMEOUT };

// a child that exits before readying gets respawned with a backoff, so one that crashes on startup doesn't fork in a tight loop
export const RESPAWN_DELAY_MIN = 1000;
export const RESPAWN_DELAY_MAX = 60 * 1000;

export interface ClusterProcessOptions {
  clusterId: number,
  env: {[key: string]: string | undefined},
  shardCount: number,
  shardEnd: number,
  shardStart: number,
}

export interface ClusterProcessRunOptions {
  timeout?: number,
  wait?: boolean,
}

export class ClusterProcess extends EventSpewer {
  readonly _evalsWaiting = new BaseCollection<string, {
    child: ChildProcess,
    listener: (message: any) => void,
    promise: Promise<any>,
    resolve: Function,
    reject: Function,
  }>();
  readonly _shardsIdentifyAttempt = new BaseCollection<number, number>();
  readonly _shardsWaiting = new BaseCollection<number, {resolve: Function, reject: Function}>();
  readonly _respawnTimeout = new Timers.Timeout();
  // how many times in a row the child exited before readying
  _respawnFailures: number = 0;
  readonly clusterId: number = -1;
  readonly manager: ClusterManager;

  env: Record<string, string | undefined> = {};
  process: ChildProcess | null = null;

  constructor(
    manager: ClusterManager,
    options: ClusterProcessOptions,
  ) {
    super();
    this.manager = manager;
    this.clusterId = options.clusterId;

    Object.assign(this.env, process.env, options.env, {
      CLUSTER_COUNT: String(this.manager.clusterCount),
      CLUSTER_ID: String(this.clusterId),
      CLUSTER_SHARD_COUNT: String(options.shardCount),
      CLUSTER_SHARD_END: String(options.shardEnd),
      CLUSTER_SHARD_START: String(options.shardStart),
      CLUSTER_SHARDS_PER: String(this.manager.shardsPerCluster),
    });

    Object.defineProperties(this, {
      _respawnTimeout: {enumerable: false},
      clusterId: {writable: false},
      manager: {enumerable: false, writable: false},
    });
  }

  get execArgv(): Array<string> | undefined {
    return this.manager.execArgv;
  }

  get file(): string {
    return this.manager.file;
  }

  async onMessage(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    // our child has sent us something
    if (message && typeof(message) === 'object') {
      try {
        switch (message.op) {
          case ClusterIPCOpCodes.CLOSE: {
            const data: ClusterIPCTypes.Close = message.data;
            // a stale socket closing late says nothing about the shard's current socket (or its queued identify)
            if (!data.stale) {
              // any identify job still queued for this shard is for the socket that just closed
              this._shardsIdentifyAttempt.set(data.shardId, (this._shardsIdentifyAttempt.get(data.shardId) || 0) + 1);
              const waiting = this._shardsWaiting.get(data.shardId);
              if (waiting) {
                this._shardsWaiting.delete(data.shardId);
                waiting.reject(new Error(`shard ${data.shardId} closed before ready: ${data.code}`));
              }
            }
            this.emit('shardClose', data);
          }; return;
          case ClusterIPCOpCodes.EVAL: {
            if (message.request) {
              const data: ClusterIPCTypes.Eval = message.data;
              try {
                const results = await this.manager.broadcastEvalRaw(
                  data.code,
                  data.nonce,
                  (data.timeout === undefined) ? BROADCAST_EVAL_TIMEOUT : data.timeout,
                );
                await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                  ...data,
                  results,
                });
              } catch(error: any) {
                await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                  ...data,
                  error: ClusterIPCTypes.serializeError(error),
                });
              }
            }
          }; return;
          case ClusterIPCOpCodes.FILL_APPLICATION_EMOJIS: {
            // the sending cluster already filled its own shards
            const promises = this.manager.processes.map((clusterProcess) => {
              if (clusterProcess !== this) {
                return clusterProcess.send(message);
              }
            });
            await Promise.all(promises);
          }; return;
          case ClusterIPCOpCodes.FILL_INTERACTION_COMMANDS: {
            await this.manager.broadcast(message);
          }; return;
          case ClusterIPCOpCodes.IDENTIFY_REQUEST: {
            const { shardId }: ClusterIPCTypes.IdentifyRequest = message.data;
            const ratelimitKey = this.manager.getRatelimitKey(shardId);
            const bucket = this.manager.buckets.get(ratelimitKey);
            if (!bucket) {
              this.emit('warn', {error: new Error(`no identify bucket for ratelimit key ${ratelimitKey} (shard ${shardId})`)});
              return;
            }
            // only the latest request for a shard is valid, older queued jobs become stale
            const attempt = (this._shardsIdentifyAttempt.get(shardId) || 0) + 1;
            this._shardsIdentifyAttempt.set(shardId, attempt);

            const waiting = this._shardsWaiting.get(shardId);
            if (waiting) {
              await this.sendIPC(ClusterIPCOpCodes.IDENTIFY_REQUEST, {shardId});
            } else {
              const child = this.process;
              bucket.add(() => {
                if (this._shardsIdentifyAttempt.get(shardId) !== attempt || !child || this.process !== child) {
                  // stale job, skip it without using up an identify slot
                  return Promise.resolve(BucketSkip);
                }
                return new Promise((resolve, reject) => {
                  const timeout = new Timers.Timeout();
                  const item = {
                    resolve: (value?: any) => {
                      timeout.stop();
                      resolve(value);
                    },
                    reject: (error: any) => {
                      timeout.stop();
                      reject(error);
                    },
                  };
                  const clear = () => {
                    if (this._shardsWaiting.get(shardId) === item) {
                      this._shardsWaiting.delete(shardId);
                    }
                  };
                  // never let one shard hold the bucket (shared across clusters) forever
                  timeout.start(IDENTIFY_READY_TIMEOUT, () => {
                    clear();
                    item.reject(new Error(`shard ${shardId} did not ready within ${IDENTIFY_READY_TIMEOUT}ms of identifying`));
                  });
                  this._shardsWaiting.set(shardId, item);
                  this.sendIPC(ClusterIPCOpCodes.IDENTIFY_REQUEST, {shardId}).catch((error) => {
                    clear();
                    item.reject(error);
                  });
                });
              });
            }
          }; return;
          case ClusterIPCOpCodes.READY: {
            this._respawnFailures = 0;
            this.emit('ready');
          }; return;
          case ClusterIPCOpCodes.RESPAWN_ALL: {
            await this.manager.respawnAll();
          }; return;
          case ClusterIPCOpCodes.REST_REQUEST: {
            const data: ClusterIPCTypes.RestRequest = message.data;
            try {
              if (data.name in this.manager.rest && typeof((this.manager.rest as any)[data.name]) === 'function') {
                let payload: ClusterManagerRestCachePayload | undefined = this.manager.restCache.get(data.hash);
                if (payload) {
                  if (payload.promise) {
                    // a forced request can't share one that started before it (and may be answering from older data), unless that one was forced too
                    if (data.force && !payload.forced) {
                      payload = undefined;
                    }
                  } else {
                    // `get()` keeps pushing back the collection's expiry, so check the result's age too
                    const expire = this.manager.restCache.expire;
                    if (data.force || (expire && expire < Date.now() - (payload.last || 0))) {
                      payload = undefined;
                    }
                  }
                }
                if (payload) {
                  if (payload.promise) {
                    payload.result = await payload.promise;
                    payload.promise = undefined;
                  }
                } else {
                  payload = {
                    forced: !!data.force,
                    promise: (this.manager.rest as any)[data.name](...(data.args || [])),
                  };
                  // replaces any older entry, so later requests get this fresher result
                  this.manager.restCache.set(data.hash, payload);
                  try {
                    payload.result = await payload.promise;
                  } catch(error) {
                    if (this.manager.restCache.get(data.hash) === payload) {
                      this.manager.restCache.delete(data.hash);
                    }
                    throw error;
                  }
                  payload.last = Date.now();
                  payload.promise = undefined;
                }
                await this.sendIPC(ClusterIPCOpCodes.REST_REQUEST, {
                  force: data.force,
                  result: payload.result,
                  hash: data.hash,
                  name: data.name,
                }, false, message.shard, message.clusterId);
              } else {
                throw Error('Invalid rest function name');
              }
            } catch(error: any) {
              await this.sendIPC(ClusterIPCOpCodes.REST_REQUEST, {
                ...data,
                error: ClusterIPCTypes.serializeError(error),
              }, false, message.shard, message.clusterId);
            }
          }; return;
          case ClusterIPCOpCodes.SHARD_STATE: {
            const data: ClusterIPCTypes.ShardState = message.data;
            switch (data.state) {
              case SocketStates.READY: {
                const waiting = this._shardsWaiting.get(data.shardId);
                if (waiting) {
                  waiting.resolve();
                }
                this._shardsWaiting.delete(data.shardId);
              }; break;
            }
            this.emit('shardState', data);
          }; return;
        }
      } catch(error) {
        this.emit('warn', {error});
      }
    }
    this.emit('message', message);
  }

  async onExit(code: number, signal: string, child: ChildProcess | null = this.process, readied: boolean = true): Promise<void> {
    const error = new Error(`Process has closed with '${code}' code and '${signal}' signal.`);
    for (let [nonce, item] of this._evalsWaiting) {
      if (item.child === child) {
        // these results may be sent to another cluster over ipc, which would drop the error's message/stack
        item.resolve([ClusterIPCTypes.serializeError(error), true]);
      }
    }

    // a child that was killed on purpose or replaced shouldn't touch (or respawn) the current one
    if (!child || child !== this.process) {
      return;
    }
    this.emit('close', {code, signal});
    Object.defineProperty(this, 'ran', {value: false});
    this.process = null;

    for (let [shardId, item] of this._shardsWaiting) {
      item.reject(error);
      this._shardsWaiting.delete(shardId);
    }

    if (this.manager.respawn) {
      let delay = 0;
      if (readied) {
        this._respawnFailures = 0;
      } else {
        delay = Math.min(RESPAWN_DELAY_MIN * (2 ** this._respawnFailures), RESPAWN_DELAY_MAX);
        this._respawnFailures++;
      }
      const respawn = async () => {
        // something else (respawn(), run()) may have already started a child while we waited
        if (this.process) {
          return;
        }
        try {
          await this.run();
        } catch(error) {
          this.emit('warn', {error});
        }
      };
      if (delay) {
        this._respawnTimeout.start(delay, respawn);
      } else {
        await respawn();
      }
    }
  }

  async eval(
    code: Function | string,
    nonce: string,
    timeout?: number,
  ): Promise<[any, boolean] | null> {
    if (this.process === null) {
      // the cluster is respawning (or was killed), report it as this cluster's result instead of failing every cluster's eval
      const error = new Error('Cannot eval without a child!');
      return [ClusterIPCTypes.serializeError(error), true];
    }
    if (this._evalsWaiting.has(nonce)) {
      return <Promise<[any, boolean] | null>> (<any> this._evalsWaiting.get(nonce)).promise;
    }
    // incase the process dies
    const child = this.process;

    let resolve!: Function;
    let reject!: Function;
    const promise: Promise<[any, boolean] | null> = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const timer = new Timers.Timeout();
    const waiting = {
      child,
      listener: (
        message: ClusterIPCTypes.IPCMessage | any,
      ) => {
        if (message && typeof(message) === 'object') {
          switch (message.op) {
            case ClusterIPCOpCodes.EVAL: {
              const data: ClusterIPCTypes.Eval = message.data;
              if (data.nonce === nonce) {
                if (data.ignored) {
                  waiting.resolve(null);
                } else {
                  if (data.error) {
                    waiting.resolve([data.error, true]);
                  } else {
                    waiting.resolve([data.result, false]);
                  }
                }
              }
            }; break;
          }
        }
      },
      promise,
      resolve: (value: [any, boolean] | null) => {
        timer.stop();
        child.removeListener('message', waiting.listener);
        if (this._evalsWaiting.get(nonce) === waiting) {
          this._evalsWaiting.delete(nonce);
        }
        resolve(value);
      },
      reject: (error: any) => {
        timer.stop();
        child.removeListener('message', waiting.listener);
        if (this._evalsWaiting.get(nonce) === waiting) {
          this._evalsWaiting.delete(nonce);
        }
        reject(error);
      },
    };
    this._evalsWaiting.set(nonce, waiting);
    child.addListener('message', waiting.listener);
    if (timeout) {
      timer.start(timeout, () => {
        const error = new Error(`Eval timed out after ${timeout}ms`);
        waiting.resolve([ClusterIPCTypes.serializeError(error), true]);
      });
    }

    if (typeof(code) === 'function') {
      code = `(${String(code)})(this)`;
    }
    try {
      await this.sendIPC(ClusterIPCOpCodes.EVAL, {code, nonce}, true);
    } catch(error) {
      waiting.reject(error);
    }
    return promise;
  }

  kill(signal?: NodeJS.Signals | number): boolean {
    // a pending backoff respawn shouldn't bring it back
    this._respawnTimeout.stop();
    const child = this.process;
    if (!child) {
      return false;
    }
    // detach it first so its exit doesn't respawn it
    this.process = null;
    const error = new Error('Process was killed.');
    for (let [shardId, item] of this._shardsWaiting) {
      item.reject(error);
      this._shardsWaiting.delete(shardId);
    }
    return child.kill(signal);
  }

  async respawn(
    options: ClusterProcessRunOptions = {},
  ): Promise<ChildProcess> {
    const child = this.process;
    if (child) {
      const exited = (child.exitCode !== null || child.signalCode !== null) ? Promise.resolve() : new Promise((resolve) => {
        child.once('exit', resolve);
      });
      if (this.kill()) {
        await exited;
      }
    }
    return this.run(options);
  }

  async send(message: any): Promise<void> {
    if (this.process != null) {
      const child = this.process;
      await new Promise<void>((resolve, reject) => {
        child.send(message, (error: any) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }

  async sendIPC(
    op: number,
    data: any = null,
    request: boolean = false,
    shard?: number,
    clusterId?: number,
  ): Promise<void> {
    return this.send({op, data, request, clusterId, shard});
  }

  async run(
    options: ClusterProcessRunOptions = {},
  ): Promise<ChildProcess> {
    if (this.process) {
      return this.process;
    }
    this._respawnTimeout.stop();
    const process = fork(this.file, [], {env: this.env, execArgv: this.execArgv});
    this.process = process;
    let readied = false;
    const onReadied = () => {
      readied = true;
    };
    const onMessage = this.onMessage.bind(this);
    const onExit = (code: number, signal: string) => {
      process.removeListener('message', onMessage);
      process.removeListener('exit', onExit);
      this.removeListener('ready', onReadied);
      return this.onExit(code, signal, process, readied);
    };
    process.on('message', onMessage);
    process.on('exit', onExit);
    this.once('ready', onReadied);

    if (options.wait || options.wait === undefined) {
      return new Promise((resolve, reject) => {
        const timeout = new Timers.Timeout();
        const onReady = () => {
          timeout.stop();
          process.removeListener('exit', onExitBeforeReady);
          resolve(process);
        };
        // the child dying before it readies would otherwise leave this promise pending forever
        const onExitBeforeReady = (code: number | null, signal: string | null) => {
          timeout.stop();
          this.removeListener('ready', onReady);
          reject(new Error(`Cluster Child exited before readying up (code: ${code}, signal: ${signal})`));
        };
        if (options.timeout) {
          timeout.start(options.timeout, () => {
            this.removeListener('ready', onReady);
            process.removeListener('exit', onExitBeforeReady);
            if (this.process === process) {
              this.kill();
            }
            reject(new Error('Cluster Child took too long to ready up'));
          });
        }
        this.once('ready', onReady);
        process.once('exit', onExitBeforeReady);
      });
    }
    return process;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: 'ready', listener: () => any): this;
  on(event: 'shardClose', listener: (data: ClusterIPCTypes.Close) => any): this;
  on(event: 'shardState', listener: (data: ClusterIPCTypes.ShardState) => any): this;
  on(event: 'warn', listener: (payload: {error: Error}) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
