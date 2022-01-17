import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  DiscordKeys,
  InteractionCallbackTypes,
  InteractionTypes,
  MessageComponentTypes,
  INTERACTION_TIMEOUT,
} from '../constants';
import { Snowflake } from '../utils';

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
  DiscordKeys.LOCALE
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
  readonly _deleted: boolean = false;
  _responding: Promise<boolean> | null = null;

  applicationId: string = '';
  channelId?: string;
  data?: InteractionDataApplicationCommand | InteractionDataComponent;
  guildId?: string;
  id: string = '';
  locale: string = '';
  member?: Member;
  message?: Message;
  responded: boolean = false;
  responseDeleted?: boolean;
  responseId?: string;
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

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get deleted(): boolean {
    if (!this._deleted) {
      const didTimeout = INTERACTION_TIMEOUT <= (Date.now() - this.createdAtUnix);
      if (didTimeout) {
        Object.defineProperty(this, '_deleted', {value: didTimeout});
        this.client.interactions.delete(this.id);
      }
    }
    return this._deleted;
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

  get response(): Message | null {
    if (this.responseId) {
      return this.client.messages.get(this.responseId) || null;
    }
    return null;
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
    if (this._responding) {
      await this._responding;
    }

    const response = new Promise((resolve, reject) => {
      if (this.isFromMessageComponent) {
        const toAssignData = (typeof(options) === 'object') ? options.data || data : data;
        if (typeof(toAssignData) === 'object' && toAssignData.components) {
          const listenerId = (this.message) ? this.message.id : '';
          Object.assign(toAssignData, {listenerId});
        }
      }

      this.client.rest.createInteractionResponse(this.id, this.token, options, data)
        .then(resolve)
        .catch(reject);
    });

    this._responding = new Promise((resolve) => {
      response.then(() => {
        this.responded = true;
      }).catch(() => {
        this.responded = false;
      }).then(() => {
        this._responding = null;
        resolve(this.responded);
      });
    });

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

  async editOrRespond(options: InteractionEditOrRespond | string = {}) {
    if (this._responding) {
      await this._responding;
    }

    // try respond, try edit, try followup
    if (this.responded) {
      if (typeof(options) === 'string') {
        options = {content: options};
      }
      options = Object.assign({attachments: [], components: [], content: '', embeds: []}, options);
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
            case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE: {
              value = new InteractionDataApplicationCommand(this, value);
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
  DiscordKeys.TARGET_ID,
  DiscordKeys.TYPE,
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
  targetId?: string;
  type: ApplicationCommandTypes = ApplicationCommandTypes.CHAT_INPUT;

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
  DiscordKeys.FOCUSED,
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

  focused?: boolean;
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
  DiscordKeys.MESSAGES,
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
  messages?: BaseCollection<string, Message>;
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
        case DiscordKeys.MESSAGES: {
          if (!this.messages) {
            this.messages = new BaseCollection();
          }
          this.messages.clear();
          for (let messageId in value) {
            value[messageId][DiscordKeys.GUILD_ID] = this.guildId;
            const message = new Message(this.client, value[messageId], true);
            this.messages.set(messageId, message);
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
