export namespace ClusterIPCTypes {
  export interface IPCMessage {
    op: number,
    d: any,
  }

  export interface Eval {
    error?: {
      message: string,
      name: string,
      stack: string,
    },
    code: string,
    id: string,
    result: any,
  }
}
