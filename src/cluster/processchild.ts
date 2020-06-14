import { EventSpewer } from 'detritus-utils';

import { ClusterClient } from '../clusterclient';
import { ClientEvents, ClusterIPCOpCodes, SocketStates } from '../constants';
import { ClusterIPCError } from '../errors';
import { GatewayClientEvents } from '../gateway/clientevents';
import { Snowflake } from '../utils';

import { ClusterIPCTypes } from './ipctypes';


export class ClusterProcessChild extends EventSpewer {
  readonly cluster: ClusterClient;

  clusterCount: number = 1;
  clusterId: number = -1;

  constructor(cluster: ClusterClient) {
    super();
    this.cluster = cluster;
    this.clusterCount = +((<string> process.env.CLUSTER_COUNT) || this.clusterCount);
    this.clusterId = +((<string> process.env.CLUSTER_ID) || this.clusterId);

    process.on('message', this.onMessage.bind(this));
    process.on('message', this.emit.bind(this, 'ipc'));
    this.cluster.on('ready', () => this.sendIPC(ClusterIPCOpCodes.READY));
    this.cluster.on('shard', ({shard}) => {
      shard.gateway.on('state', async ({state}) => {
        const data: ClusterIPCTypes.ShardState = {
          shardId: shard.shardId,
          state,
        };
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
        await this.sendIPC(ClusterIPCOpCodes.IDENTIFY_REQUEST, {shardId: shard.shardId});
        return false;
      };
    });

    Object.defineProperties(this, {
      cluster: {enumerable: false, writable: false},
      clusterId: {writable: false},
    });
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
        case ClusterIPCOpCodes.IDENTIFY_REQUEST: {
          // we received an ok to identify
          const { shardId }: ClusterIPCTypes.IdentifyRequest = message.data;
          const shard = this.cluster.shards.get(shardId);
          if (shard) {
            shard.gateway.identify();
          }
        }; return;
      }
    } catch(error) {
      const payload: GatewayClientEvents.Warn = {error};
      this.cluster.emit(ClientEvents.WARN, payload);
    }
  }

  async send(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    const parent = <any> process;
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
    return this.send({op, data, request, shard});
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
    const parent = <any> process;
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

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: 'ipc', listener: (message: any) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
