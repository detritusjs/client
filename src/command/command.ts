import { ShardClient } from '../client';
import { CommandClient } from '../commandclient';
import { 
  CommandRatelimitTypes,
  COMMAND_RATELIMIT_TYPES,
} from '../constants';

import { ArgumentOptions } from './argument';
import { ArgumentParser, ParsedArgs } from './argumentparser';
import { Context } from './context';


/**
 * @category Command
 */
export type CommandCallback = (context: Context, args: ParsedArgs) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackBefore = (context: Context, args: ParsedArgs) => Promise<boolean> | boolean;

/**
 * @category Command
 */
export type CommandCallbackError = (context: Context, args: ParsedArgs, error: any) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackRatelimit = (context: Context, remaining: number) => Promise<any> | any;

/**
 * Command Options
 * @category Command Options
 */
export interface CommandOptions {
  _class?: any,
  _file?: string,
  aliases?: Array<string>,
  args?: Array<ArgumentOptions>,
  disableDm?: boolean,
  disableDmReply?: boolean,
  extras?: {[key: string]: any},
  label?: string,
  name?: string,
  ratelimit?: boolean | CommandRatelimitOptions | null,
  responseOptional?: boolean,

  onBefore?: CommandCallbackBefore,
  onCancel?: CommandCallback,
  onError?: CommandCallbackError,
  run?: CommandCallback,
  onRatelimit?: CommandCallbackRatelimit,
  onRunError?: CommandCallbackError,
  onSuccess?: CommandCallback,
}

/**
 * Command Ratelimit Options
 * @category Command Options
 */
export interface CommandRatelimitOptions {
  duration?: number,
  limit?: number,
  type?: string,
}


/**
 * Command itself
 * @category Command
 */
export class Command {
  readonly _file?: string;
  readonly commandClient: CommandClient;

  aliases: Array<string>;
  args: ArgumentParser;
  disableDm: boolean = false;
  disableDmReply: boolean = false;
  extras: {[key: string]: any};
  label: string = '';
  name: string = '';
  ratelimit: CommandRatelimit | null = null;
  responseOptional: boolean = false;

  onBefore?: CommandCallbackBefore;
  onCancel?: CommandCallback;
  onError?: CommandCallbackError;
  run?: CommandCallback;
  onRatelimit?: CommandCallbackRatelimit;
  onRunError?: CommandCallbackError;
  onSuccess?: CommandCallback;

  constructor(
    commandClient: CommandClient,
    options: CommandOptions,
  ) {
    this.commandClient = commandClient;

    const name = options.name || this.name;
    this.aliases = (options.aliases || []).map((alias) => alias.toLowerCase());
    this.args = new ArgumentParser(options.args);
    this.disableDm = !!options.disableDm;
    this.disableDmReply = !!options.disableDmReply;
    this.extras = Object.assign({}, options.extras);
    this.label = (options.label || name).toLowerCase();
    this.name = name.toLowerCase();
    this.responseOptional = !!options.responseOptional;

    if (options._file) {
      this._file = options._file;
    }

    if (options.ratelimit != null) {
      this.ratelimit = new CommandRatelimit(this, options.ratelimit);
    }
    Object.defineProperties(this, {
      _file: {configurable: true, writable: false},
      client: {enumerable: false, writable: false},
      commandClient: {enumerable: false, writable: false},
      ratelimit: {enumerable: false, writable: false},
    });

    this.onBefore = options.onBefore;
    this.onCancel = options.onCancel;
    this.onError = options.onError;
    this.run = options.run;
    this.onRatelimit = options.onRatelimit;
    this.onRunError = options.onRunError;
    this.onSuccess = options.onSuccess;
  }

  check(name: string): boolean {
    return this.name === name || this.aliases.includes(name);
  }

  getArgs(args: Array<string>): ParsedArgs {
    const parsed = this.args.parse(args);
    parsed[this.label] = args.join(' ');
    return parsed;
  }

  getRatelimit(cacheId: string): CommandRatelimitItem | null {
    if (this.ratelimit !== null) {
      return this.ratelimit.get(cacheId);
    }
    return null;
  }
}


/**
 * Command Ratelimit Item
 * @category Command
 */
export interface CommandRatelimitItem {
  start: number;
  timeout: ReturnType<typeof setTimeout>;
  usages: number;
}

/**
 * Command Ratelimit Options and Cache
 * @category Command
 */
export class CommandRatelimit {
  readonly command: Command;
  readonly cache = new Map<string, CommandRatelimitItem>();
  duration: number = 5000;
  limit: number = 5;
  type: string = CommandRatelimitTypes.USER;

  constructor(
    command: Command,
    options: boolean | CommandRatelimitOptions = {},
  ) {
    options = <CommandRatelimitOptions> Object.assign({}, options);
    this.command = command;

    this.duration = options.duration || this.duration;
    this.limit = options.limit || this.limit;
    this.type = (options.type || this.type).toLowerCase();
    if (!COMMAND_RATELIMIT_TYPES.includes(this.type)) {
      this.type = CommandRatelimitTypes.USER;
    }
    Object.defineProperties(this, {
      cache: {enumerable: false, writable: false},
      command: {enumerable: false, writable: false},
      duration: {configurable: true, writable: false},
      limit: {configurable: true, writable: false},
      type: {configurable: true, writable: false},
    });
  }

  get(cacheId: string): CommandRatelimitItem {
    let ratelimit: CommandRatelimitItem;
    if (this.cache.has(cacheId)) {
      ratelimit = <CommandRatelimitItem> this.cache.get(cacheId);
    } else {
      ratelimit = {
        start: Date.now(),
        timeout: setTimeout(() => {
          this.cache.delete(cacheId);
        }, this.duration),
        usages: 0,
      };
      this.cache.set(cacheId, ratelimit);
    }
    return ratelimit;
  }
}
