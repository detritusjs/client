import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { ChannelTypes, DiscordKeys, InteractionTypes, MessageComponentTypes } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { Message } from './message';
import { Role } from './role';
import { User } from './user';


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
    return !!this.member;
  }

  get userId(): string {
    return this.user.id;
  }

  deleteMessage(messageId: string) {
    return this.client.rest.deleteWebhookTokenMessage(this.applicationId, this.token, messageId);
  }

  editMessage(messageId: string, options: RequestTypes.EditWebhookTokenMessage = {}) {
    return this.client.rest.editWebhookTokenMessage(this.applicationId, this.token, messageId, options);
  }

  fetchMessage(messageId: string) {
    return this.client.rest.fetchWebhookTokenMessage(this.applicationId, this.token, messageId);
  }

  reply(options: RequestTypes.ExecuteWebhook) {
    return this.client.rest.executeWebhook(this.applicationId, this.token, options);
  }

  respond(options: RequestTypes.CreateInteractionResponse) {
    return this.client.rest.createInteractionResponse(this.id, this.token, options);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.DATA: {
          switch (this.type) {
            case InteractionTypes.PING: {

            }; break;
            case InteractionTypes.APPLICATION_COMMAND: {
              value = new InteractionDataApplicationCommand(this.client, value);
            }; break;
            case InteractionTypes.MESSAGE_COMPONENT: {
              value = new InteractionDataComponent(this.client, value);
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

  id: string = '';
  name: string = '';
  options: any;
  resolved!: InteractionDataApplicationCommandResolved;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.RESOLVED: {
          value = new InteractionDataApplicationCommandResolved(this.client, value);
        }; break;
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

  channels?: BaseCollection<string, {id: string, name: string, permissions: bigint, type: ChannelTypes}>;
  members?: BaseCollection<string, Member>;
  roles?: BaseCollection<string, Role>;
  users?: BaseCollection<string, User>;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
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
            this.channels.set(channelId, value[channelId]);
          }
        }; return;
        case DiscordKeys.MEMBERS: {
          if (!this.members) {
            this.members = new BaseCollection();
          }
          this.members.clear();
          for (let userId in value) {
            value[userId].user = (this.users) ? this.users.get(userId) : this.client.users.get(userId);
            const member = new Member(this.client, value[userId], true);
            this.members.set(userId, member);
          }
        }; return;
        case DiscordKeys.ROLES: {
          if (!this.roles) {
            this.roles = new BaseCollection();
          }
          this.roles.clear();
          for (let roleId in value) {
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

  componentType: MessageComponentTypes = MessageComponentTypes.BUTTON;
  customId: string = '';
  values?: Array<string>;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }
}
