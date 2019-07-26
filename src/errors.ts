class BaseError extends Error {

}

export class GatewayHTTPError extends BaseError {
  httpError: any;

  constructor(message: string, httpError: any) {
    super(message);
    this.httpError = httpError;
  }
}
