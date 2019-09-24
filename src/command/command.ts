import { CommandAttributes, CommandClient } from '../commandclient';
import { Message } from '../structures/message';

import { ArgumentOptions, Argument } from './argument';
import { ArgumentParser, ParsedArgs, ParsedErrors } from './argumentparser';
import { Context } from './context';
import { CommandRatelimit, CommandRatelimitItem, CommandRatelimitOptions } from './ratelimit';


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
export type CommandCallbackCancel = (context: Context) => Promise<any | Message> | any | Message;

/**
 * @category Command
 */
export type CommandCallbackCancelRun = (context: Context, args: ParsedArgs) => Promise<any | Message> | any | Message;

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
export type CommandCallbackRatelimit = (
  context: Context,
  ratelimits: Array<{item: CommandRatelimitItem, ratelimit: CommandRatelimit, remaining: number}>,
  metadata: {global: boolean, now: number},
) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackRun = (context: Context, args: ParsedArgs) => Promise<any | Message> | any | Message;

/**
 * @category Command
 */
export type CommandCallbackRunError = (context: Context, args: ParsedArgs, error: any) => Promise<any> | any;

/**
 * @category Command
 */
export type CommandCallbackTypeError = (context: Context, args: ParsedArgs, errors: ParsedErrors) => Promise<any | Message> | any | Message;

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
  ratelimits?: Array<CommandRatelimitOptions>;
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
  ratelimits: Array<CommandRatelimit> = [];
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
      this.ratelimits.push(new CommandRatelimit(options.ratelimit));
    }
    if (options.ratelimits) {
      for (let rOptions of options.ratelimits) {
        const rType = (rOptions.type || '').toLowerCase();
        if (this.ratelimits.some((ratelimit) => ratelimit.type === rType)) {
          throw new Error(`Ratelimit with type ${rType} already exists`);
        }
        this.ratelimits.push(new CommandRatelimit(rOptions));
      }
    }

    Object.defineProperties(this, {
      _file: {configurable: true, writable: false},
      client: {enumerable: false, writable: false},
      commandClient: {enumerable: false, writable: false},
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

  get names(): Array<string> {
    return this.arg.names;
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
}
