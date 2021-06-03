import {
  ClusterIPCOpCodes,
  ClusterIPCRestRequestTypes,
  SocketStates,
} from '../constants';


export namespace ClusterIPCTypes {
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

  export interface RestRequest {
    data?: any,
    error?: {
      message: string,
      name: string,
      stack: string,
    },
    result?: any,
    type: ClusterIPCRestRequestTypes,
  }

  export interface ShardState {
    shardId: number,
    state: SocketStates,
  }
}
