class BaseError extends Error {

}

export class GatewayHTTPError extends BaseError {
  httpError: any;

  constructor(message: string, httpError: any) {
    super(message);
    this.httpError = httpError;
  }
}

export class ClusterIPCError extends BaseError {
  name: string;
  stack: string;

  constructor(
    error: {
      message: string,
      name: string,
      stack: string,
    },
  ) {
    super(error.message);
    this.name = error.name;
    this.stack = error.stack;
  }
}
