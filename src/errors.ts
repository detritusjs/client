class BaseError extends Error {
  toJSON() {
    return {
      message: this.message,
      name: this.name,
      stack: this.stack,
    };
  }
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

export class ImportedCommandsError extends BaseError {
  errors: {[key: string]: Error};

  constructor(errors: {[key: string]: Error}) {
    super('Error while importing multiple commands');
    this.errors = errors;
  }
}
