import * as Crypto from 'crypto';

import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandPermissionTypes,
  ApplicationCommandTypes,
  ApplicationIntegrationTypes,
  ChannelTypes,
  DetritusKeys,
  DiscordKeys,
  InteractionContextTypes,
} from '../constants';
import { KeyGenerator } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Member } from './member';
import { User } from './user';


const keysApplicationCommand = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.CONTEXTS,
  DiscordKeys.DEFAULT_MEMBER_PERMISSIONS,
  DiscordKeys.DEFAULT_PERMISSION,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.DESCRIPTION_LOCALIZATIONS,
  DiscordKeys.DM_PERMISSION,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.INTEGRATION_TYPES,
  DiscordKeys.NAME,
  DiscordKeys.NAME_LOCALIZATIONS,
  DiscordKeys.NSFW,
  DiscordKeys.OPTIONS,
  DiscordKeys.TYPE,
  DiscordKeys.VERSION,
]);

/**
 * Application Command Structure
 * @category Structure
 */
export class ApplicationCommand extends BaseStructure {
  readonly _keys = keysApplicationCommand;

  applicationId: string = '';
  contexts?: Array<InteractionContextTypes> | null;
  defaultMemberPermissions: bigint | null = null;
  defaultPermission: boolean = true;
  description: string = '';
  descriptionLocalizations: Record<string, string | undefined> | null = null;
  dmPermission: boolean = true;
  guildId?: string;
  id: string = '';
  integrationTypes?: Array<ApplicationIntegrationTypes>;
  name: string = '';
  nameLocalizations: Record<string, string | undefined> | null = null;
  nsfw?: boolean;
  options?: BaseCollection<string, ApplicationCommandOption>;
  type: ApplicationCommandTypes = ApplicationCommandTypes.CHAT_INPUT;
  version: string = '';

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get hash(): string {
    return Crypto.createHash('md5').update(this.key).digest('hex');
  }

  get key(): string {
    return KeyGenerator.ApplicationCommand(this);
  }

  edit(options: RequestTypes.EditApplicationCommand | RequestTypes.EditApplicationGuildCommand) {
    if (this.guildId) {
      return this.client.rest.editApplicationGuildCommand(this.client.clientId, this.guildId, this.id, options);
    }
    return this.client.rest.editApplicationCommand(this.client.clientId, this.id, options);
  }

  delete() {
    if (this.guildId) {
      return this.client.rest.deleteApplicationGuildCommand(this.client.clientId, this.guildId, this.id);
    }
    return this.client.rest.deleteApplicationCommand(this.client.clientId, this.id);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
    if (DiscordKeys.APPLICATION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = data[DiscordKeys.APPLICATION_ID];
    }
    if (DiscordKeys.CONTEXTS in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTEXTS]] = data[DiscordKeys.CONTEXTS];
    }
    if (DiscordKeys.DEFAULT_MEMBER_PERMISSIONS in data) {
      const value = data[DiscordKeys.DEFAULT_MEMBER_PERMISSIONS];
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_MEMBER_PERMISSIONS]] = (value) ? BigInt(value) : value;
    }
    if (DiscordKeys.DEFAULT_PERMISSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_PERMISSION]] = data[DiscordKeys.DEFAULT_PERMISSION];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.DESCRIPTION_LOCALIZATIONS in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION_LOCALIZATIONS]] = data[DiscordKeys.DESCRIPTION_LOCALIZATIONS];
    }
    if (DiscordKeys.DM_PERMISSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DM_PERMISSION]] = data[DiscordKeys.DM_PERMISSION];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.INTEGRATION_TYPES in data) {
      (this as any)[DetritusKeys[DiscordKeys.INTEGRATION_TYPES]] = data[DiscordKeys.INTEGRATION_TYPES];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.NAME_LOCALIZATIONS in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME_LOCALIZATIONS]] = data[DiscordKeys.NAME_LOCALIZATIONS];
    }
    if (DiscordKeys.NSFW in data) {
      (this as any)[DetritusKeys[DiscordKeys.NSFW]] = data[DiscordKeys.NSFW];
    }
    if (DiscordKeys.OPTIONS in data) {
      const value = data[DiscordKeys.OPTIONS];
      if (value) {
        if (!this.options) {
          this.options = new BaseCollection();
        }
        this.options.clear();
        for (let raw of value) {
          const option = new ApplicationCommandOption(this, raw, this.isClone);
          this.options.set(option.name, option);
        }
      } else {
        this.options = undefined;
      }
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.VERSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.VERSION]] = data[DiscordKeys.VERSION];
    }
  }
}


const keysApplicationCommandOption = new BaseSet<string>([
  DiscordKeys.AUTOCOMPLETE,
  DiscordKeys.CHANNEL_TYPES,
  DiscordKeys.CHOICES,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.DESCRIPTION_LOCALIZATIONS,
  DiscordKeys.MAX_VALUE,
  DiscordKeys.MIN_VALUE,
  DiscordKeys.NAME,
  DiscordKeys.NAME_LOCALIZATIONS,
  DiscordKeys.OPTIONS,
  DiscordKeys.REQUIRED,
  DiscordKeys.TYPE,
]);

/**
 * Application Command Option Structure
 * @category Structure
 */
export class ApplicationCommandOption extends BaseStructure {
  readonly _keys = keysApplicationCommandOption;
  readonly command: ApplicationCommand;

  autocomplete?: boolean;
  channelTypes?: Array<ChannelTypes | number>;
  choices?: BaseCollection<string, ApplicationCommandOptionChoice>;
  description: string = '';
  descriptionLocalizations: Record<string, string | undefined> | null = null;
  maxValue?: bigint;
  minValue?: bigint;
  name: string = '';
  nameLocalizations: Record<string, string | undefined> | null = null;
  options?: BaseCollection<string, ApplicationCommandOption>;
  required: boolean = false;
  type: ApplicationCommandOptionTypes = ApplicationCommandOptionTypes.SUB_COMMAND;

  constructor(command: ApplicationCommand, data: BaseStructureData, isClone?: boolean) {
    super(command.client, undefined, isClone);
    this.command = command;
    this.merge(data);
    Object.defineProperty(this, 'command', {enumerable: false});
  }

  get key(): string {
    return KeyGenerator.ApplicationCommandOption(this);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.CHOICES: {
        if (value) {
          if (!this.choices) {
            this.choices = new BaseCollection();
          }
          this.choices.clear();
          for (let raw of value) {
            const choice = new ApplicationCommandOptionChoice(this, raw, this.isClone);
            this.choices.set(choice.name, choice);
          }
        } else {
          this.choices = undefined;
        }
      }; return;
      case DiscordKeys.MAX_VALUE: {
        value = BigInt(value);
      }; break;
      case DiscordKeys.MIN_VALUE: {
        value = BigInt(value);
      }; break;
      case DiscordKeys.OPTIONS: {
        if (value) {
          if (!this.options) {
            this.options = new BaseCollection();
          }
          this.options.clear();
          for (let raw of value) {
            const option = new ApplicationCommandOption(this.command, raw, this.isClone);
            this.options.set(option.name, option);
          }
        } else {
          this.options = undefined;
        }
      }; return;
    }
    super.mergeValue(key, value);
  }
}


const keysApplicationCommandOptionChoice = new BaseSet<string>([
  DiscordKeys.NAME,
  DiscordKeys.NAME_LOCALIZATIONS,
  DiscordKeys.VALUE,
]);

/**
 * Application Command Option Choice Structure
 * @category Structure
 */
export class ApplicationCommandOptionChoice extends BaseStructure {
  readonly _keys = keysApplicationCommandOptionChoice;
  readonly option: ApplicationCommandOption;

  name: string = '';
  nameLocalizations: Record<string, string | undefined> | null = null;
  value: string | number = '';

  constructor(option: ApplicationCommandOption, data: BaseStructureData, isClone?: boolean) {
    super(option.client, undefined, isClone);
    this.option = option;
    this.merge(data);
    Object.defineProperty(this, 'option', {enumerable: false});
  }

  get key(): string {
    return KeyGenerator.ApplicationCommandOptionChoice(this);
  }
}



const keysApplicationCommandPermissions = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.PERMISSIONS,
]);

/**
 * Application Command Permissions Structure
 * @category Structure
 */
export class ApplicationCommandPermissions extends BaseStructure {
  readonly _keys = keysApplicationCommandPermissions;

  applicationId: string = '';
  guildId: string = '';
  id: string = '';
  permissions = new BaseCollection<string, ApplicationCommandPermission>();

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get allChannelsId(): string {
    return String(BigInt(this.guildId) - 1n);
  }

  isAllowed(channel: Channel, member: Member) {
    if (member.canAdministrator) {
      return true;
    }

    // channel id and role id can be the same for old guilds
    if (this.permissions.has(channel.id) && !this.permissions.get(channel.id)!.permission) {
      return false;
    }

    if (channel.parentId && this.permissions.has(channel.parentId) && !this.permissions.get(channel.parentId)!.permission) {
      return false;
    }

    const allChannelsId = this.allChannelsId;
    if (this.permissions.has(allChannelsId) && !this.permissions.get(allChannelsId)!.permission) {
      return false;
    }

    if (this.permissions.has(member.id)) {
      return this.permissions.get(member.id)!.permission;
    }

    let isRoleAllowed: boolean | null = null;
    for (let [commandPermissionId, commandPermission] of this.permissions) {
      switch (commandPermission.type) {
        case ApplicationCommandPermissionTypes.ROLE: {
          if (member.roles.has(commandPermission.id)) {
            isRoleAllowed = isRoleAllowed || commandPermission.permission;
          }
        }; break;
      }
      if (isRoleAllowed) {
        break;
      }
    }

    if (isRoleAllowed !== null) {
      return isRoleAllowed;
    }

    // channel id and role id can be the same for old guilds
    if (this.permissions.has(this.guildId)) {
      return this.permissions.get(this.guildId)!.permission;
    }

    return true;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.PERMISSIONS: {
        this.permissions.clear();
        for (let raw of value) {
          const permission = new ApplicationCommandPermission(this, raw, this.isClone);
          this.permissions.set(permission.id, permission);
        }
      }; return;
    }
    super.mergeValue(key, value);
  }
}


const keysApplicationCommandPermission = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.PERMISSION,
  DiscordKeys.TYPE,
]);

/**
 * Application Command Permission Structure
 * @category Structure
 */
export class ApplicationCommandPermission extends BaseStructure {
  readonly _keys = keysApplicationCommandPermission;
  readonly commandPermissions: ApplicationCommandPermissions;

  id: string = '';
  permission: boolean = false;
  type: ApplicationCommandPermissionTypes = ApplicationCommandPermissionTypes.ROLE;

  constructor(commandPermissions: ApplicationCommandPermissions, data: BaseStructureData, isClone?: boolean) {
    super(commandPermissions.client, undefined, isClone);
    this.commandPermissions = commandPermissions;
    this.merge(data);
    Object.defineProperty(this, 'commandPermissions', {enumerable: false});
  }

  isForAllChannels(): boolean {
    return this.isChannel && this.id === this.commandPermissions.allChannelsId;
  }

  isForEveryoneRole(): boolean {
    return this.isRole && this.id === this.commandPermissions.guildId;
  }

  get isChannel(): boolean {
    return this.type === ApplicationCommandPermissionTypes.CHANNEL;
  }

  get isRole(): boolean {
    return this.type === ApplicationCommandPermissionTypes.ROLE;
  }

  get isUser(): boolean {
    return this.type === ApplicationCommandPermissionTypes.USER;
  }

  get user(): User | null {
    if (this.isUser) {
      return this.client.users.get(this.id) || null;
    }
    return null;
  }
}
