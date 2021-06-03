import * as Crypto from 'crypto';

import { ApplicationCommandOptionTypes, DetritusKeys, DiscordKeys } from '../constants';

import { BaseSet } from '../collections/baseset';
import { BaseCollection } from '../collections/basecollection';
import { Structure } from '../structures/basestructure';
import {
  InteractionDataApplicationCommand,
  InteractionDataApplicationCommandOption,
} from '../structures/interaction';

import { SlashContext } from './context';


export type ParsedArgs = Record<string, any>;


export type FailedPermissions = Array<bigint>;

/**
 * @category SlashCommand
 */
export type CommandCallbackBefore = (context: SlashContext) => Promise<boolean> | boolean;

/**
 * @category SlashCommand
 */
export type CommandCallbackBeforeRun = (context: SlashContext) => Promise<boolean> | boolean;

/**
 * @category SlashCommand
 */
export type CommandCallbackCancel = (context: SlashContext) => Promise<any> | any;

/**
 * @category SlashCommand
 */
export type CommandCallbackCancelRun = (context: SlashContext, args: ParsedArgs) => Promise<any> | any;

/**
 * @category SlashCommand
 */
export type CommandCallbackError = (context: SlashContext, error: any) => Promise<any> | any;

/**
 * @category SlashCommand
 */
export type CommandCallbackPermissionsFail = (context: SlashContext, permissions: FailedPermissions) => Promise<any> | any;

/**
 * @category SlashCommand
 */
export type CommandCallbackSuccess = (context: SlashContext) => Promise<any> | any;

/**
 * @category SlashCommand
 */
export type CommandCallbackRun = (context: SlashContext, args: ParsedArgs) => Promise<any> | any;

/**
 * @category SlashCommand
 */
export type CommandCallbackRunError = (context: SlashContext, args: ParsedArgs, error: any) => Promise<any> | any;


/**
 * Command Options
 * @category Command Options
 */
export interface SlashCommandOptions {
  _file?: string,
  default_permission?: boolean,
  defaultPermission?: boolean,
  description?: string,
  name?: string,
  options?: Array<SlashCommandOption | SlashCommandOptionOptions>,

  disableDm?: boolean,
  disableDmReply?: boolean,
  metadata?: Record<string, any>,
  permissions?: Array<bigint | number>,
  permissionsClient?: Array<bigint | number>,
  permissionsIgnoreClientOwner?: boolean,

  onBefore?: CommandCallbackBefore,
  onBeforeRun?: CommandCallbackBeforeRun,
  onCancel?: CommandCallbackCancel,
  onCancelRun?: CommandCallbackCancelRun,
  onError?: CommandCallbackError,
  onPermissionsFail?: CommandCallbackPermissionsFail,
  onPermissionsFailClient?: CommandCallbackPermissionsFail,
  run?: CommandCallbackRun,
  onRunError?: CommandCallbackRunError,
  onSuccess?: CommandCallbackSuccess,
}

export interface SlashCommandOptionOptions {
  choices?: Array<SlashCommandOptionChoice>,
  description?: string,
  name?: string,
  options?: Array<SlashCommandOption | SlashCommandOptionOptions>,
  required?: boolean,
  type?: ApplicationCommandOptionTypes,

  disableDm?: boolean,
  disableDmReply?: boolean,
  metadata?: Record<string, any>,
  permissions?: Array<bigint | number>,
  permissionsClient?: Array<bigint | number>,
  permissionsIgnoreClientOwner?: boolean,

  onBefore?: CommandCallbackBefore,
  onBeforeRun?: CommandCallbackBeforeRun,
  onCancel?: CommandCallbackCancel,
  onCancelRun?: CommandCallbackCancelRun,
  onError?: CommandCallbackError,
  onPermissionsFail?: CommandCallbackPermissionsFail,
  onPermissionsFailClient?: CommandCallbackPermissionsFail,
  run?: CommandCallbackRun,
  onRunError?: CommandCallbackRunError,
  onSuccess?: CommandCallbackSuccess,
}

export interface SlashCommandOptionChoiceOptions {
  name?: string,
  value?: number | string,
}

const keysSlashCommand = new BaseSet<string>([
  DiscordKeys.DEFAULT_PERMISSION,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.ID,
  DiscordKeys.IDS,
  DiscordKeys.NAME,
  DiscordKeys.OPTIONS,
]);

const keysSkipDifferenceSlashCommand = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.ID,
  DiscordKeys.IDS,
]);

export class SlashCommand<ParsedArgsFinished = ParsedArgs> extends Structure {
  readonly _file?: string;
  readonly _keys = keysSlashCommand;
  readonly _keysSkipDifference = keysSkipDifferenceSlashCommand;
  _options?: BaseCollection<string, SlashCommandOption>;

  defaultPermission: boolean = true;
  description: string = '';
  ids = new BaseSet<string>();
  global: boolean = true;
  guildIds?: Array<string>;
  name: string = '';

  disableDm: boolean = false;
  metadata: Record<string, any> = {};
  permissions?: Array<bigint>;
  permissionsClient?: Array<bigint>;
  permissionsIgnoreClientOwner?: boolean = false;

  onBefore?(context: SlashContext): Promise<boolean> | boolean;
  onBeforeRun?(context: SlashContext, args: ParsedArgs): Promise<boolean> | boolean;
  onCancel?(context: SlashContext): Promise<any> | any;
  onCancelRun?(context: SlashContext, args: ParsedArgs): Promise<any> | any;
  onError?(context: SlashContext, args: ParsedArgs, error: any): Promise<any> | any;
  onPermissionsFail?(context: SlashContext, permissions: FailedPermissions): Promise<any> | any;
  onPermissionsFailClient?(context: SlashContext, permissions: FailedPermissions): Promise<any> | any;
  run?(context: SlashContext, args: ParsedArgsFinished): Promise<any> | any;
  onRunError?(context: SlashContext, args: ParsedArgsFinished, error: any): Promise<any> | any;
  onSuccess?(context: SlashContext, args: ParsedArgsFinished): Promise<any> | any;

  constructor(data: SlashCommandOptions = {}) {
    super();
    if (DetritusKeys[DiscordKeys.DEFAULT_PERMISSION] in data) {
      (data as any)[DiscordKeys.DEFAULT_PERMISSION] = (data as any)[DetritusKeys[DiscordKeys.DEFAULT_PERMISSION]];
    }
    this.merge(data);

    this.disableDm = !!data.disableDm;
    this.metadata = Object.assign(this.metadata, data.metadata);
    this.permissions = (data.permissions) ? data.permissions.map((x) => BigInt(x)) : undefined;
    this.permissionsClient = (data.permissionsClient) ? data.permissionsClient.map((x) => BigInt(x)) : undefined;
    this.permissionsIgnoreClientOwner = !!data.permissionsIgnoreClientOwner;

    if (data._file) {
      this._file = data._file;
    }
    Object.defineProperties(this, {
      _file: {configurable: true, writable: false},
    });

    this.onBefore = data.onBefore || this.onBefore;
    this.onBeforeRun = data.onBeforeRun || this.onBeforeRun;
    this.onCancel = data.onCancel || this.onCancel;
    this.onCancelRun = data.onCancelRun || this.onCancelRun;
    this.onError = data.onError || this.onError;
    this.onPermissionsFail = data.onPermissionsFail || this.onPermissionsFail;
    this.onPermissionsFailClient = data.onPermissionsFailClient || this.onPermissionsFailClient;
    this.run = data.run || this.run;
    this.onRunError = data.onRunError || this.onRunError;
    this.onSuccess = data.onSuccess || this.onSuccess;
  }

  get _optionsKey(): string {
    return (this._options) ? this._options.map((x) => x.key).join(':') : '';
  }

  get hash(): string {
    return Crypto.createHash('md5').update(this.key).digest('hex');
  }

  get hasRun(): boolean {
    if (this.isGroup) {
      return (this.options) ? this.options.some((option) => option.hasRun) : false;
    }
    return typeof(this.run) === 'function';
  }

  get isGroup(): boolean {
    return (this.options) ? this.options.some((option) => option.isSubCommand || option.isSubCommandGroup) : false;
  }

  get key(): string {
    return `${this.name}-${this.description}-${this._optionsKey}`;
  }

  get options(): Array<SlashCommandOption> | undefined {
    return (this._options) ? this._options.toArray() : this._options;
  }

  set options(value: Array<SlashCommandOption> | undefined) {
    if (value) {
      if (!this._options) {
        this._options = new BaseCollection<string, SlashCommandOption>();
      }
      this._options.clear();
      for (let option of value) {
        this._options.set(option.name, option);
      }
    } else {
      this._options = undefined;
    }
  }

  getInvoker(data: InteractionDataApplicationCommand): this | SlashCommandOption | null {
    if (this.name === data.name) {
      if (data.options && data.options.some((option) => option.isSubCommand || option.isSubCommandGroup)) {
        return this.getInvokerOption(data.options);
      }
      return this;
    }
    return null;
  }

  getInvokerOption(
    options: BaseCollection<string, InteractionDataApplicationCommandOption>,
  ): SlashCommandOption | null {
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

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.ID: {
        this.ids.add(value);
      }; return;
      case DiscordKeys.IDS: {
        this.ids = new BaseSet<string>(value);
      }; return;
      case DiscordKeys.OPTIONS: {
        if (value) {
          if (!this._options) {
            this._options = new BaseCollection<string, SlashCommandOption>();
          }
          this._options.clear();
          for (let raw of value) {
            const option = (raw instanceof SlashCommandOption) ? raw : new SlashCommandOption(raw);
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


const keysSlashCommandOption = new BaseSet<string>([
  DiscordKeys.CHOICES,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.NAME,
  DiscordKeys.OPTIONS,
  DiscordKeys.REQUIRED,
  DiscordKeys.TYPE,
]);

export class SlashCommandOption<ParsedArgsFinished = ParsedArgs> extends Structure {
  readonly _keys = keysSlashCommandOption;
  _options?: BaseCollection<string, SlashCommandOption>;

  choices?: Array<SlashCommandOptionChoice>;
  description: string = '';
  name: string = '';
  required?: boolean;
  type: ApplicationCommandOptionTypes = ApplicationCommandOptionTypes.SUB_COMMAND;

  disableDm: boolean = false;
  metadata: Record<string, any> = {};
  permissions?: Array<bigint>;
  permissionsClient?: Array<bigint>;
  permissionsIgnoreClientOwner?: boolean = false;

  onBefore?(context: SlashContext): Promise<boolean> | boolean;
  onBeforeRun?(context: SlashContext, args: ParsedArgs): Promise<boolean> | boolean;
  onCancel?(context: SlashContext): Promise<any> | any;
  onCancelRun?(context: SlashContext, args: ParsedArgs): Promise<any> | any;
  onError?(context: SlashContext, args: ParsedArgs, error: any): Promise<any> | any;
  onPermissionsFail?(context: SlashContext, permissions: FailedPermissions): Promise<any> | any;
  onPermissionsFailClient?(context: SlashContext, permissions: FailedPermissions): Promise<any> | any;
  run?(context: SlashContext, args: ParsedArgsFinished): Promise<any> | any;
  onRunError?(context: SlashContext, args: ParsedArgsFinished, error: any): Promise<any> | any;
  onSuccess?(context: SlashContext, args: ParsedArgsFinished): Promise<any> | any;

  constructor(data: SlashCommandOptionOptions = {}) {
    super();
    this.merge(data);

    this.disableDm = !!data.disableDm;
    this.metadata = Object.assign(this.metadata, data.metadata);
    this.permissions = (data.permissions) ? data.permissions.map((x) => BigInt(x)) : undefined;
    this.permissionsClient = (data.permissionsClient) ? data.permissionsClient.map((x) => BigInt(x)) : undefined;
    this.permissionsIgnoreClientOwner = !!data.permissionsIgnoreClientOwner;

    this.onBefore = data.onBefore || this.onBefore;
    this.onBeforeRun = data.onBeforeRun || this.onBeforeRun;
    this.onCancel = data.onCancel || this.onCancel;
    this.onCancelRun = data.onCancelRun || this.onCancelRun;
    this.onError = data.onError || this.onError;
    this.onPermissionsFail = data.onPermissionsFail || this.onPermissionsFail;
    this.onPermissionsFailClient = data.onPermissionsFailClient || this.onPermissionsFailClient;
    this.run = data.run || this.run;
    this.onRunError = data.onRunError || this.onRunError;
    this.onSuccess = data.onSuccess || this.onSuccess;
  }

  get _choicesKey(): string {
    return (this.choices) ? this.choices.map((x) => x.key).join(':') : '';
  }

  get _optionsKey(): string {
    return (this._options) ? this._options.map((x) => x.key).join(':') : '';
  }

  get hasRun(): boolean {
    if (this.isSubCommand) {
      return typeof(this.run) === 'function';
    } else if (this.isSubCommandGroup) {
      return (this.options) ? this.options.some((option) => option.hasRun) : false;
    }
    return false;
  }

  get isSubCommand(): boolean {
    return this.type === ApplicationCommandOptionTypes.SUB_COMMAND;
  }

  get isSubCommandGroup(): boolean {
    return this.type === ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
  }

  get key(): string {
    return `${this.name}-${this.description}-${this.type}-${this._optionsKey}-${this._choicesKey}`;
  }

  get options(): Array<SlashCommandOption> | undefined {
    return (this._options) ? this._options.toArray() : this._options;
  }

  set options(value: Array<SlashCommandOption> | undefined) {
    if (value) {
      if (!this._options) {
        this._options = new BaseCollection<string, SlashCommandOption>();
      }
      this._options.clear();
      for (let option of value) {
        this._options.set(option.name, option);
      }
      if (this._options.some((option) => option.isSubCommand)) {
        this.type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
      }
    } else {
      this._options = undefined;
    }
  }

  getInvoker(option: InteractionDataApplicationCommandOption): SlashCommandOption | null {
    if (this.type === option.type && this.name === option.name) {
      if (this.isSubCommandGroup) {
        if (option.options && this._options) {
          for (let [name, x] of option.options) {
            if (!this._options.has(name)) {
              return null;
            }
            const x = this._options.get(name)!;
            if (x.isSubCommandGroup) {
              return x.getInvoker(option);
            }
          }
        }
      }
      return this;
    }
    return null;
  }

  addChoice(name: SlashCommandOptionChoice | SlashCommandOptionChoiceOptions): SlashCommandOptionChoice
  addChoice(name: string, value: number | string): SlashCommandOptionChoice
  addChoice(name: SlashCommandOptionChoice | SlashCommandOptionChoiceOptions | string, value?: number | string): SlashCommandOptionChoice {
    if (!this.choices) {
      this.choices = [];
    }
    let choice: SlashCommandOptionChoice;
    if (typeof(name) === 'object') {
      choice = (name instanceof SlashCommandOptionChoice) ? name : new SlashCommandOptionChoice(name);
    } else {
      choice = new SlashCommandOptionChoice({name, value});
    }
    this.choices.push(choice);
    return choice;
  }

  addOption(value: SlashCommandOption | SlashCommandOptions): SlashCommandOption {
    if (!this.options) {
      this.options = [];
    }
    const option = (value instanceof SlashCommandOption) ? value : new SlashCommandOption(value);
    this.options.push(option);
    return option;
  }

  setChoices(value: Array<SlashCommandOptionChoice | SlashCommandOptionChoiceOptions> = []): this {
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

  setOptions(value: Array<SlashCommandOption | SlashCommandOptionOptions> = []): this {
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
            const choice = new SlashCommandOptionChoice(raw);
            this.choices.push(choice);
          }
        } else {
          this.choices = value;
        }
      }; return;
      case DiscordKeys.OPTIONS: {
        if (value) {
          if (!this._options) {
            this._options = new BaseCollection<string, SlashCommandOption>();
          }
          this._options.clear();
          for (let raw of value) {
            const option = (raw instanceof SlashCommandOption) ? raw : new SlashCommandOption(raw);
            this._options.set(option.name, option);
          }
          if (this._options.some((option) => option.isSubCommand)) {
            this.type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
          }
        } else {
          this._options = undefined;
        }
      }; return;
    }
    return super.mergeValue(key, value);
  }
}


const keysSlashCommandOptionChoice = new BaseSet<string>([
  DiscordKeys.NAME,
  DiscordKeys.VALUE,
]);

export class SlashCommandOptionChoice extends Structure {
  readonly _keys = keysSlashCommandOptionChoice;

  name: string = '';
  value: number | string = '';

  constructor(data: SlashCommandOptionChoiceOptions = {}) {
    super();
    this.merge(data);
  }

  get key(): string {
    return `${this.name}-${this.value}-${typeof(this.value)}`;
  }
}
