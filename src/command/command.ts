import { CommandAttributes, CommandClient } from '../commandclient';
import { Permissions } from '../constants';
import { Message } from '../structures/message';

import { ArgumentOptions, Argument, ArgumentDefault, ArgumentType } from './argument';
import { ArgumentParser, ParsedArgs, ParsedErrors } from './argumentparser';
import { Context } from './context';
import { CommandRatelimit, CommandRatelimitItem, CommandRatelimitOptions } from './ratelimit';


export type FailedPermissions = Array<bigint>;

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
export type CommandCallbackPermissionsFail = (context: Context, permissions: FailedPermissions) => Promise<any> | any;

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
  metadata?: {[key: string]: any},
  name: string,
  permissions?: Array<bigint | number>,
  permissionsClient?: Array<bigint | number>,
  permissionsIgnoreClientOwner?: boolean,
  priority?: number,
  ratelimit?: boolean | CommandRatelimitOptions | null,
  ratelimits?: Array<CommandRatelimitOptions>,
  responseOptional?: boolean,
  triggerTypingAfter?: number,

  onBefore?: CommandCallbackBefore,
  onBeforeRun?: CommandCallbackBeforeRun,
  onCancel?: CommandCallbackCancel,
  onCancelRun?: CommandCallbackCancelRun,
  onError?: CommandCallbackError,
  onPermissionsFail?: CommandCallbackPermissionsFail,
  onPermissionsFailClient?: CommandCallbackPermissionsFail,
  onRatelimit?: CommandCallbackRatelimit,
  run?: CommandCallbackRun,
  onRunError?: CommandCallbackRunError,
  onSuccess?: CommandCallbackSuccess,
  onTypeError?: CommandCallbackTypeError,
}


/**
 * Command itself
 * Command flow is ratelimit check -> permission check -> `onBefore` -> arg parse -> `onBeforeRun` -> `run` -> `onSuccess | onRunError`
 * @category Command
 */
export class Command<ParsedArgsFinished = ParsedArgs> {
  readonly _file?: string;
  readonly argParser = new ArgumentParser();
  readonly commandClient: CommandClient;

  arg: Argument;
  disableDm: boolean = false;
  disableDmReply: boolean = false;
  metadata: {[key: string]: any} = {};
  permissions?: Array<bigint>;
  permissionsClient?: Array<bigint>;
  permissionsIgnoreClientOwner?: boolean = false;
  priority: number = 0;
  ratelimits: Array<CommandRatelimit> = [];
  responseOptional: boolean = false;
  triggerTypingAfter: number = -1;

  onBefore?(context: Context): Promise<boolean> | boolean;
  onBeforeRun?(context: Context, args: ParsedArgs): Promise<boolean> | boolean;
  onCancel?(context: Context): Promise<any | Message> | any | Message;
  onCancelRun?(context: Context, args: ParsedArgs): Promise<any | Message> | any | Message;
  onError?(context: Context, args: ParsedArgs, error: any): Promise<any> | any;
  onPermissionsFail?(context: Context, permissions: FailedPermissions): Promise<any> | any;
  onPermissionsFailClient?(context: Context, permissions: FailedPermissions): Promise<any> | any;
  onRatelimit?(context: Context, ratelimits: Array<{item: CommandRatelimitItem, ratelimit: CommandRatelimit, remaining: number}>, metadata: {global: boolean, now: number}): Promise<any> | any;
  run?(context: Context, args: ParsedArgsFinished): Promise<any | Message> | any | Message;
  onRunError?(context: Context, args: ParsedArgsFinished, error: any): Promise<any> | any;
  onSuccess?(context: Context, args: ParsedArgsFinished): Promise<any> | any;
  onTypeError?(context: Context, args: ParsedArgs, errors: ParsedErrors): Promise<any | Message> | any | Message;

  constructor(
    commandClient: CommandClient,
    options: CommandOptions,
  ) {
    this.commandClient = commandClient;
    options = Object.assign({}, options);

    this.arg = new Argument(Object.assign({prefix: ''}, options, {metadata: undefined}));
    this.disableDm = !!options.disableDm;
    this.disableDmReply = !!options.disableDmReply;
    this.metadata = Object.assign(this.metadata, options.metadata);
    this.permissions = (options.permissions) ? options.permissions.map((x) => BigInt(x)) : undefined;
    this.permissionsClient = (options.permissionsClient) ? options.permissionsClient.map((x) => BigInt(x)) : undefined;
    this.permissionsIgnoreClientOwner = !!options.permissionsIgnoreClientOwner;
    this.priority = options.priority || this.priority;
    this.responseOptional = !!options.responseOptional;

    if (options.args) {
      this.args = options.args;
    }

    if (options.triggerTypingAfter !== undefined) {
      this.triggerTypingAfter = Math.max(options.triggerTypingAfter, this.triggerTypingAfter);
    }

    if (options._file) {
      this._file = options._file;
    }

    if (options.ratelimit) {
      this.ratelimits.push(new CommandRatelimit(options.ratelimit, this));
    }
    if (options.ratelimits) {
      for (let rOptions of options.ratelimits) {
        if (typeof(rOptions.type) === 'string') {
          const rType = (rOptions.type || '').toLowerCase();
          if (this.ratelimits.some((ratelimit) => ratelimit.type === rType)) {
            throw new Error(`Ratelimit with type ${rType} already exists`);
          }
        }
        this.ratelimits.push(new CommandRatelimit(rOptions, this));
      }
    }

    Object.defineProperties(this, {
      _file: {configurable: true, writable: false},
      client: {enumerable: false, writable: false},
      commandClient: {enumerable: false, writable: false},
    });

    this.onBefore = options.onBefore || this.onBefore;
    this.onBeforeRun = options.onBeforeRun || this.onBeforeRun;
    this.onCancel = options.onCancel || this.onCancel;
    this.onCancelRun = options.onCancelRun || this.onCancelRun;
    this.onError = options.onError || this.onError;
    this.onPermissionsFail = options.onPermissionsFail || this.onPermissionsFail;
    this.onPermissionsFailClient = options.onPermissionsFailClient || this.onPermissionsFailClient;
    this.run = options.run || this.run;
    this.onRatelimit = options.onRatelimit || this.onRatelimit;
    this.onRunError = options.onRunError || this.onRunError;
    this.onSuccess = options.onSuccess || this.onSuccess;
    this.onTypeError = options.onTypeError || this.onTypeError;
  }

  get aliases(): Array<string> {
    return this.arg.aliases;
  }

  set aliases(value: Array<string>) {
    this.setAliases(value);
  }

  set args(value: Array<ArgumentOptions>) {
    this.setArgs(value);
  }

  get choices() {
    return this.arg.choices;
  }

  set choices(value: Array<any> | undefined) {
    this.setChoices(value);
  }

  get default(): ArgumentDefault {
    return this.arg.default;
  }

  set default(value: ArgumentDefault) {
    this.setDefault(value);
  }

  get help() {
    return this.arg.help;
  }

  set help(value: string) {
    this.setHelp(value);
  }

  get label() {
    return this.arg.label;
  }

  set label(value: string) {
    this.setLabel(value);
  }

  get name() {
    return this.arg.name;
  }

  set name(value: string) {
    this.setName(value);
  }

  get names() {
    return this.arg.names;
  }

  set prefixes(value: Array<string>) {
    this.setPrefixes(value);
  }

  set type(value: ArgumentType) {
    this.setType(value);
  }

  setAliases(value: Array<string>) {
    this.arg.aliases = value;
    return this;
  }

  setArgs(value: Array<ArgumentOptions>) {
    this.argParser.initialize(value);
    return this;
  }

  setChoices(value: Array<any> | undefined) {
    this.arg.choices = value;
    return this;
  }

  setDefault(value: ArgumentDefault) {
    this.arg.default = value;
    return this;
  }

  setHelp(value: string) {
    this.arg.help = value;
    return this;
  }

  setLabel(value: string) {
    this.arg.label = value;
    return this;
  }

  setName(value: string) {
    this.arg.name = value.toLowerCase();
    return this;
  }

  setPrefixes(value: Array<string>) {
    this.arg.setPrefixes(value);
    return this;
  }

  setType(value: ArgumentType): this {
    this.arg.type = value;
    return this;
  }

  check(name: string): boolean {
    return this.arg.check(name);
  }

  async getArgs(
    attributes: CommandAttributes,
    context: Context,
  ): Promise<{errors: ParsedErrors, parsed: ParsedArgs}> {
    const { errors, parsed } = await this.argParser.parse(attributes, context);
    const { arg } = this;
    try {
      if (this.arg.positionalArgs) {
        const positional = await this.arg.positionalArgs.parse(attributes, context);
        Object.assign(errors, positional.errors);
        Object.assign(parsed, positional.parsed);
      } else {
        let value: any = attributes.content.trim();
        if (value) {
          value = await arg.parse(value, context);
        } else {
          if (arg.default !== undefined) {
            if (typeof(arg.default) === 'function') {
              value = await Promise.resolve(arg.default(context));
            } else {
              value = arg.default;
            }
            if (typeof(value) === 'string') {
              value = await arg.parse(value, context);
            }
          } else if (arg.required) {
            throw new Error(arg.help || 'Missing required parameter');
          } else {
            value = await arg.parse(value, context);
          }
        }
        parsed[arg.label] = value;
      }
    } catch(error) {
      errors[arg.label] = error;
    }
    return {errors, parsed};
  }

  getName(content: string): null | string {
    return this.arg.getName(content);
  }
}
