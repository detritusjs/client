import { Message } from '../structures';

import { ParsedArgs, ParsedErrors } from './argumentparser';
import { Command, FailedPermissions } from './command';
import { Context } from './context';
import { CommandRatelimit as CommandRatelimitCache, CommandRatelimitItem } from './ratelimit';


export namespace CommandEvents {
  export interface CommandDelete {
    command: Command,
    context: Context,
    reply: Message,
  }

  export interface CommandError {
    command: Command,
    context: Context,
    error: Error,
    extra?: Error | ParsedErrors,
    reply?: Message,
  }

  export interface CommandFail {
    args: ParsedArgs,
    command: Command,
    context: Context,
    error: Error,
    prefix: string,
  }

  export interface CommandNone {
    context: Context,
    error: Error,
  }

  export interface CommandPermissionsFailClient {
    command: Command,
    context: Context,
    permissions: FailedPermissions,
  }

  export interface CommandPermissionsFail {
    command: Command,
    context: Context,
    permissions: FailedPermissions,
  }

  export interface CommandRatelimit {
    command: Command,
    context: Context,
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
    command: Command,
    context: Context,
    prefix: string,
  }

  export interface CommandResponseDelete {
    command: Command,
    context: Context,
    reply: Message,
  }

  export interface CommandRunError {
    args: ParsedArgs,
    command: Command,
    context: Context,
    error: Error,
    prefix: string,
  }
}
