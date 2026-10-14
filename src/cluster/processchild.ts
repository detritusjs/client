import {
  SocketCloseCodes,
  SocketEvents,
} from 'detritus-client-socket/lib/constants';
import { EventSpewer, Timers } from 'detritus-utils';

import { ClusterClient } from '../clusterclient';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
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

export class ClusterProcessChild extends EventSpewer {
  readonly _restRequestsWaiting = new BaseCollection<string | number, {
    promise: Promise<any>,
    reject: Function,
    resolve: Function,
  }>();
  readonly _shardsIdentifying = new BaseSet<number>();
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
        if (this._shardsIdentifying.has(shardId)) {
          return true;
        } else {
          await this.sendIPC(ClusterIPCOpCodes.IDENTIFY_REQUEST, {shardId});
        }
        return false;
      };
    });

    Object.defineProperties(this, {
      cluster: {enumerable: false, writable: false},
      clusterId: {writable: false},
    });
  }

  get hasMultipleClusters(): boolean {
    return 1 < this.clusterCount;
  }

  async onMessage(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    if (!message || typeof(message) !== 'object') {
      return;
    }
    try {
      switch (message.op) {
        case ClusterIPCOpCodes.EVAL: {
          if (message.request) {
            // we received a request to eval from the parent
            const data: ClusterIPCTypes.Eval = message.data;
            if (message.shard != null && !this.cluster.shards.has(message.shard)) {
              await this.sendIPC(ClusterIPCOpCodes.EVAL, {
                ...data,
                ignored: true,
              });
            } else {
              try {
                const result = await Promise.resolve(this.cluster._eval(data.code));
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
            this._shardsIdentifying.add(shardId);
            shard.gateway.identify();
          }
        }; return;
        case ClusterIPCOpCodes.REST_REQUEST: {
          const { clusterId } = message;
          if (clusterId === this.clusterId) {
            const { error, hash, result }: ClusterIPCTypes.RestRequest = message.data;
            if (this._restRequestsWaiting.has(hash)) {
              const waiting = this._restRequestsWaiting.get(hash)!;
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
    const parent = process as any;
    const nonce = Snowflake.generate().id;
    const timeout = this.broadcastEvalTimeout;
    return new Promise(async (resolve, reject) => {
      const timer = new Timers.Timeout();
      const listener = (
        message: ClusterIPCTypes.IPCMessage | any,
      ) => {
        if (message && typeof(message) === 'object') {
          if (message.request) {
            return;
          }
          switch (message.op) {
            case ClusterIPCOpCodes.EVAL: {
              const data: ClusterIPCTypes.Eval = message.data;
              if (data.nonce === nonce) {
                timer.stop();
                parent.removeListener('message', listener);

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
              }
            }; break;
          }
        }
      };
      parent.addListener('message', listener);

      if (typeof(code) === 'function') {
        const evalArgs = ['this'];
        for (let arg of args) {
          switch (typeof(arg)) {
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
              evalArgs.push(`"${arg}"`);
            };
          }
        }
        code = `(${String(code)})(${evalArgs.join(', ')})`;
      }
      if (timeout) {
        timer.start(timeout + BROADCAST_EVAL_TIMEOUT_GRACE, () => {
          parent.removeListener('message', listener);
          reject(new Error(`Broadcast eval timed out after ${timeout}ms`));
        });
      }
      try {
        await this.sendIPC(ClusterIPCOpCodes.EVAL, {code, nonce, timeout}, true);
      } catch(error) {
        timer.stop();
        parent.removeListener('message', listener);
        reject(error);
      }
    });
  }

  async sendRestRequest(name: string, args?: Array<any>): Promise<any> {
    const hash = (args) ? `${name}-${JSON.stringify(args)}` : name;
    if (this._restRequestsWaiting.has(hash)) {
      // share the in-flight request instead of overwriting its waiter
      return this._restRequestsWaiting.get(hash)!.promise;
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
        if (this._restRequestsWaiting.get(hash) === waiting) {
          this._restRequestsWaiting.delete(hash);
        }
        resolve(value);
      },
      reject: (error: any) => {
        timeout.stop();
        if (this._restRequestsWaiting.get(hash) === waiting) {
          this._restRequestsWaiting.delete(hash);
        }
        reject(error);
      },
    };
    // register before sending so the response (or a duplicate call) can't miss it
    this._restRequestsWaiting.set(hash, waiting);
    timeout.start(REST_REQUEST_TIMEOUT, () => {
      waiting.reject(new Error(`Rest request ${name} timed out after ${REST_REQUEST_TIMEOUT}ms`));
    });
    this.sendIPC(ClusterIPCOpCodes.REST_REQUEST, {args, hash, name}, true).catch((error) => {
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
