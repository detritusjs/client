import { CommandAttributes, CommandClient } from '../commandclient';
import { 
  CommandRatelimitTypes,
  COMMAND_RATELIMIT_TYPES,
} from '../constants';

import { ArgumentOptions, Argument } from './argument';
import { ArgumentParser, ParsedArgs, ParsedErrors } from './argumentparser';
import { Context } from './context';


/**
 * @category Command
 */
export type CommandCallbackBefore = (context: Context) => Promise<boolean> | boolean;

/**
 * @category Command
 */
export type CommandCallbackBeforeRun = (context: Context, args: ParsedArgs) => Promise<boolean> | boolean;

/**
 * @category Command
 */
export type CommandCallbackCancel = (context: Context) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackCancelRun = (context: Context, args: ParsedArgs) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackError = (context: Context, args: ParsedArgs, error: any) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackSuccess = (context: Context, args: ParsedArgs) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackRatelimit = (context: Context, ratelimit: CommandRatelimitItem, remaining: number) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackRun = (context: Context, args: ParsedArgs) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackRunError = (context: Context, args: ParsedArgs, error: any) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackTypeError = (context: Context, args: ParsedArgs, errors: ParsedErrors) => Promise<any> | any;

/**
 * Command Options
 * @category Command Options
 */
export interface CommandOptions extends ArgumentOptions {
  _file?: string,
  args?: Array<ArgumentOptions>,
  disableDm?: boolean,
  disableDmReply?: boolean,
  extras?: {[key: string]: any},
  name: string,
  priority?: number,
  ratelimit?: boolean | CommandRatelimitOptions | null,
  responseOptional?: boolean,

  onBefore?: CommandCallbackBefore,
  onBeforeRun?: CommandCallbackBeforeRun,
  onCancel?: CommandCallbackCancel,
  onCancelRun?: CommandCallbackCancelRun,
  onError?: CommandCallbackError,
  run?: CommandCallbackRun,
  onRatelimit?: CommandCallbackRatelimit,
  onRunError?: CommandCallbackRunError,
  onSuccess?: CommandCallbackSuccess,
  onTypeError?: CommandCallbackTypeError,
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

  arg: Argument;
  args: ArgumentParser;
  disableDm: boolean = false;
  disableDmReply: boolean = false;
  extras: {[key: string]: any};
  priority: number = 0;
  ratelimit: CommandRatelimit | null = null;
  responseOptional: boolean = false;

  onBefore?: CommandCallbackBefore;
  onBeforeRun?: CommandCallbackBeforeRun;
  onCancel?: CommandCallbackCancel;
  onCancelRun?: CommandCallbackCancelRun;
  onError?: CommandCallbackError;
  run?: CommandCallbackRun;
  onRatelimit?: CommandCallbackRatelimit;
  onRunError?: CommandCallbackRunError;
  onSuccess?: CommandCallbackSuccess;
  onTypeError?: CommandCallbackTypeError;

  constructor(
    commandClient: CommandClient,
    options: CommandOptions,
  ) {
    this.commandClient = commandClient;

    this.arg = new Argument(Object.assign({prefix: ''}, options));
    this.args = new ArgumentParser(options.args);
    this.disableDm = !!options.disableDm;
    this.disableDmReply = !!options.disableDmReply;
    this.extras = Object.assign({}, options.extras);
    this.priority = options.priority || this.priority;
    this.responseOptional = !!options.responseOptional;

    if (options._file) {
      this._file = options._file;
    }

    if (options.ratelimit) {
      this.ratelimit = new CommandRatelimit(this, options.ratelimit);
    }
    Object.defineProperties(this, {
      _file: {configurable: true, writable: false},
      client: {enumerable: false, writable: false},
      commandClient: {enumerable: false, writable: false},
      ratelimit: {enumerable: false, writable: false},
    });

    this.onBefore = options.onBefore;
    this.onBeforeRun = options.onBeforeRun;
    this.onCancel = options.onCancel;
    this.onCancelRun = options.onCancelRun;
    this.onError = options.onError;
    this.run = options.run;
    this.onRatelimit = options.onRatelimit;
    this.onRunError = options.onRunError;
    this.onSuccess = options.onSuccess;
    this.onTypeError = options.onTypeError;
  }

  get aliases(): Array<string> {
    return this.arg.aliases;
  }

  get label(): string {
    return this.arg.label;
  }

  get name(): string {
    return this.arg.name;
  }

  check(name: string): boolean {
    return this.arg.check(name);
  }

  async getArgs(
    attributes: CommandAttributes,
    context: Context,
  ): Promise<{errors: ParsedErrors, parsed: ParsedArgs}> {
    const {errors, parsed} = await this.args.parse(attributes, context);
    try {
      parsed[this.label] = await this.arg.parse(attributes.content, context);
    } catch(error) {
      errors[this.label] = error;
    }
    return {errors, parsed};
  }

  getName(content: string): null | string {
    return this.arg.getName(content);
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
  replied: boolean,
  start: number,
  timeout: ReturnType<typeof setTimeout>,
  usages: number,
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
        replied: false,
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
