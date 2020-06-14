import { SocketStates } from '../constants';


export namespace ClusterIPCTypes {
  export interface IPCMessage {
    op: number,
    data: any,
    request: boolean,
    shard?: number,
  }

  export interface Close {
    code: number,
    reason: string,
    shardId: number,
  }

  export interface Eval {
    error?: {
      message: string,
      name: string,
      stack: string,
    },
    code: string,
    ignored?: boolean,
    nonce: string,
    result?: any,
    results?: Array<[any, boolean]>,
  }

  export interface IdentifyRequest {
    shardId: number,
  }

  export interface ShardState {
    shardId: number,
    state: SocketStates,
  }
}
