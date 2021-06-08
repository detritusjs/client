import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ApplicationCommandOptionTypes,
  DiscordKeys,
  InteractionCallbackTypes,
  InteractionTypes,
  MessageComponentTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel, createChannelFromData } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { Message } from './message';
import { Role } from './role';
import { User } from './user';


export type InteractionEditOrRespond = RequestTypes.CreateInteractionResponseInnerPayload & RequestTypes.EditWebhookTokenMessage;

const DEFERRED_TYPES = Object.freeze([
  InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE,
]);

const keysInteraction = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.DATA,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.MEMBER,
  DiscordKeys.MESSAGE,
  DiscordKeys.TOKEN,
  DiscordKeys.TYPE,
  DiscordKeys.USER,
  DiscordKeys.VERSION,
]);

const keysMergeInteraction = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
  DiscordKeys.MEMBER,
  DiscordKeys.TYPE,
]);

/**
 * Interaction Structure
 * @category Structure
 */
export class Interaction extends BaseStructure {
  readonly _keys = keysInteraction;
  readonly _keysMerge = keysMergeInteraction;

  applicationId: string = '';
  channelId?: string;
  data?: InteractionDataApplicationCommand | InteractionDataComponent;
  guildId?: string;
  id: string = '';
  member?: Member;
  message?: Message;
  responded: boolean = false;
  token: string = '';
  type: InteractionTypes = InteractionTypes.PING;
  user!: User;
  version: number = 0;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get channel(): Channel | null {
    if (this.channelId) {
      return this.client.channels.get(this.channelId) || null;
    }
    return null;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get inDm(): boolean {
    return !this.member;
  }

  get isFromApplicationCommand() {
    return this.type === InteractionTypes.APPLICATION_COMMAND;
  }

  get isFromMessageComponent() {
    return this.type === InteractionTypes.MESSAGE_COMPONENT;
  }

  get userId(): string {
    return this.user.id;
  }

  createMessage(options: RequestTypes.ExecuteWebhook | string = {}) {
    return this.client.rest.executeWebhook(this.applicationId, this.token, options);
  }

  async createResponse(
    options: RequestTypes.CreateInteractionResponse | number,
    data?: RequestTypes.CreateInteractionResponseInnerPayload | string,
  ) {
    const response = await this.client.rest.createInteractionResponse(this.id, this.token, options, data);
    this.responded = true;
    return response;
  }

  deleteMessage(messageId: string) {
    return this.client.rest.deleteWebhookTokenMessage(this.applicationId, this.token, messageId);
  }

  deleteResponse() {
    return this.deleteMessage('@original');
  }

  editMessage(messageId: string, options: RequestTypes.EditWebhookTokenMessage = {}) {
    return this.client.rest.editWebhookTokenMessage(this.applicationId, this.token, messageId, options);
  }

  editResponse(options: RequestTypes.EditWebhookTokenMessage = {}) {
    return this.editMessage('@original', options);
  }

  editOrRespond(options: InteractionEditOrRespond | string = {}) {
    // try respond, try edit, try followup
    if (this.responded) {
      if (typeof(options) === 'string') {
        options = {content: options};
      }
      return this.editResponse(options);
    }

    let type: InteractionCallbackTypes = InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE;
    switch (this.type) {
      case InteractionTypes.APPLICATION_COMMAND: type = InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE; break;
      case InteractionTypes.MESSAGE_COMPONENT: type = InteractionCallbackTypes.UPDATE_MESSAGE; break;
    }
    return this.respond(type, options);
  }

  fetchMessage(messageId: string) {
    return this.client.rest.fetchWebhookTokenMessage(this.applicationId, this.token, messageId);
  }

  fetchResponse() {
    return this.fetchMessage('@original');
  }

  reply(options: RequestTypes.ExecuteWebhook | string = {}) {
    return this.createMessage(options);
  }

  respond(
    options: RequestTypes.CreateInteractionResponse | number,
    data?: RequestTypes.CreateInteractionResponseInnerPayload | string,
  ) {
    return this.createResponse(options, data);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.DATA: {
          switch (this.type) {
            case InteractionTypes.PING: {

            }; break;
            case InteractionTypes.APPLICATION_COMMAND: {
              value = new InteractionDataApplicationCommand(this, value);
            }; break;
            case InteractionTypes.MESSAGE_COMPONENT: {
              value = new InteractionDataComponent(this, value);
            }; break;
          }
        }; break;
        case DiscordKeys.MEMBER: {
          value.guild_id = this.guildId as string;
          value = new Member(this.client, value, true);
          this.user = value.user;
        }; break;
        case DiscordKeys.MESSAGE: {
          value = new Message(this.client, value, true);
        }; break;
        case DiscordKeys.USER: {
          value = new User(this.client, value, true);
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysInteractionDataApplicationCommand = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.OPTIONS,
  DiscordKeys.RESOLVED,
]);

/**
 * Interaction Data Application Command Structure
 * @category Structure
 */
export class InteractionDataApplicationCommand extends BaseStructure {
  readonly _keys = keysInteractionDataApplicationCommand;
  readonly interaction: Interaction;

  id: string = '';
  name: string = '';
  options?: BaseCollection<string, InteractionDataApplicationCommandOption>;
  resolved?: InteractionDataApplicationCommandResolved;

  constructor(
    interaction: Interaction,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(interaction.client, undefined, isClone);
    this.interaction = interaction;
    this.merge(data);
    Object.defineProperty(this, 'interaction', {enumerable: false});
  }

  get fullName(): string {
    if (this.options && this.options.length) {
      const option = this.options.first()!;
      if (option.isSubCommand || option.isSubCommandGroup) {
        return `${this.name} ${option.fullName}`;
      }
    }
    return this.name;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.OPTIONS: {
          if (!this.options) {
            this.options = new BaseCollection<string, InteractionDataApplicationCommandOption>();
          }
          this.options.clear();
          for (let raw of value) {
            const option = new InteractionDataApplicationCommandOption(this, raw, this.isClone);
            this.options.set(option.name, option);
          }
        }; return;
        case DiscordKeys.RESOLVED: {
          value = new InteractionDataApplicationCommandResolved(this, value, this.isClone);
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }

  toString(): string {
    return this.fullName;
  }
}


const keysInteractionDataApplicationCommandOption = new BaseSet<string>([
  DiscordKeys.NAME,
  DiscordKeys.OPTIONS,
  DiscordKeys.TYPE,
  DiscordKeys.VALUE,
]);

/**
 * Interaction Data Application Command Option Structure
 * @category Structure
 */
export class InteractionDataApplicationCommandOption extends BaseStructure {
  readonly _keys = keysInteractionDataApplicationCommandOption;
  readonly interactionData: InteractionDataApplicationCommand;

  name: string = '';
  options?: BaseCollection<string, InteractionDataApplicationCommandOption>;
  type: ApplicationCommandOptionTypes = ApplicationCommandOptionTypes.SUB_COMMAND;
  value?: boolean | number | string;

  constructor(
    interactionData: InteractionDataApplicationCommand,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(interactionData.client, undefined, isClone);
    this.interactionData = interactionData;
    this.merge(data);
    Object.defineProperty(this, 'interactionData', {enumerable: false});
  }

  get fullName(): string {
    if (this.isSubCommandGroup && this.options && this.options.length) {
      const option = this.options.first()!;
      return `${this.name} ${option.fullName}`;
    }
    return this.name;
  }

  get isSubCommand(): boolean {
    return this.type === ApplicationCommandOptionTypes.SUB_COMMAND;
  }

  get isSubCommandGroup(): boolean {
    return this.type === ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.OPTIONS: {
          if (!this.options) {
            this.options = new BaseCollection<string, InteractionDataApplicationCommandOption>();
          }
          this.options.clear();
          for (let raw of value) {
            const option = new InteractionDataApplicationCommandOption(this.interactionData, raw, this.isClone);
            this.options.set(option.name, option);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysInteractionDataApplicationCommandResolved = new BaseSet<string>([
  DiscordKeys.CHANNELS,
  DiscordKeys.MEMBERS,
  DiscordKeys.ROLES,
  DiscordKeys.USERS,
]);

const keysMergeInteractionDataApplicationCommandResolved = new BaseSet<string>([
  DiscordKeys.USERS,
]);

/**
 * Interaction Data Application Command Resolved Structure
 * @category Structure
 */
export class InteractionDataApplicationCommandResolved extends BaseStructure {
  readonly _keys = keysInteractionDataApplicationCommandResolved;
  readonly _keysMerge = keysMergeInteractionDataApplicationCommandResolved;
  readonly interactionData: InteractionDataApplicationCommand;

  channels?: BaseCollection<string, Channel>;
  members?: BaseCollection<string, Member>;
  roles?: BaseCollection<string, Role>;
  users?: BaseCollection<string, User>;

  constructor(
    interactionData: InteractionDataApplicationCommand,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(interactionData.client, undefined, isClone);
    this.interactionData = interactionData;
    this.merge(data);
    Object.defineProperty(this, 'interactionData', {enumerable: false});
  }

  get guildId(): string | null {
    return this.interactionData.interaction.guildId || null;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.CHANNELS: {
          if (!this.channels) {
            this.channels = new BaseCollection();
          }
          this.channels.clear();
          for (let channelId in value) {
            let channel: Channel;
            if (this.client.channels.has(channelId)) {
              channel = this.client.channels.get(channelId)!;
              // do we want to just create it like below? or merge the values?
              // not sure if discord verifies the data
            } else {
              value[channelId][DiscordKeys.GUILD_ID] = this.guildId;
              channel = createChannelFromData(this.client, value[channelId]);
            }
            this.channels.set(channelId, channel);
          }
        }; return;
        case DiscordKeys.MEMBERS: {
          if (!this.members) {
            this.members = new BaseCollection();
          }
          this.members.clear();
          for (let userId in value) {
            value[userId][DiscordKeys.GUILD_ID] = this.guildId;
            const member = new Member(this.client, value[userId], true);
            if (!member.user) {
              member.user = (this.users) ? this.users.get(userId)! : this.client.users.get(userId)!;
            }
            this.members.set(userId, member);
          }
        }; return;
        case DiscordKeys.ROLES: {
          if (!this.roles) {
            this.roles = new BaseCollection();
          }
          this.roles.clear();
          for (let roleId in value) {
            value[roleId][DiscordKeys.GUILD_ID] = this.guildId;
            const role = new Role(this.client, value[roleId]);
            this.roles.set(roleId, role);
          }
        }; return;
        case DiscordKeys.USERS: {
          if (!this.users) {
            this.users = new BaseCollection();
          }
          this.users.clear();
          for (let userId in value) {
            const user = new User(this.client, value[userId]);
            this.users.set(userId, user);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysInteractionDataComponent = new BaseSet<string>([
  DiscordKeys.COMPONENT_TYPE,
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.VALUES,
]);

/**
 * Interaction Data Component Structure
 * @category Structure
 */
export class InteractionDataComponent extends BaseStructure {
  readonly _keys = keysInteractionDataComponent;
  readonly interaction: Interaction;

  componentType: MessageComponentTypes = MessageComponentTypes.BUTTON;
  customId: string = '';
  values?: Array<string>;

  constructor(
    interaction: Interaction,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(interaction.client, undefined, isClone);
    this.interaction = interaction;
    this.merge(data);
    Object.defineProperty(this, 'interaction', {enumerable: false});
  }
}
