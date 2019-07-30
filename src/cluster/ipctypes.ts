export namespace ClusterIPCTypes {
  export interface IPCMessage {
    op: number,
    data: any,
    request: boolean,
    shard?: number,
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
    results?: Array<any>,
  }
}
