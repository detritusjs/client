import {
  ClusterIPCOpCodes,
  SocketStates,
} from '../constants';


export namespace ClusterIPCTypes {
  // errors don't survive ipc serialization (only own enumerable properties are kept), send these instead
  export interface IPCError {
    message: string,
    name: string,
    stack: string,
  }

  export function serializeError(error: any): IPCError {
    if (error && typeof(error) === 'object') {
      return {
        message: String(error.message),
        name: String(error.name || 'Error'),
        stack: String(error.stack || ''),
      };
    }
    return {message: String(error), name: 'Error', stack: ''};
  }

  export interface IPCMessage {
    op: ClusterIPCOpCodes,
    data: any,
    request: boolean,
    clusterId?: number,
    shard?: number,
  }

  export interface Close {
    code: number,
    reason: string,
    shardId: number,
    // a replaced socket closing late, the shard already has a newer socket
    stale?: boolean,
  }

  export interface Eval {
    error?: IPCError,
    code: string,
    ignored?: boolean,
    nonce: string,
    timeout?: number,
    result?: any,
    results?: Array<[any, boolean]>,
  }

  export interface FillApplicationEmojis {
    data: {items: Array<any>},
  }

  export interface FillInteractionCommands {
    data: Array<any>,
  }

  export interface IdentifyRequest {
    shardId: number,
  }

  export interface RestRequest {
    data?: any,
    error?: IPCError,
    result?: any,

    args?: Array<any>,
    // skip the manager's rest cache, fetch fresh and replace the cached result
    force?: boolean,
    hash: string,
    name: string,
  }

  export interface ShardState {
    shardId: number,
    state: SocketStates,
  }
}
