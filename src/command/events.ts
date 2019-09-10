import { Message } from '../structures';

import { ParsedArgs, ParsedErrors } from './argumentparser';
import { Command, CommandRatelimitItem } from './command';
import { Context } from './context';


export namespace CommandEvents {
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

  export interface CommandRatelimit {
    command: Command,
    context: Context,
    ratelimit: CommandRatelimitItem,
    remaining: number,
  }

  export interface CommandRan {
    args: ParsedArgs,
    command: Command,
    context: Context,
    prefix: string,
  }

  export interface CommandRunError {
    args: ParsedArgs,
    command: Command,
    context: Context,
    error: Error,
    prefix: string,
  }
}
