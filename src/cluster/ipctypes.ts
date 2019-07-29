export namespace ClusterIPCTypes {
  export interface IPCMessage {
    op: number,
    data: any,
    request: boolean,
  }

  export interface Eval {
    error?: {
      message: string,
      name: string,
      stack: string,
    },
    code: string,
    nonce: string,
    results: Array<any>,
  }
}
