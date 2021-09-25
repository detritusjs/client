import * as Crypto from 'crypto';

import { CommandRatelimit, CommandRatelimitItem, CommandRatelimitOptions } from '../commandratelimit';
import { ApplicationCommandOptionTypes, ApplicationCommandTypes, DetritusKeys, DiscordKeys } from '../constants';

import { BaseSet } from '../collections/baseset';
import { BaseCollection } from '../collections/basecollection';
import { Structure } from '../structures/basestructure';
import {
  InteractionDataApplicationCommand,
  InteractionDataApplicationCommandOption,
} from '../structures/interaction';

import { InteractionAutoCompleteContext, InteractionContext } from './context';


export type ParsedArgs = Record<string, any>;
export type ParsedErrors = Record<string, Error>;

export type CommandRatelimitInfo = {item: CommandRatelimitItem, ratelimit: CommandRatelimit, remaining: number};
export type CommandRatelimitMetadata = {global: boolean, now: number};

export type FailedPermissions = Array<bigint>;

export type InteractionCommandInvoker = InteractionCommand | InteractionCommandOption;


/**
 * @category InteractionCommand
 */
export type ArgumentConverter = (value: any, context: InteractionContext) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type ArgumentDefault = ((context: InteractionContext) => Promise<any> | any) | any;


/**
 * @category InteractionCommand
 */
 export type CommandCallbackAutoComplete = (context: InteractionAutoCompleteContext) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackDmBlocked = (context: InteractionContext) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackLoadingTrigger = (context: InteractionContext) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackBefore = (context: InteractionContext) => Promise<boolean> | boolean;

/**
 * @category InteractionCommand
 */
export type CommandCallbackBeforeRun = (context: InteractionContext, args: ParsedArgs) => Promise<boolean> | boolean;

/**
 * @category InteractionCommand
 */
export type CommandCallbackCancel = (context: InteractionContext) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackCancelRun = (context: InteractionContext, args: ParsedArgs) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackError = (context: InteractionContext, error: any) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackPermissionsFail = (context: InteractionContext, permissions: FailedPermissions) => Promise<any> | any;

/**
* @category InteractionCommand
*/
export type CommandCallbackRatelimit = (
 context: InteractionContext,
 ratelimits: Array<CommandRatelimitInfo>,
 metadata: CommandRatelimitMetadata,
) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackRun = (context: InteractionContext, args: ParsedArgs) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackRunError = (context: InteractionContext, args: ParsedArgs, error: any) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackSuccess = (context: InteractionContext) => Promise<any> | any;

/**
 * @category InteractionCommand
 */
export type CommandCallbackValueError = (context: InteractionContext, args: ParsedArgs, errors: ParsedErrors) => Promise<any> | any;


const ON_FUNCTION_NAMES = Object.freeze([
  'onAutoComplete',
  'onDmBlocked',
  'onLoadingTrigger',
  'onBefore',
  'onBeforeRun',
  'onCancel',
  'onCancelRun',
  'onError',
  'onPermissionsFail',
  'onPermissionsFailClient',
  'onRatelimit',
  'run',
  'onRunError',
  'onSuccess',
  'onValueError',
]);

const ON_FUNCTION_NAMES_FOR_OPTION = Object.freeze([
  'onAutoComplete',
]);

const SET_VARIABLE_NAMES = Object.freeze([
  'disableDm',
  'permissions',
  'permissionsClient',
  'permissionsIgnoreClientOwner',
  'ratelimits',
  'triggerLoadingAfter',
  'triggerLoadingAsEphemeral',
]);

/**
 * Command Options
 * @category Command Options
 */
export interface InteractionCommandOptions {
  _file?: string,
  default_permission?: boolean,
  defaultPermission?: boolean,
  description?: string,
  name?: string,
  options?: Array<InteractionCommandOption | InteractionCommandOptionOptions | typeof InteractionCommandOption>,
  type?: ApplicationCommandTypes,

  disableDm?: boolean,
  global?: boolean,
  guildIds?: Array<string>,
  metadata?: Record<string, any>,
  permissions?: Array<bigint | number>,
  permissionsClient?: Array<bigint | number>,
  permissionsIgnoreClientOwner?: boolean,
  ratelimit?: boolean | CommandRatelimitOptions | null,
  ratelimits?: Array<CommandRatelimitOptions>,
  triggerLoadingAfter?: number,
  triggerLoadingAsEphemeral?: boolean,

  onAutoComplete?: CommandCallbackAutoComplete,
  onDmBlocked?: CommandCallbackDmBlocked,
  onLoadingTrigger?: CommandCallbackLoadingTrigger,
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
  onValueError?: CommandCallbackValueError,
}

export interface InteractionCommandOptionOptions {
  _file?: string,
  autocomplete?: boolean,
  choices?: Array<InteractionCommandOptionChoice | InteractionCommandOptionChoiceOptions>,
  default?: ArgumentDefault,
  description?: string,
  name?: string,
  options?: Array<InteractionCommandOption | InteractionCommandOptionOptions | typeof InteractionCommandOption>,
  required?: boolean,
  type?: ApplicationCommandOptionTypes | StringConstructor | BooleanConstructor | NumberConstructor | string,
  value?: ArgumentConverter,

  disableDm?: boolean,
  label?: string,
  metadata?: Record<string, any>,
  permissions?: Array<bigint | number>,
  permissionsClient?: Array<bigint | number>,
  permissionsIgnoreClientOwner?: boolean,
  ratelimit?: boolean | CommandRatelimitOptions | null,
  ratelimits?: Array<CommandRatelimitOptions>,
  triggerLoadingAfter?: number,
  triggerLoadingAsEphemeral?: boolean,

  onAutoComplete?: CommandCallbackAutoComplete,
  onDmBlocked?: CommandCallbackDmBlocked,
  onLoadingTrigger?: CommandCallbackLoadingTrigger,
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
  onValueError?: CommandCallbackValueError,
}

export interface InteractionCommandOptionChoiceOptions {
  name?: string,
  value?: number | string,
}

const keysInteractionCommand = new BaseSet<string>([
  DiscordKeys.DEFAULT_PERMISSION,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.IDS,
  DiscordKeys.NAME,
  DiscordKeys.OPTIONS,
  DiscordKeys.TYPE,
]);

const keysSkipDifferenceInteractionCommand = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.IDS,
]);

export class InteractionCommand<ParsedArgsFinished = ParsedArgs> extends Structure {
  readonly _file?: string;
  readonly _keys = keysInteractionCommand;
  readonly _keysSkipDifference = keysSkipDifferenceInteractionCommand;
  _options?: BaseCollection<string, InteractionCommandOption>;

  defaultPermission: boolean = true;
  description: string = '';
  ids = new BaseCollection<string, string>();
  global: boolean = true;
  guildIds?: BaseSet<string>;
  name: string = '';
  type: ApplicationCommandTypes = ApplicationCommandTypes.CHAT_INPUT;

  disableDm?: boolean;
  metadata: Record<string, any> = {};
  permissions?: Array<bigint>;
  permissionsClient?: Array<bigint>;
  permissionsIgnoreClientOwner?: boolean;
  ratelimits: Array<CommandRatelimit> = [];
  triggerLoadingAfter?: number;
  triggerLoadingAsEphemeral?: boolean;

  onAutoComplete?(context: InteractionAutoCompleteContext): Promise<any> | any;
  onDmBlocked?(context: InteractionContext): Promise<any> | any;
  onLoadingTrigger?(context: InteractionContext): Promise<any> | any;
  onBefore?(context: InteractionContext): Promise<boolean> | boolean;
  onBeforeRun?(context: InteractionContext, args: ParsedArgs): Promise<boolean> | boolean;
  onCancel?(context: InteractionContext): Promise<any> | any;
  onCancelRun?(context: InteractionContext, args: ParsedArgs): Promise<any> | any;
  onError?(context: InteractionContext, args: ParsedArgs, error: any): Promise<any> | any;
  onPermissionsFail?(context: InteractionContext, permissions: FailedPermissions): Promise<any> | any;
  onPermissionsFailClient?(context: InteractionContext, permissions: FailedPermissions): Promise<any> | any;
  onRatelimit?(context: InteractionContext, ratelimits: Array<CommandRatelimitInfo>, metadata: CommandRatelimitMetadata): Promise<any> | any;
  run?(context: InteractionContext, args: ParsedArgsFinished): Promise<any> | any;
  onRunError?(context: InteractionContext, args: ParsedArgsFinished, error: any): Promise<any> | any;
  onSuccess?(context: InteractionContext, args: ParsedArgsFinished): Promise<any> | any;
  onValueError?(context: InteractionContext, args: ParsedArgs, errors: ParsedErrors): Promise<any> | any;

  constructor(data: InteractionCommandOptions = {}) {
    super();
    if (DetritusKeys[DiscordKeys.DEFAULT_PERMISSION] in data) {
      (data as any)[DiscordKeys.DEFAULT_PERMISSION] = (data as any)[DetritusKeys[DiscordKeys.DEFAULT_PERMISSION]];
    }

    this.disableDm = (data.disableDm !== undefined) ? !!data.disableDm : this.disableDm;
    this.global = (data.global !== undefined) ? !!data.global : this.global;
    this.metadata = Object.assign(this.metadata, data.metadata);
    this.permissions = (data.permissions) ? data.permissions.map((x) => BigInt(x)) : undefined;
    this.permissionsClient = (data.permissionsClient) ? data.permissionsClient.map((x) => BigInt(x)) : undefined;
    this.permissionsIgnoreClientOwner = (data.permissionsIgnoreClientOwner !== undefined) ? !!data.permissionsIgnoreClientOwner : undefined;
    this.triggerLoadingAfter = (data.triggerLoadingAfter !== undefined) ? data.triggerLoadingAfter : this.triggerLoadingAfter;
    this.triggerLoadingAsEphemeral = (data.triggerLoadingAsEphemeral !== undefined) ? data.triggerLoadingAsEphemeral : this.triggerLoadingAsEphemeral;

    if (data.ratelimit) {
      this.ratelimits.push(new CommandRatelimit(data.ratelimit, this));
    }
    if (data.ratelimits) {
      for (let rOptions of data.ratelimits) {
        if (typeof(rOptions.type) === 'string') {
          const rType = (rOptions.type || '').toLowerCase();
          if (this.ratelimits.some((ratelimit) => ratelimit.type === rType)) {
            throw new Error(`Ratelimit with type ${rType} already exists`);
          }
        }
        this.ratelimits.push(new CommandRatelimit(rOptions, this));
      }
    }

    if (data.guildIds) {
      if (data.global === undefined) {
        this.global = false;
      }
      this.guildIds = new BaseSet<string>(data.guildIds);
    }

    if (data._file) {
      this._file = data._file;
    }
    Object.defineProperties(this, {
      _file: {configurable: true, writable: false},
    });

    this.onAutoComplete = data.onAutoComplete || this.onAutoComplete;
    this.onDmBlocked = data.onDmBlocked || this.onDmBlocked;
    this.onLoadingTrigger = data.onLoadingTrigger || this.onLoadingTrigger;
    this.onBefore = data.onBefore || this.onBefore;
    this.onBeforeRun = data.onBeforeRun || this.onBeforeRun;
    this.onCancel = data.onCancel || this.onCancel;
    this.onCancelRun = data.onCancelRun || this.onCancelRun;
    this.onError = data.onError || this.onError;
    this.onPermissionsFail = data.onPermissionsFail || this.onPermissionsFail;
    this.onPermissionsFailClient = data.onPermissionsFailClient || this.onPermissionsFailClient;
    this.onRatelimit = data.onRatelimit || this.onRatelimit;
    this.run = data.run || this.run;
    this.onRunError = data.onRunError || this.onRunError;
    this.onSuccess = data.onSuccess || this.onSuccess;
    this.onValueError = data.onValueError || this.onValueError;

    this.merge(data);
  }

  get _optionsKey(): string {
    return (this._options) ? this._options.map((x) => x.key).join(':') : '';
  }

  get fullName(): string {
    return this.name;
  }

  get hash(): string {
    return Crypto.createHash('md5').update(this.key).digest('hex');
  }

  get hasRun(): boolean {
    if (this.isGroup && this._options) {
      return this._options.every((option) => option.hasRun);
    }
    return typeof(this.run) === 'function';
  }

  get isGroup(): boolean {
    if (this._options) {
      return this._options.some((option) => option.isSubCommand || option.isSubCommandGroup);
    }
    return false;
  }

  get isContextCommand(): boolean {
    return this.isContextCommandMessage || this.isContextCommandUser;
  }

  get isContextCommandMessage(): boolean {
    return this.type === ApplicationCommandTypes.MESSAGE;
  }

  get isContextCommandUser(): boolean {
    return this.type === ApplicationCommandTypes.USER;
  }

  get isSlashCommand(): boolean {
    return this.type === ApplicationCommandTypes.CHAT_INPUT;
  }

  get key(): string {
    return `${this.name}-${this.description}-${this.type}-${this._optionsKey}`;
  }

  get length(): number {
    return this.description.length + this.name.length + this.lengthOptions;
  }

  get lengthOptions(): number {
    if (this._options) {
      return this._options.reduce((x, option) => {
        return x + option.length;
      }, 0);
    }
    return 0;
  }

  get options(): Array<InteractionCommandOption> | undefined {
    return (this._options) ? this._options.toArray() : this._options;
  }

  set options(value: Array<InteractionCommandOption> | undefined) {
    if (value) {
      if (!this._options) {
        this._options = new BaseCollection<string, InteractionCommandOption>();
      }
      this._options.clear();
      for (let option of value) {
        this._options.set(option.name, option);
      }
    } else {
      this._options = undefined;
    }
  }

  getInvoker(data: InteractionDataApplicationCommand): InteractionCommandInvoker | null {
    if (this.name === data.name) {
      if (data.options && data.options.some((option) => option.isSubCommand || option.isSubCommandGroup)) {
        return this.getInvokerOption(data.options);
      }
      return this;
    }
    return null;
  }

  getInvokerForAutoComplete(data: InteractionDataApplicationCommand): InteractionCommandInvoker | null {
    if (this.name === data.name) {
      if (data.options) {
        return this.getInvokerOptionForAutoComplete(data.options);
      }
    }
    return null;
  }

  getInvokerOption(
    options: BaseCollection<string, InteractionDataApplicationCommandOption>,
  ): InteractionCommandOption | null {
    if (this._options) {
      for (let [name, option] of options) {
        if (!this._options.has(name)) {
          return null;
        }
        const x = this._options.get(name)!;
        if (x.isSubCommand || x.isSubCommandGroup) {
          return x.getInvoker(option);
        }
      }
    }
    return null;
  }

  getInvokerOptionForAutoComplete(
    options: BaseCollection<string, InteractionDataApplicationCommandOption>,
  ): InteractionCommandOption | null {
    if (this._options) {
      const focused = options.find((option) => !!option.focused);
      if (focused) {
        return this._options.get(focused.name) || null;
      }

      for (let [name, option] of options) {
        if (!this._options.has(name)) {
          return null;
        }
        const x = this._options.get(name)!;
        if (x.isSubCommand || x.isSubCommandGroup) {
          return x.getInvokerForAutoComplete(option);
        }
      }
    }
    return null;
  }

  _transferValuesToChildren(): void {
    if (this._options) {
      for (let [name, option] of this._options) {
        option._transferValuesToChildren(this);
      }
    }
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.IDS: {
        this.ids = new BaseCollection<string, string>(value);
      }; return;
      case DiscordKeys.OPTIONS: {
        if (value) {
          if (!this._options) {
            this._options = new BaseCollection<string, InteractionCommandOption>();
          }
          this._options.clear();
          for (let raw of value) {
            let option: InteractionCommandOption;
            if (typeof(raw) === 'function') {
              option = new raw();
            } else if (raw instanceof InteractionCommandOption) {
              option = raw;
            } else {
              option = new InteractionCommandOption(raw)
            }
            option._transferValuesToChildren(this);
            this._options.set(option.name, option);
          }
        } else {
          this._options = undefined;
        }
      }; return;
    }
    return super.mergeValue(key, value);
  }
}


const keysInteractionCommandOption = new BaseSet<string>([
  DiscordKeys.AUTOCOMPLETE,
  DiscordKeys.CHOICES,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.NAME,
  DiscordKeys.OPTIONS,
  DiscordKeys.REQUIRED,
  DiscordKeys.TYPE,
]);

export class InteractionCommandOption<ParsedArgsFinished = ParsedArgs> extends Structure {
  readonly parent?: InteractionCommand | InteractionCommandOption;

  readonly _file?: string;
  readonly _keys = keysInteractionCommandOption;
  _options?: BaseCollection<string, InteractionCommandOption>;

  autocomplete?: boolean;
  choices?: Array<InteractionCommandOptionChoice>;
  description: string = '';
  name: string = '';
  required?: boolean;
  type: ApplicationCommandOptionTypes = ApplicationCommandOptionTypes.STRING;

  default?: ArgumentDefault;
  disableDm?: boolean;
  label?: string;
  metadata: Record<string, any> = {};
  permissions?: Array<bigint>;
  permissionsClient?: Array<bigint>;
  permissionsIgnoreClientOwner?: boolean;
  ratelimits?: Array<CommandRatelimit>;
  triggerLoadingAfter?: number;
  triggerLoadingAsEphemeral?: boolean;
  value?: ArgumentConverter;

  onAutoComplete?(context: InteractionAutoCompleteContext): Promise<any> | any;
  onDmBlocked?(context: InteractionContext): Promise<any> | any;
  onLoadingTrigger?(context: InteractionContext): Promise<any> | any;
  onBefore?(context: InteractionContext): Promise<boolean> | boolean;
  onBeforeRun?(context: InteractionContext, args: ParsedArgs): Promise<boolean> | boolean;
  onCancel?(context: InteractionContext): Promise<any> | any;
  onCancelRun?(context: InteractionContext, args: ParsedArgs): Promise<any> | any;
  onError?(context: InteractionContext, args: ParsedArgs, error: any): Promise<any> | any;
  onPermissionsFail?(context: InteractionContext, permissions: FailedPermissions): Promise<any> | any;
  onPermissionsFailClient?(context: InteractionContext, permissions: FailedPermissions): Promise<any> | any;
  onRatelimit?(context: InteractionContext, ratelimits: Array<CommandRatelimitInfo>, metadata: CommandRatelimitMetadata): Promise<any> | any;
  run?(context: InteractionContext, args: ParsedArgsFinished): Promise<any> | any;
  onRunError?(context: InteractionContext, args: ParsedArgsFinished, error: any): Promise<any> | any;
  onSuccess?(context: InteractionContext, args: ParsedArgsFinished): Promise<any> | any;
  onValueError?(context: InteractionContext, args: ParsedArgs, errors: ParsedErrors): Promise<any> | any;

  constructor(data: InteractionCommandOptionOptions = {}) {
    super();

    this.disableDm = (data.disableDm !== undefined) ? !!data.disableDm : this.disableDm;
    this.label = data.label || this.label;
    this.metadata = Object.assign(this.metadata, data.metadata);
    this.permissions = (data.permissions) ? data.permissions.map((x) => BigInt(x)) : undefined;
    this.permissionsClient = (data.permissionsClient) ? data.permissionsClient.map((x) => BigInt(x)) : undefined;
    this.permissionsIgnoreClientOwner = (data.permissionsIgnoreClientOwner !== undefined) ? !!data.permissionsIgnoreClientOwner : undefined;
    this.triggerLoadingAfter = (data.triggerLoadingAfter !== undefined) ? data.triggerLoadingAfter : this.triggerLoadingAfter;
    this.triggerLoadingAsEphemeral = (data.triggerLoadingAsEphemeral !== undefined) ? data.triggerLoadingAsEphemeral : this.triggerLoadingAsEphemeral;

    if (data.ratelimit || data.ratelimits) {
      if (!this.ratelimits) {
        this.ratelimits = [];
      }
      if (data.ratelimit) {
        this.ratelimits.push(new CommandRatelimit(data.ratelimit, this));
      }
      if (data.ratelimits) {
        for (let rOptions of data.ratelimits) {
          if (typeof(rOptions.type) === 'string') {
            const rType = (rOptions.type || '').toLowerCase();
            if (this.ratelimits.some((ratelimit) => ratelimit.type === rType)) {
              throw new Error(`Ratelimit with type ${rType} already exists`);
            }
          }
          this.ratelimits.push(new CommandRatelimit(rOptions, this));
        }
      }
    }

    if (data.default !== undefined) {
      this.default = data.default;
    }

    if (typeof(data.value) === 'function') {
      this.value = data.value;
    }

    if (data._file) {
      this._file = data._file;
    }

    Object.defineProperties(this, {
      _file: {configurable: true, writable: false},
      parent: {configurable: true, writable: false},
    });

    this.onAutoComplete = data.onAutoComplete || this.onAutoComplete;
    this.onDmBlocked = data.onDmBlocked || this.onDmBlocked;
    this.onLoadingTrigger = data.onLoadingTrigger || this.onLoadingTrigger;
    this.onBefore = data.onBefore || this.onBefore;
    this.onBeforeRun = data.onBeforeRun || this.onBeforeRun;
    this.onCancel = data.onCancel || this.onCancel;
    this.onCancelRun = data.onCancelRun || this.onCancelRun;
    this.onError = data.onError || this.onError;
    this.onPermissionsFail = data.onPermissionsFail || this.onPermissionsFail;
    this.onPermissionsFailClient = data.onPermissionsFailClient || this.onPermissionsFailClient;
    this.onRatelimit = data.onRatelimit || this.onRatelimit;
    this.run = data.run || this.run;
    this.onRunError = data.onRunError || this.onRunError;
    this.onSuccess = data.onSuccess || this.onSuccess;
    this.onValueError = data.onValueError || this.onValueError;

    if (typeof(this.run) === 'function') {
      this.type = ApplicationCommandOptionTypes.SUB_COMMAND;
    }

    if (this.autocomplete === undefined && typeof(this.onAutoComplete) === 'function') {
      this.autocomplete = true;
    }

    this.merge(data);
  }

  get _choicesKey(): string {
    return (this.choices) ? this.choices.map((x) => x.key).join(':') : '';
  }

  get _optionsKey(): string {
    return (this._options) ? this._options.map((x) => x.key).join(':') : '';
  }

  get fullName(): string {
    if (this.parent) {
      return `${this.parent.fullName} ${this.name}`;
    }
    return this.name;
  }

  get hasRun(): boolean {
    if (this.isSubCommand) {
      return typeof(this.run) === 'function';
    } else if (this.isSubCommandGroup) {
      if (this._options) {
        return this._options.every((option) => option.hasRun);
      }
      return false;
    }
    return true;
  }

  get isSubCommand(): boolean {
    return this.type === ApplicationCommandOptionTypes.SUB_COMMAND;
  }

  get isSubCommandGroup(): boolean {
    return this.type === ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
  }

  get key(): string {
    return `${this.name}-${this.description}-${this.type}-${!!this.required}-${!!this.autocomplete}-${this._optionsKey}-${this._choicesKey}`;
  }

  get length(): number {
    return this.description.length + this.name.length + this.lengthOptions;
  }

  get lengthChoices(): number {
    if (this.choices) {
      return this.choices.reduce((x, choice) => {
        if (this.type === ApplicationCommandOptionTypes.INTEGER) {
          return choice.name.length;
        }
        return choice.length;
      }, 0);
    }
    return 0;
  }

  get lengthOptions(): number {
    if (this._options) {
      return this._options.reduce((x, option) => {
        return x + option.length;
      }, 0);
    }
    return 0;
  }

  get options(): Array<InteractionCommandOption> | undefined {
    return (this._options) ? this._options.toArray() : this._options;
  }

  set options(value: Array<InteractionCommandOption> | undefined) {
    if (value) {
      if (!this._options) {
        this._options = new BaseCollection<string, InteractionCommandOption>();
      }
      this._options.clear();
      for (let option of value) {
        option._transferValuesToChildren(this);
        this._options.set(option.name, option);
      }
      if (this._options.some((option) => option.isSubCommand)) {
        this.type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
      }
    } else {
      this._options = undefined;
    }
  }

  getInvoker(option: InteractionDataApplicationCommandOption): InteractionCommandOption | null {
    if (this.type === option.type && this.name === option.name) {
      if (this.isSubCommandGroup) {
        if (option.options && this._options) {
          for (let [name, x] of option.options) {
            if (!this._options.has(name)) {
              return null;
            }
            const localCommand = this._options.get(name)!;
            if (localCommand.isSubCommand || localCommand.isSubCommandGroup) {
              return localCommand.getInvoker(x);
            }
          }
        }
      }
      return this;
    }
    return null;
  }

  getInvokerForAutoComplete(option: InteractionDataApplicationCommandOption): InteractionCommandOption | null {
    if (this.type === option.type && this.name === option.name) {
      if (this.isSubCommand || this.isSubCommandGroup) {
        if (option.options && this._options) {
          const focused = option.options.find((option) => !!option.focused);
          if (focused) {
            return this._options.get(focused.name) || null;
          }
        }
      }
    }
    return null;
  }

  addChoice(name: InteractionCommandOptionChoice | InteractionCommandOptionChoiceOptions): InteractionCommandOptionChoice
  addChoice(name: string, value: number | string): InteractionCommandOptionChoice
  addChoice(name: InteractionCommandOptionChoice | InteractionCommandOptionChoiceOptions | string, value?: number | string): InteractionCommandOptionChoice {
    if (!this.choices) {
      this.choices = [];
    }
    let choice: InteractionCommandOptionChoice;
    if (typeof(name) === 'object') {
      choice = (name instanceof InteractionCommandOptionChoice) ? name : new InteractionCommandOptionChoice(name);
    } else {
      choice = new InteractionCommandOptionChoice({name, value});
    }
    this.choices.push(choice);
    return choice;
  }

  addOption(value: InteractionCommandOption | InteractionCommandOptionOptions | typeof InteractionCommandOption): InteractionCommandOption {
    if (!this.options) {
      this.options = [];
    }
    let option: InteractionCommandOption;
    if (typeof(value) === 'function') {
      option = new value();
    } else if (value instanceof InteractionCommandOption) {
      option = value;
    } else {
      option = new InteractionCommandOption(value);
    }
    this.options.push(option);
    return option;
  }

  setChoices(value: Array<InteractionCommandOptionChoice | InteractionCommandOptionChoiceOptions> = []): this {
    this.mergeValue(DiscordKeys.CHOICES, value);
    return this;
  }

  setDescription(value: string): this {
    this.mergeValue(DiscordKeys.DESCRIPTION, value);
    return this;
  }

  setName(value: string): this {
    this.mergeValue(DiscordKeys.NAME, value);
    return this;
  }

  setOptions(value: Array<InteractionCommandOption | InteractionCommandOptionOptions> = []): this {
    this.mergeValue(DiscordKeys.OPTIONS, value);
    return this;
  }

  setRequired(value: boolean): this {
    this.mergeValue(DiscordKeys.REQUIRED, value);
    return this;
  }

  setType(value: ApplicationCommandOptionTypes): this {
    this.mergeValue(DiscordKeys.TYPE, value);
    return this;
  }

  _transferValuesToChildren(parent: InteractionCommand | InteractionCommandOption): void {
    Object.defineProperty(this, 'parent', {value: parent});
    if (this.isSubCommand || this.isSubCommandGroup) {
      for (let name of ON_FUNCTION_NAMES) {
        if (typeof((this as any)[name]) !== 'function') {
          (this as any)[name] = (parent as any)[name];
        }
      }
      for (let name of SET_VARIABLE_NAMES) {
        if ((this as any)[name] === undefined) {
          switch (name) {
            case 'ratelimits': {
              if (parent.ratelimits && parent.ratelimits.length) {
                this.ratelimits = [];
                for (let ratelimit of parent.ratelimits) {
                  this.ratelimits.push(new CommandRatelimit(ratelimit, this));
                }
              }
            }; break;
            default: {
              (this as any)[name] = (parent as any)[name];
            };
          }
        }
      }
      if (this.isSubCommandGroup && this._options) {
        for (let [name, option] of this._options) {
          option._transferValuesToChildren(this);
        }
      }
    } else {
      for (let name of ON_FUNCTION_NAMES_FOR_OPTION) {
        if (typeof((this as any)[name]) !== 'function') {
          (this as any)[name] = (parent as any)[name];
        }
      }
    }
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.CHOICES: {
        if (value) {
          if (this.choices) {
            this.choices.length = 0;
          } else {
            this.choices = [];
          }
          for (let raw of value) {
            const choice = new InteractionCommandOptionChoice(raw);
            this.choices.push(choice);
          }
        } else {
          this.choices = value;
        }
      }; return;
      case DiscordKeys.OPTIONS: {
        if (value) {
          if (!this._options) {
            this._options = new BaseCollection<string, InteractionCommandOption>();
          }
          this._options.clear();
          for (let raw of value) {
            let option: InteractionCommandOption;
            if (typeof(raw) === 'function') {
              option = new raw();
            } else if (raw instanceof InteractionCommandOption) {
              option = raw;
            } else {
              option = new InteractionCommandOption(raw)
            }
            option._transferValuesToChildren(this);
            this._options.set(option.name, option);
          }
          this.type = ApplicationCommandOptionTypes.SUB_COMMAND;
          if (this._options.some((option) => option.isSubCommand)) {
            this.type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
          }
        } else {
          this._options = undefined;
        }
      }; return;
      case DiscordKeys.TYPE: {
        if (typeof(value) === 'string') {
          value = (ApplicationCommandOptionTypes as any)[value.toUpperCase()];
        } else if (typeof(value) === 'number') {
          // pass
        } else {
          switch (value) {
            case Boolean: value = ApplicationCommandOptionTypes.BOOLEAN; break;
            case Number: value = ApplicationCommandOptionTypes.INTEGER; break;
            case String: value = ApplicationCommandOptionTypes.STRING; break;
          }
        }
      }; break;
    }
    return super.mergeValue(key, value);
  }
}


const keysInteractionCommandOptionChoice = new BaseSet<string>([
  DiscordKeys.NAME,
  DiscordKeys.VALUE,
]);

export class InteractionCommandOptionChoice extends Structure {
  readonly _keys = keysInteractionCommandOptionChoice;

  name: string = '';
  value: number | string = '';

  constructor(data: InteractionCommandOptionChoiceOptions = {}) {
    super();
    this.merge(data);
  }

  get key(): string {
    return `${this.name}-${this.value}-${typeof(this.value)}`;
  }

  get length(): number {
    if (typeof(this.value) === 'string') {
      return this.name.length + this.value.length;
    }
    return this.name.length;
  }
}
