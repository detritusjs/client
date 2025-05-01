import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  ApplicationIntegrationTypes,
  DetritusKeys,
  DiscordKeys,
  InteractionCallbackTypes,
  InteractionContextTypes,
  InteractionTypes,
  MessageComponentTypes,
  Permissions,
  INTERACTION_TIMEOUT,
} from '../constants';
import { InteractionModal, Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Attachment } from './attachment';
import { Channel, createChannelFromData } from './channel';
import { ComponentActionRow } from './components';
import { Entitlement } from './entitlement';
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
  DiscordKeys.APP_PERMISSIONS,
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.ATTACHMENT_SIZE_LIMIT,
  DiscordKeys.AUTHORIZING_INTEGRATION_OWNERS,
  DiscordKeys.CHANNEL,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.CONTEXT,
  DiscordKeys.DATA,
  DiscordKeys.ENTITLEMENTS,
  DiscordKeys.GUILD_ID,
  DiscordKeys.GUILD_LOCALE,
  DiscordKeys.GUILD_PARTIAL,
  DiscordKeys.ID,
  DiscordKeys.LOCALE,
  DiscordKeys.MEMBER,
  DiscordKeys.MESSAGE,
  DiscordKeys.TOKEN,
  DiscordKeys.TYPE,
  DiscordKeys.USER,
  DiscordKeys.VERSION,
]);

/**
 * Interaction Structure
 * @category Structure
 */
export class Interaction extends BaseStructure {
  readonly _keys = keysInteraction;
  readonly _deleted: boolean = false;
  _channel?: Channel;
  _entitlements?: BaseCollection<string, Entitlement>;
  _responding: Promise<boolean> | null = null;

  appPermissions: bigint = Permissions.NONE;
  applicationId: string = '';
  attachmentSizeLimit: number = 0;
  authorizingIntegrationOwners: Partial<Record<ApplicationIntegrationTypes, string>> = {};
  channelId?: string;
  context?: InteractionContextTypes;
  data?: InteractionDataApplicationCommand | InteractionDataComponent | InteractionDataModal;
  guildId?: string;
  guildLocale?: string;
  guildPartial?: {features: Array<string>, id: string, locale: string};
  id: string = '';
  locale?: string;
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
    Object.defineProperties(this, {
      _entitlements: {enumerable: false, writable: true},
      _responding: {enumerable: false, writable: true},
    });
  }

  get channel(): Channel | null {
    if (this._channel) {
      return this._channel;
    } else if (this.channelId) {
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

  get entitlements(): BaseCollection<string, Entitlement> {
    if (this._entitlements) {
      return this._entitlements;
    }
    return emptyBaseCollection;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get hasServerPermissions(): boolean {
    switch (this.context) {
      case InteractionContextTypes.GUILD: {
        return ApplicationIntegrationTypes.GUILD_INSTALL in this.authorizingIntegrationOwners;
      };
      case InteractionContextTypes.BOT_DM: {
        return true;
      };
      case InteractionContextTypes.PRIVATE_CHANNEL: {
        return false;
      };
    }
    return false;
  }

  get inDm(): boolean {
    return this.inDmWithBot || this.inDmWithUsers;
  }

  get inDmWithBot(): boolean {
    return this.context === InteractionContextTypes.BOT_DM;
  }

  get inDmWithUsers(): boolean {
    return this.context === InteractionContextTypes.PRIVATE_CHANNEL;
  }

  get isFromApplicationCommand() {
    return this.type === InteractionTypes.APPLICATION_COMMAND;
  }

  get isFromModalSubmit() {
    return this.type === InteractionTypes.MODAL_SUBMIT;
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
        if (typeof(toAssignData) === 'object' && 'components' in toAssignData) {
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
    if (typeof(options) === 'string') {
      options = {content: options};
    }

    if (!(options instanceof InteractionModal)) {
      options = Object.assign({attachments: [], components: [], content: '', embeds: []}, options);
    }

    if (this.responded) {
      return this.editResponse(options);
    }

    let type: InteractionCallbackTypes = InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE;
    switch (this.type) {
      case InteractionTypes.APPLICATION_COMMAND: type = InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE; break;
      case InteractionTypes.MODAL_SUBMIT: type = InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE; break;
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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.APP_PERMISSIONS in data) {
      const value = data[DiscordKeys.APP_PERMISSIONS];
      (this as any)[DetritusKeys[DiscordKeys.APP_PERMISSIONS]] = BigInt(value);
    }
    if (DiscordKeys.APPLICATION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = data[DiscordKeys.APPLICATION_ID];
    }
    if (DiscordKeys.ATTACHMENT_SIZE_LIMIT in data) {
      (this as any)[DetritusKeys[DiscordKeys.ATTACHMENT_SIZE_LIMIT]] = data[DiscordKeys.ATTACHMENT_SIZE_LIMIT];
    }
    if (DiscordKeys.AUTHORIZING_INTEGRATION_OWNERS in data) {
      const value = data[DiscordKeys.AUTHORIZING_INTEGRATION_OWNERS];
      (this as any)[DetritusKeys[DiscordKeys.AUTHORIZING_INTEGRATION_OWNERS]] = value;
    }
    if (DiscordKeys.CHANNEL in data) {
      const value = data[DiscordKeys.CHANNEL];
      if (value) {
        if (this.client.channels.has(value.id)) {
          this._channel = this.client.channels.get(value.id)!;
          this._channel.merge(value);
        } else {
          this._channel = createChannelFromData(this.client, value);
        }
      } else {
        this._channel = undefined;
      }
    }
    if (DiscordKeys.CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_ID]] = data[DiscordKeys.CHANNEL_ID];
    }
    if (DiscordKeys.CONTEXT in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTEXT]] = data[DiscordKeys.CONTEXT];
    }
    if (DiscordKeys.ENTITLEMENTS in data) {
      const value = data[DiscordKeys.ENTITLEMENTS];
      if (value.length) {
        if (!this._entitlements) {
          this._entitlements = new BaseCollection<string, Entitlement>();
        }
        this._entitlements.clear();
        for (let raw of value) {
          this._entitlements.set(raw.id, new Entitlement(this.client, raw, this.isClone));
        }
      } else {
        if (this._entitlements) {
          this._entitlements.clear();
          this._entitlements = undefined;
        }
      }
    }
    if (DiscordKeys.GUILD in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_PARTIAL]] = data[DiscordKeys.GUILD];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.GUILD_LOCALE in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_LOCALE]] = data[DiscordKeys.GUILD_LOCALE];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.LOCALE in data) {
      (this as any)[DetritusKeys[DiscordKeys.LOCALE]] = data[DiscordKeys.LOCALE];
    }
    if (DiscordKeys.MESSAGE in data) {
      const value = data[DiscordKeys.MESSAGE];
      (this as any)[DetritusKeys[DiscordKeys.MESSAGE]] = new Message(this.client, value, true);
    }
    if (DiscordKeys.TOKEN in data) {
      (this as any)[DetritusKeys[DiscordKeys.TOKEN]] = data[DiscordKeys.TOKEN];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.VERSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.VERSION]] = data[DiscordKeys.VERSION];
    }

    if (DiscordKeys.MEMBER in data) {
      const value = data[DiscordKeys.MEMBER];
      value[DiscordKeys.GUILD_ID] = this.guildId!;

      const member = new Member(this.client, value, true);
      (this as any)[DetritusKeys[DiscordKeys.MEMBER]] = member;
      (this as any)[DetritusKeys[DiscordKeys.USER]] = member.user;
    }
    if (DiscordKeys.USER in data) {
      const value = data[DiscordKeys.USER];
      (this as any)[DetritusKeys[DiscordKeys.USER]] = new User(this.client, value, true);
    }

    if (DiscordKeys.DATA in data) {
      let value = data[DiscordKeys.DATA];
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
        case InteractionTypes.MODAL_SUBMIT: {
          value = new InteractionDataModal(this, value);
        }; break;
      }
      (this as any)[DetritusKeys[DiscordKeys.DATA]] = value;
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
  DiscordKeys.ATTACHMENTS,
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

  attachments?: BaseCollection<string, Attachment>;
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
        case DiscordKeys.ATTACHMENTS: {
          if (!this.attachments) {
            this.attachments = new BaseCollection();
          }
          this.attachments.clear();
          for (let attachmentId in value) {
            const attachment = new Attachment(this.client, value[attachmentId]);
            this.attachments.set(attachmentId, attachment);
          }
        }; return;
        case DiscordKeys.CHANNELS: {
          if (!this.channels) {
            this.channels = new BaseCollection();
          }
          this.channels.clear();
          for (let channelId in value) {
            // always create it cause of the 'permissions' field sent in
            value[channelId][DiscordKeys.GUILD_ID] = this.guildId;
            const channel = createChannelFromData(this.client, value[channelId]);
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



const keysInteractionDataModal = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.CUSTOM_ID,
]);

/**
 * Interaction Data Modal Structure
 * @category Structure
 */
export class InteractionDataModal extends BaseStructure {
  readonly _keys = keysInteractionDataModal;
  readonly interaction: Interaction;
  _components?: BaseCollection<number, ComponentActionRow>;

  customId: string = '';

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

  get components(): BaseCollection<number, ComponentActionRow> {
    if (this._components) {
      return this._components;
    }
    return emptyBaseCollection;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.COMPONENTS: {
          if (value.length) {
            if (!this._components) {
              this._components = new BaseCollection<number, ComponentActionRow>();
            }
            this._components.clear();
            for (let i = 0; i < value.length; i++) {
              this._components.set(i, new ComponentActionRow(this.client, value[i]));
            }
          } else {
            if (this._components) {
              this._components.clear();
              this._components = undefined;
            }
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}
