import { EventSpewer } from 'detritus-utils';

import { ClusterClient } from '../clusterclient';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { ClientEvents, ClusterIPCOpCodes, SocketStates } from '../constants';
import { ClusterIPCError } from '../errors';
import { GatewayClientEvents } from '../gateway/clientevents';
import { Snowflake } from '../utils';

import { ClusterIPCTypes } from './ipctypes';


export class ClusterProcessChild extends EventSpewer {
  readonly _restRequestsWaiting = new BaseCollection<string | number, {
    promise: Promise<any>,
    reject: Function,
    resolve: Function,
  }>();
  readonly _shardsIdentifying = new BaseSet<number>();
  readonly cluster: ClusterClient;

  clusterCount: number = 1;
  clusterId: number = 0;

  constructor(cluster: ClusterClient) {
    super();
    this.cluster = cluster;
    this.clusterCount = +((process.env.CLUSTER_COUNT as string) || this.clusterCount);
    this.clusterId = +((process.env.CLUSTER_ID as string) || this.clusterId);

    process.on('message', this.onMessage.bind(this));
    process.on('message', this.emit.bind(this, 'ipc'));
    this.cluster.on('ready', () => this.sendIPC(ClusterIPCOpCodes.READY));
    this.cluster.on('shard', ({shard}) => {
      shard.gateway.on('state', async ({state}) => {
        const { shardId } = shard;
        if (state === SocketStates.READY) {
          this._shardsIdentifying.delete(shardId);
        }
        const data: ClusterIPCTypes.ShardState = {shardId, state};
        await this.sendIPCOrWarn(ClusterIPCOpCodes.SHARD_STATE, data, false);
      });
      shard.gateway.on('close', async (payload: {code: number, reason: string}) => {
        const data: ClusterIPCTypes.Close = {
          ...payload,
          shardId: shard.shardId,
        };
        await this.sendIPCOrWarn(ClusterIPCOpCodes.CLOSE, data, false);
      });
      shard.gateway.onIdentifyCheck = async () => {
        const { shardId } = shard;
        if (this._shardsIdentifying.has(shardId)) {
          return true;
        } else {
          // add checks here to see if we already sent in a request?
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
          if (shard) {
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
            this._restRequestsWaiting.delete(hash);
          }
        }; return;
      }
    } catch(error) {
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
    } catch(error) {
      const payload: GatewayClientEvents.Warn = {error};
      this.cluster.emit(ClientEvents.WARN, payload);
    }
  }

  async broadcastEval(code: Function | string, ...args: any[]): Promise<Array<any>> {
    const parent = process as any;
    const nonce = Snowflake.generate().id;
    return new Promise(async (resolve, reject) => {
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
            default: {
              evalArgs.push(`"${arg}"`);
            };
          }
        }
        code = `(${String(code)})(${evalArgs.join(', ')})`;
      }
      try {
        await this.sendIPC(ClusterIPCOpCodes.EVAL, {code, nonce}, true);
      } catch(error) {
        parent.removeListener('message', listener);
        reject(error);
      }
    });
  }

  async sendRestRequest(name: string, args?: Array<any>): Promise<any> {
    // add a timeout
    const hash = (args) ? `${name}-${JSON.stringify(args)}` : name;
    const promise = new Promise(async (resolve, reject) => {
      if (this._restRequestsWaiting.has(hash)) {
        const waiting = this._restRequestsWaiting.get(hash)!;
        resolve(waiting.promise);
      } else {
        await this.sendIPC(ClusterIPCOpCodes.REST_REQUEST, {args, hash, name}, true);
        const waiting = {promise, reject, resolve};
        this._restRequestsWaiting.set(hash, waiting);
      }
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
