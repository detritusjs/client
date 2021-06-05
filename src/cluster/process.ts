import { ChildProcess, fork } from 'child_process';

import { EventSpewer, Timers } from 'detritus-utils';

import { ClusterManager, ClusterManagerRestCachePayload } from '../clustermanager';
import { BaseCollection } from '../collections/basecollection';
import { ClusterIPCOpCodes, SocketStates } from '../constants';
import { ClusterIPCError } from '../errors';

import { ClusterIPCTypes } from './ipctypes';


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
    promise: Promise<any>,
    resolve: Function,
    reject: Function,
  }>();
  readonly _shardsWaiting = new BaseCollection<number, {resolve: Function, reject: Function}>();
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
    });

    Object.defineProperties(this, {
      clusterId: {writable: false},
      manager: {enumerable: false, writable: false},
    });
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
            this.emit('shardClose', data);
          }; return;
          case ClusterIPCOpCodes.EVAL: {
            if (message.request) {
              const data: ClusterIPCTypes.Eval = message.data;
              try {
                const results = await this.manager.broadcastEvalRaw(
                  data.code,
                  data.nonce,
                );
                await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                  ...data,
                  results,
                });
              } catch(error) {
                await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                  ...data,
                  error: {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                  },
                });
              }
            }
          }; return;
          case ClusterIPCOpCodes.IDENTIFY_REQUEST: {
            const { shardId }: ClusterIPCTypes.IdentifyRequest = message.data;
            const ratelimitKey = this.manager.getRatelimitKey(shardId);
            const bucket = this.manager.buckets.get(ratelimitKey);
            if (bucket) {
              bucket.add(() => {
                return new Promise(async (resolve, reject) => {
                  await this.sendIPC(ClusterIPCOpCodes.IDENTIFY_REQUEST, {shardId});
                  const waiting = this._shardsWaiting.get(shardId);
                  if (waiting) {
                    const error = new Error('Received new Identify Request with same shard id, unknown why');
                    waiting.reject(error);
                    this.emit('warn', {error});
                  }
                  this._shardsWaiting.set(shardId, {resolve, reject});
                });
              });
            }
          }; return;
          case ClusterIPCOpCodes.READY: {
            this.emit('ready');
          }; return;
          case ClusterIPCOpCodes.RESPAWN_ALL: {

          }; return;
          case ClusterIPCOpCodes.REST_REQUEST: {
            const data: ClusterIPCTypes.RestRequest = message.data;
            try {
              if (data.name in this.manager.rest && typeof((this.manager.rest as any)[data.name]) === 'function') {
                let payload: ClusterManagerRestCachePayload;
                if (this.manager.restCache.has(data.name)) {
                  payload = this.manager.restCache.get(data.name)!;
                  if (payload.promise) {
                    payload.result = await payload.promise;
                    payload.promise = undefined;
                  }
                } else {
                  payload = {
                    promise: (this.manager.rest as any)[data.name](...(data.args || [])),
                  };
                  this.manager.restCache.set(data.name, payload);
                  payload.result = await payload.promise;
                  payload.promise = undefined;
                }
                this.manager.restCache.delete(data.name);
                await this.sendIPC(ClusterIPCOpCodes.REST_REQUEST, {
                  result: payload.result,
                  name: data.name,
                }, false, message.shardId, message.clusterId);
              } else {
                throw Error('Invalid rest function name');
              }
            } catch(error) {
              await this.sendIPC(ClusterIPCOpCodes.REST_REQUEST, {
                ...data,
                error: {
                  message: error.message,
                  name: error.name,
                  stack: error.stack,
                },
              }, false, message.shardId, message.clusterId);
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

  async onExit(code: number, signal: string): Promise<void> {
    this.emit('close', {code, signal});
    Object.defineProperty(this, 'ran', {value: false});
    this.process = null;

    const error = new Error(`Process has closed with '${code}' code and '${signal}' signal.`);
    for (let [nonce, item] of this._evalsWaiting) {
      item.resolve([error, true]);
      this._evalsWaiting.delete(nonce);
    }

    for (let [shardId, item] of this._shardsWaiting) {
      item.reject(error);
      this._shardsWaiting.delete(shardId);
    }

    if (this.manager.respawn) {
      try {
        await this.run();
      } catch(error) {
        this.emit('warn', {error});
      }
    }
  }

  async eval(
    code: Function | string,
    nonce: string,
  ): Promise<[any, boolean] | null> {
    if (this.process === null) {
      throw new Error('Cannot eval without a child!');
    }
    if (this._evalsWaiting.has(nonce)) {
      return <Promise<[any, boolean] | null>> (<any> this._evalsWaiting.get(nonce)).promise;
    }
    // incase the process dies
    const child = this.process;

    return new Promise((resolve, reject) => {
      const promise: Promise<[any, boolean] | null> = new Promise(async (res, rej) => {
        const listener = (
          message: ClusterIPCTypes.IPCMessage | any,
        ) => {
          if (message && typeof(message) === 'object') {
            switch (message.op) {
              case ClusterIPCOpCodes.EVAL: {
                const data: ClusterIPCTypes.Eval = message.data;
                if (data.nonce === nonce) {
                  child.removeListener('message', listener);
                  this._evalsWaiting.delete(nonce);
  
                  if (data.ignored) {
                    res(null);
                  } else {
                    if (data.error) {
                      res([data.error, true]);
                    } else {
                      res([data.result, false]);
                    }
                  }
                }
              }; break;
            }
          }
        };
        child.addListener('message', listener);
  
        if (typeof(code) === 'function') {
          code = `(${String(code)})(this)`;
        }
        try {
          await this.sendIPC(ClusterIPCOpCodes.EVAL, {code, nonce}, true);
        } catch(error) {
          child.removeListener('message', listener);
          rej(error);
        }
      });

      this._evalsWaiting.set(nonce, {promise, resolve, reject});
      promise.then(resolve).catch(reject);
    });
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
    const process = fork(this.file, [], {env: this.env});
    this.process = process;
    this.process.on('message', this.onMessage.bind(this));
    this.process.on('exit', this.onExit.bind(this));

    if (options.wait || options.wait === undefined) {
      return new Promise((resolve, reject) => {
        const timeout = new Timers.Timeout();
        if (options.timeout) {
          timeout.start(options.timeout, () => {
            if (this.process === process) {
              this.process.kill();
              this.process = null;
            }
            reject(new Error('Cluster Child took too long to ready up'));
          });
        }
        this.once('ready', () => {
          timeout.stop();
          resolve(process);
        });
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
