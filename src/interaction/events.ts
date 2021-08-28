import { CommandRatelimit as CommandRatelimitCache, CommandRatelimitItem } from '../commandratelimit';

import { FailedPermissions, ParsedArgs, InteractionCommand } from './command';
import { InteractionContext } from './context';


export namespace InteractionCommandEvents {
  export interface CommandError {
    command: InteractionCommand,
    context: InteractionContext,
    error: Error,
    extra?: Record<string, Error>,
  }

  export interface CommandFail {
    args: ParsedArgs,
    command: InteractionCommand,
    context: InteractionContext,
    error: Error,
  }

  export interface CommandPermissionsFailClient {
    command: InteractionCommand,
    context: InteractionContext,
    permissions: FailedPermissions,
  }

  export interface CommandPermissionsFail {
    command: InteractionCommand,
    context: InteractionContext,
    permissions: FailedPermissions,
  }

  export interface CommandRatelimit {
    command: InteractionCommand,
    context: InteractionContext,
    global: boolean,
    now: number,
    ratelimits: Array<{
      item: CommandRatelimitItem
      ratelimit: CommandRatelimitCache,
      remaining: number,
    }>,
  }

  export interface CommandRan {
    args: ParsedArgs,
    command: InteractionCommand,
    context: InteractionContext,
  }

  export interface CommandRunError {
    args: ParsedArgs,
    command: InteractionCommand,
    context: InteractionContext,
    error: Error,
  }
}
