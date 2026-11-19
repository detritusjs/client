import { GatewayRawEvents } from './gateway/rawevents';


class BaseError extends Error {
  toJSON() {
    return {
      message: this.message,
      name: this.name,
      stack: this.stack,
    };
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


export class GatewayError extends BaseError {
  originalError: Error;
  packet: GatewayRawEvents.GatewayPacket;

  constructor(error: Error, packet: GatewayRawEvents.GatewayPacket) {
    super(error.message);
    this.originalError = error;
    this.packet = packet;
  }
}


export class GatewayHTTPError extends BaseError {
  httpError: any;

  constructor(message: string, httpError: any) {
    super(message);
    this.httpError = httpError;
  }
}


/**
 * Thrown by `InteractionCommandClient.checkAndUploadCommands()` once every scope was tried, with each failed scope's error
 * keyed by guild id (`LOCAL_GUILD_ID` for the global commands)
 */
export class ApplicationCommandsSyncError extends BaseError {
  errors: Record<string, Error>;

  constructor(errors: Record<string, Error>) {
    super('Error while syncing the application commands of some scopes');
    this.errors = errors;
  }
}


export class ImportedCommandsError extends BaseError {
  errors: {[key: string]: Error};

  constructor(errors: {[key: string]: Error}) {
    super('Error while importing multiple commands');
    this.errors = errors;
  }
}
