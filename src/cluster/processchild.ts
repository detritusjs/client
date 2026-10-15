import {
  SocketCloseCodes,
  SocketEvents,
} from 'detritus-client-socket/lib/constants';
import { EventSpewer, Timers } from 'detritus-utils';

import { ClusterClient } from '../clusterclient';
import { BaseCollection } from '../collections/basecollection';
import { ClientEvents, ClusterIPCOpCodes, SocketStates } from '../constants';
import { ClusterIPCError } from '../errors';
import { GatewayClientEvents } from '../gateway/clientevents';
import { Snowflake } from '../utils';

import { ClusterIPCTypes } from './ipctypes';


// how long to wait for the manager to answer a rest request
export const REST_REQUEST_TIMEOUT = 60 * 1000;
// how long each cluster gets to answer a broadcast eval, clusters that don't answer in time are reported as errors
export const BROADCAST_EVAL_TIMEOUT = 60 * 1000;
// extra time to wait for the manager to send the (partial) results back
export const BROADCAST_EVAL_TIMEOUT_GRACE = 5 * 1000;
// max time a shard can hold its identify bucket while we wait for it to be ready
export const IDENTIFY_READY_TIMEOUT = 30 * 1000;

/**
 * Eval results go over ipc as json, BigInts would throw there so send them as strings
 * (structures go through their `toJSON()` either way)
 */
function toIPCSafe(value: any): any {
  if (value === undefined) {
    return value;
  }
  const json = JSON.stringify(value, (key, item) => (typeof(item) === 'bigint') ? String(item) : item);
  return (json === undefined) ? undefined : JSON.parse(json);
}

// forced rest requests wait on their own key, so a forced one never shares (or answers) a normal one's waiter
function getRestRequestKey(hash: string, force?: boolean): string {
  return (force) ? `${hash}.force` : hash;
}

export class ClusterProcessChild extends EventSpewer {
  readonly _broadcastEvalsWaiting = new BaseCollection<string, (data: ClusterIPCTypes.Eval) => void>();
  readonly _restRequestsWaiting = new BaseCollection<string | number, {
    promise: Promise<any>,
    reject: Function,
    resolve: Function,
  }>();
  // shard id -> when the manager let it identify
  readonly _shardsIdentifying = new BaseCollection<number, number>();
  readonly cluster: ClusterClient;

  broadcastEvalTimeout: number = BROADCAST_EVAL_TIMEOUT;
  clusterCount: number = 1;
  clusterId: number = 0;
  clusterShardsPer: number = 1;

  constructor(cluster: ClusterClient) {
    super();
    this.cluster = cluster;
    this.clusterCount = +((process.env.CLUSTER_COUNT as string) || this.clusterCount);
    this.clusterId = +((process.env.CLUSTER_ID as string) || this.clusterId);
    this.clusterShardsPer = +((process.env.CLUSTER_SHARDS_PER as string) || this.clusterShardsPer);

    process.on('message', this.onMessage.bind(this));
    process.on('message', this.emit.bind(this, 'ipc'));
    this.hookCluster();

    Object.defineProperties(this, {
      cluster: {enumerable: false, writable: false},
      clusterId: {writable: false},
    });
  }

  get hasMultipleClusters(): boolean {
    return 1 < this.clusterCount;
  }

  /**
   * Attach our listeners to the cluster client
   * `ClusterClient.kill()` removes every listener, so it calls this again to keep a rerun coordinated with the manager
   */
  hookCluster(): void {
    this.cluster.on('ready', () => this.sendIPCOrWarn(ClusterIPCOpCodes.READY));
    this.cluster.on('shard', ({shard}) => {
      shard.gateway.on(SocketEvents.STATE, async ({state}) => {
        const { shardId } = shard;
        if (state === SocketStates.READY) {
          this._shardsIdentifying.delete(shardId);
        }
        const data: ClusterIPCTypes.ShardState = {shardId, state};
        await this.sendIPCOrWarn(ClusterIPCOpCodes.SHARD_STATE, data, false);
      });
      shard.gateway.on(SocketEvents.CLOSE, async (payload: {code: number, reason: string, stale?: boolean}) => {
        const { shardId } = shard;
        if (!payload.stale) {
          this._shardsIdentifying.delete(shardId);
        }
        const data: ClusterIPCTypes.Close = {
          ...payload,
          shardId,
        };
        await this.sendIPCOrWarn(ClusterIPCOpCodes.CLOSE, data, false);
      });
      shard.gateway.on(SocketEvents.KILLED, async () => {
        const { shardId } = shard;
        this._shardsIdentifying.delete(shardId);
        await this.sendIPCOrWarn(ClusterIPCOpCodes.CLOSE, {
          shardId,
          code: SocketCloseCodes.NORMAL,
          reason: 'killed',
        }, false);
      });
      shard.gateway.onIdentifyCheck = async () => {
        const { shardId } = shard;
        const allowedAt = this._shardsIdentifying.get(shardId);
        if (allowedAt !== undefined) {
          // the manager stops holding the identify bucket for us after this, so ask again instead of identifying on our own
          // (like an INVALID_SESSION reconnect, which closes the old socket as stale and never readies)
          if (Date.now() - allowedAt < IDENTIFY_READY_TIMEOUT) {
            return true;
          }
          this._shardsIdentifying.delete(shardId);
        }
        await this.sendIPC(ClusterIPCOpCodes.IDENTIFY_REQUEST, {shardId});
        return false;
      };
    });
  }

  async onMessage(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    if (!message || typeof(message) !== 'object') {
      return;
    }
    try {
      switch (message.op) {
        case ClusterIPCOpCodes.EVAL: {
          if (!message.request) {
            // the manager answering one of our broadcast evals
            const data: ClusterIPCTypes.Eval = message.data;
            const waiting = (data) ? this._broadcastEvalsWaiting.get(data.nonce) : undefined;
            if (waiting) {
              waiting(data);
            }
          } else {
            // we received a request to eval from the parent
            const data: ClusterIPCTypes.Eval = message.data;
            if (message.shard != null && !this.cluster.shards.has(message.shard)) {
              await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                ...data,
                ignored: true,
              });
            } else {
              try {
                const result = toIPCSafe(await Promise.resolve(this.cluster._eval(data.code)));
                await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                  ...data,
                  result,
                });
              } catch(error: any) {
                await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                  ...data,
                  error: ClusterIPCTypes.serializeError(error),
                });
              }
            }
          }
        }; return;
        case ClusterIPCOpCodes.FILL_APPLICATION_EMOJIS: {
          const { data }: ClusterIPCTypes.FillApplicationEmojis = message.data;
          this.cluster._refresh.applicationEmojis.data = data;
          this.cluster._refresh.applicationEmojis.last = Date.now();
          for (let [shardId, shard] of this.cluster.shards) {
            await shard.applicationEmojis.fill(data);
          }
        }; return;
        case ClusterIPCOpCodes.FILL_INTERACTION_COMMANDS: {
          const { data }: ClusterIPCTypes.FillInteractionCommands = message.data;
          if (this.cluster.interactionCommandClient) {
            this.cluster.interactionCommandClient.validateCommandsFromRaw(data);
          }
        }; return;
        case ClusterIPCOpCodes.IDENTIFY_REQUEST: {
          // we received an ok to identify
          const { shardId }: ClusterIPCTypes.IdentifyRequest = message.data;
          const shard = this.cluster.shards.get(shardId);
          // identify() ignores the call unless the socket is open or resuming
          if (shard && !shard.gateway.killed && (shard.gateway.state === SocketStates.OPEN || shard.gateway.state === SocketStates.RESUMING)) {
            this._shardsIdentifying.set(shardId, Date.now());
            shard.gateway.identify();
          }
        }; return;
        case ClusterIPCOpCodes.REST_REQUEST: {
          const { clusterId } = message;
          if (clusterId === this.clusterId) {
            const { error, force, hash, result }: ClusterIPCTypes.RestRequest = message.data;
            const key = getRestRequestKey(hash, force);
            if (this._restRequestsWaiting.has(key)) {
              const waiting = this._restRequestsWaiting.get(key)!;
              if (error) {
                waiting.reject(new ClusterIPCError(error));
              } else {
                waiting.resolve(result);
              }
            }
          }
        }; return;
      }
    } catch(error: any) {
      const payload: GatewayClientEvents.Warn = {error};
      this.cluster.emit(ClientEvents.WARN, payload);
    }
  }

  async send(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    const parent = process as any;
    return new Promise((resolve, reject) => {
      parent.send(message, (error: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async sendIPC(
    op: number,
    data: any = null,
    request: boolean = false,
    shard?: number,
  ): Promise<void> {
    return this.send({op, data, request, clusterId: this.clusterId, shard});
  }

  async sendIPCOrWarn(
    op: number,
    data: any = null,
    request: boolean = false,
    shard?: number,
  ): Promise<void> {
    try {
      await this.sendIPC(op, data, request, shard);
    } catch(error: any) {
      const payload: GatewayClientEvents.Warn = {error};
      this.cluster.emit(ClientEvents.WARN, payload);
    }
  }

  async broadcastEval(code: Function | string, ...args: any[]): Promise<Array<any>> {
    if (typeof(code) === 'function') {
      // build the code first, an argument that can't be serialized (circular, BigInt inside an object) rejects right here
      const evalArgs = ['this'];
      for (let arg of args) {
        switch (typeof(arg)) {
          case 'bigint': {
            evalArgs.push(`${arg}n`);
          }; break;
          case 'boolean':
          case 'number': {
            evalArgs.push(`${arg}`);
          }; break;
          case 'object': {
            // double stringify so the eval'd code gets a string literal to parse
            evalArgs.push(`JSON.parse(${JSON.stringify(JSON.stringify(arg))})`);
          }; break;
          case 'string': {
            evalArgs.push(JSON.stringify(arg));
          }; break;
          case 'undefined': {
            evalArgs.push('undefined');
          }; break;
          default: {
            evalArgs.push(JSON.stringify(String(arg)));
          };
        }
      }
      code = `(${String(code)})(${evalArgs.join(', ')})`;
    }

    // every cluster generates snowflakes with the same worker/process ids, so prefix ours to not collide with another cluster's eval
    const nonce = `${this.clusterId}.${Snowflake.generate().id}`;
    const timeout = this.broadcastEvalTimeout;
    return new Promise((resolve, reject) => {
      const timer = new Timers.Timeout();
      const clear = () => {
        timer.stop();
        if (this._broadcastEvalsWaiting.get(nonce) === onResult) {
          this._broadcastEvalsWaiting.delete(nonce);
        }
      };
      const onResult = (data: ClusterIPCTypes.Eval) => {
        clear();
        if (data.error) {
          reject(new ClusterIPCError(data.error));
        } else {
          const results = (data.results || []).map(([result, isError]) => {
            if (isError) {
              return new ClusterIPCError(result);
            }
            return result;
          });
          resolve(results);
        }
      };
      this._broadcastEvalsWaiting.set(nonce, onResult);

      if (timeout) {
        timer.start(timeout + BROADCAST_EVAL_TIMEOUT_GRACE, () => {
          clear();
          reject(new Error(`Broadcast eval timed out after ${timeout}ms`));
        });
      }
      this.sendIPC(ClusterIPCOpCodes.EVAL, {code, nonce, timeout}, true).catch((error) => {
        clear();
        reject(error);
      });
    });
  }

  /**
   * Ask the manager to make a rest request for us, its results are cached and shared between every cluster
   * `force` skips the manager's cache and replaces the cached result with a fresh one
   */
  async sendRestRequest(name: string, args?: Array<any>, force: boolean = false): Promise<any> {
    const hash = (args) ? `${name}-${JSON.stringify(args)}` : name;
    const key = getRestRequestKey(hash, force);
    // share the in-flight request instead of overwriting its waiter
    // a forced request only shares another forced one, an older normal one may be answered from the manager's cache
    const shared = this._restRequestsWaiting.get(getRestRequestKey(hash, true)) || this._restRequestsWaiting.get(key);
    if (shared) {
      return shared.promise;
    }

    let resolve!: Function;
    let reject!: Function;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const timeout = new Timers.Timeout();
    const waiting = {
      promise,
      resolve: (value: any) => {
        timeout.stop();
        if (this._restRequestsWaiting.get(key) === waiting) {
          this._restRequestsWaiting.delete(key);
        }
        resolve(value);
      },
      reject: (error: any) => {
        timeout.stop();
        if (this._restRequestsWaiting.get(key) === waiting) {
          this._restRequestsWaiting.delete(key);
        }
        reject(error);
      },
    };
    // register before sending so the response (or a duplicate call) can't miss it
    this._restRequestsWaiting.set(key, waiting);
    timeout.start(REST_REQUEST_TIMEOUT, () => {
      waiting.reject(new Error(`Rest request ${name} timed out after ${REST_REQUEST_TIMEOUT}ms`));
    });
    this.sendIPC(ClusterIPCOpCodes.REST_REQUEST, {args, force, hash, name}, true).catch((error) => {
      waiting.reject(error);
    });
    return promise;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: 'ipc', listener: (message: any) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
