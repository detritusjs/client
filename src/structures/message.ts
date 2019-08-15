import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import {
  MessageTypes,
  PremiumGuildTiers,
  PremiumGuildTierNames,
  SystemMessages,
} from '../constants';
import {
  toCamelCase,
  Snowflake,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Application } from './application';
import { Attachment } from './attachment';
import { Channel } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { MessageEmbed } from './messageembed';
import { Reaction } from './reaction';
import { Role } from './role';
import { User } from './user';


export interface MessageReply extends RequestTypes.CreateMessage {
  mention?: boolean,
}

export interface MessageEdit extends RequestTypes.EditMessage {
  mention?: boolean,
}


const keysMessage: ReadonlyArray<string> = [
  'activity',
  'application',
  'attachments',
  'author',
  'call',
  'channel_id',
  'content',
  'edited_timestamp',
  'embeds',
  'guild_id',
  'id',
  'member',
  'mentions',
  'mention_everyone',
  'mention_roles',
  'nonce',
  'pinned',
  'reactions',
  'timestamp',
  'tts',
  'type',
  'webhook_id',
];

const keysMergeMessage: ReadonlyArray<string> = [
  'author',
  'channel_id',
  'guild_id',
  'id',
  'mentions',
  'type',
  'webhook_id',
];

/**
 * Channel Message Structure
 * @category Structure
 */
export class Message extends BaseStructure {
  readonly _keys = keysMessage;
  readonly _keysMerge = keysMergeMessage;
  _content = '';

  activity?: MessageActivity;
  application?: Application;
  attachments = new BaseCollection<number, Attachment>();
  author!: User;
  call?: MessageCall;
  channelId: string = '';
  content: string = '';
  editedTimestamp?: Date | null;
  embeds = new BaseCollection<number, MessageEmbed>();
  flags: number = 0;
  guildId?: string;
  id: string = '';
  member?: Member;
  mentions = new BaseCollection<string, Member | User>();
  mentionEveryone: boolean = false;
  mentionRoles = new BaseCollection<string, null | Role>();
  nonce?: string;
  pinned: boolean = false;
  reactions = new BaseCollection<string, Reaction>();
  timestamp!: Date;
  tts: boolean = false;
  type = MessageTypes.BASE;
  webhookId?: string;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
    Object.defineProperty(this, '_content', {
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }

  get canDelete(): boolean {
    if (this.fromMe) {
      return true;
    }
    return this.canManage;
  }

  get canManage(): boolean {
    const channel = this.channel;
    return !!(channel && channel.canManageMessages);
  }

  get canReact(): boolean {
    const channel = this.channel;
    return !!(channel && channel.canAddReactions);
  }

  get canReply(): boolean {
    const channel = this.channel;
    return !!(channel && channel.canMessage);
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) || null;
  }

  get contentFormatted(): string {
    switch (this.type) {
      case MessageTypes.BASE:
      case MessageTypes.DEFAULT: {
        return this.content;
      };
      default: {
        Object.defineProperty(this, '_content', {
          value: messageContentFormat(this),
        });
      };
    }
    return this._content;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get editedAt(): Date | null {
    if (this.editedTimestamp) {
      return this.editedTimestamp;
    }
    return null;
  }

  get editedAtUnix(): null | number {
    if (this.editedTimestamp) {
      return this.editedTimestamp.getTime();
    }
    return null;
  }

  get fromBot(): boolean {
    return this.author.bot;
  }

  get fromMe(): boolean {
    return this.author.isMe;
  }

  get fromSystem(): boolean {
    return this.type !== MessageTypes.DEFAULT;
  }

  get fromUser(): boolean {
    return !this.fromBot && !this.fromSystem && !this.fromWebhook;
  }

  get fromWebhook(): boolean {
    return !!this.webhookId;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get inDm(): boolean {
    // messages from rest doesn\'t provide this..
    return !this.guildId;
  }

  get isEdited(): boolean {
    return !!this.editedTimestamp;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(this.guildId, this.channelId, this.id);
  }

  get timestampUnix(): number {
    return this.timestamp.getTime();
  }

  async ack(token: string) {
    return this.client.rest.ackChannelMessage(this.channelId, this.id, token);
  }

  async delete() {
    return this.client.rest.deleteMessage(this.channelId, this.id);
  }

  async deleteReaction(emoji: string, userId: string = '@me') {
    return this.client.rest.deleteReaction(this.channelId, this.id, emoji, userId);
  }

  async deleteReactions() {
    return this.client.rest.deleteReactions(this.channelId, this.id);
  }

  async edit(options: RequestTypes.EditMessage) {
    return this.client.rest.editMessage(this.channelId, this.id, options);
  }

  async fetchReactions(
    emoji: string,
    options: RequestTypes.FetchReactions = {},
  ) {
    return this.client.rest.fetchReactions(this.channelId, this.id, emoji, options);
  }

  async pin() {
    return this.client.rest.addPinnedMessage(this.channelId, this.id);
  }

  async publish(options: RequestTypes.CreateApplicationNews) {
    options.channelId = this.channelId;
    options.messageId = this.id;
    return this.client.rest.createApplicationNews(options);
  }

  async react(emoji: string) {
    return this.client.rest.createReaction(this.channelId, this.id, emoji);
  }

  async removeMention() {
    return this.client.rest.removeMention(this.id);
  }

  async reply(options: MessageReply | string = '') {
    if (typeof(options) === 'string') {
      options = {content: options};
    }
    if (options.mention) {
      options.content = [
        this.author.mention,
        options.content,
      ].filter((v) => v).join(', ');
    }
    return this.client.rest.createMessage(this.channelId, options);
  }

  async replyEdit(options: MessageEdit | string = '') {
    if (typeof(options) === 'string') {
      options = {content: options};
    }
    if (options.mention) {
      options.content = [
        this.author.mention,
        options.content,
      ].filter((v) => v).join(', ');
    }
    return this.edit(options);
  }

  async suppressEmbeds(suppress: boolean = true) {
    return this.client.rest.messageSuppressEmbeds(this.channelId, this.id, {suppress});
  }

  async unpin() {
    return this.client.rest.deletePinnedMessage(this.channelId, this.id);
  }

  difference(key: string, value: any): [boolean, any] {
    let differences: any;
    switch (key) {
      case 'application': break;
      case 'author': break;
      case 'attachments':
      case 'embeds':
      case 'mentions':
      case 'mention_roles': {
        key = toCamelCase(key);
        const old = (<any> this)[key];
        if (old.size && old.size !== value.length) {
          differences = old.clone();
        }
      }; break;
      default: {
        return super.difference.call(this, key, value);
      };
    }
    if (differences) {
      return [true, differences];
    }
    return [false, null];
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'activity': {
          value = new MessageActivity(this, value);
        }; break;
        case 'application': {
          let application: Application;
          if (this.client.applications.has(value.id)) {
            application = <Application> this.client.applications.get(value.id);
            application.merge(value);
          } else {
            application = new Application(this.client, value);
          }
          value = application;
        }; break;
        case 'attachments': {
          this.attachments.clear();
          for (let raw of value) {
            this.attachments.set(raw.id, new Attachment(this, raw));
          }
        }; return;
        case 'author': {
          let user: User;
          if (this.fromWebhook) {
            user = new User(this.client, value);
          } else {
            if (this.client.users.has(value.id)) {
              user = <User> this.client.users.get(value.id);
              user.merge(value);
            } else {
              user = new User(this.client, value);
              this.client.users.insert(user);
            }
          }
          value = user;
        }; break;
        case 'call': {
          value = new MessageCall(this, value);
        }; break;
        case 'content': {
          if (this._content) {
            Object.defineProperty(this, '_content', {
              value: messageContentFormat(this),
            });
          }
        }; break;
        case 'edited_timestamp': {
          if (value) {
            value = new Date(value);
          }
        }; break;
        case 'embeds': {
          this.embeds.clear();
          for (let i = 0; i < value.length; i++) {
            this.embeds.set(i, new MessageEmbed(this.client, value[i]));
          }
        }; return;
        case 'member': {
          const guildId = <string> this.guildId;
          let member: Member;
          if (this.client.members.has(guildId, this.author.id)) {
            member = <Member> this.client.members.get(guildId, this.author.id);
            // should we merge? this event is so common
          } else {
            value.guild_id = guildId;
            member = new Member(this.client, value);
            member.user = this.author;
          }
          value = member;
        }; break;
        case 'mentions': {
          const guildId = <string> this.guildId;
          this.mentions.clear();
          for (let raw of value) {
            if (raw.member) {
              let member: Member;
              if (this.client.members.has(guildId, raw.id)) {
                member = <Member> this.client.members.get(guildId, raw.id);
                // should we merge?
              } else {
                raw.member.guild_id = guildId;
                raw.member.user = raw;
                member = new Member(this.client, raw.member);
                this.client.members.insert(member);
              }
              this.mentions.set(member.id, member);
            } else {
              let user: User;
              if (this.client.users.has(raw.id)) {
                user = <User> this.client.users.get(raw.id);
                user.merge(raw);
              } else {
                user = new User(this.client, raw);
                this.client.users.insert(user);
              }
              this.mentions.set(user.id, user);
            }
          }
        }; return;
        case 'mention_roles': {
          this.mentionRoles.clear();

          const guild = this.guild;
          for (let roleId of value) {
            if (guild && guild.roles.has(roleId)) {
              this.mentionRoles.set(roleId, <Role> guild.roles.get(roleId));
            } else {
              this.mentionRoles.set(roleId, null);
            }
          }
        }; return;
        case 'message_reference': {

        }; break;
        case 'reactions': {
          this.reactions.clear();
          for (let raw of value) {
            raw.channel_id = this.channelId;
            raw.guild_id = this.guildId;
            raw.message_id = this.id;

            const emojiId = raw.emoji.id || raw.emoji.name;
            this.reactions.set(emojiId, new Reaction(this.client, raw));
          }
        }; return;
        case 'timestamp': {
          value = new Date(value);
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }

  toString(): string {
    return this.content;
  }
}


const keysMessageActivity: ReadonlyArray<string> = [
  'party_id',
  'type',
];

/**
 * Channel Message Activity Structure, used for inviting people to listen/join
 * @category Structure
 */
export class MessageActivity extends BaseStructure {
  readonly _keys = keysMessageActivity;
  message: Message;

  coverImage: null | string = null;
  name: null | string = null;
  partyId: string = '';
  type: number = 0;

  constructor(message: Message, data: BaseStructureData) {
    super(message.client);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }
}


const keysMessageCall: ReadonlyArray<string> = [
  'ended_timestamp',
  'participants',
];

/**
 * Channel Message Call Structure, used to define the call properties in the DM it's from
 * Used to format the content
 * @category Structure
 */
export class MessageCall extends BaseStructure {
  readonly _keys = keysMessageCall;
  message: Message;

  endedTimestamp: Date | null = null;
  participants: Array<string> = [];

  constructor(message: Message, data: BaseStructureData) {
    super(message.client);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  get isEnded(): boolean {
    return !!this.endedTimestamp;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'ended_timestamp': {
          if (value) {
            value = new Date(value);
          }
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}


export function messageContentFormat(
  message: Message,
  content?: string,
): string {
  if (content === undefined) {
    content = message.content;
  }

  switch (message.type) {
    case MessageTypes.RECIPIENT_ADD: {
      const otherUser = message.mentions.first();
      content = SystemMessages.RecipientAdd.replace(/:user:/g, message.author.mention);
      content = content.replace(/:user2:/, (otherUser) ? otherUser.mention : 'UnknownUser');
    }; break;
    case MessageTypes.RECIPIENT_REMOVE: {
      const user = message.mentions.first();
      if (user && user.id !== message.author.id) {
        content = SystemMessages.RecipientRemove.replace(/:user:/g, message.author.mention);
        content = content.replace(/:user2:/g, user.mention);
      } else {
        content = SystemMessages.RecipientRemoveSelf.replace(/:user:/g, message.author.mention);
      }
    }; break;
    case MessageTypes.CALL: {
      content = SystemMessages.CallStarted.replace(/:user:/g, message.author.mention);
    }; break;
    case MessageTypes.CHANNEL_NAME_CHANGE: {
      content = SystemMessages.ChannelNameChange.replace(/:name:/g, content);
      content = content.replace(/:user:/g, message.author.mention);
    }; break;
    case MessageTypes.CHANNEL_ICON_CHANGE: {
      content = SystemMessages.ChannelIconChange.replace(/:user:/g,  message.author.mention);
    }; break;
    case MessageTypes.CHANNEL_PINNED_MESSAGE: {
      content = SystemMessages.PinnedMessage.replace(/:user:/g, message.author.mention);
    }; break;
    case MessageTypes.GUILD_MEMBER_JOIN: {
      const number = message.createdAtUnix % SystemMessages.GuildMemberJoin.length;
      content = (<any> SystemMessages.GuildMemberJoin)[number].replace(/:user:/g, message.author.mention);
    }; break;
    case MessageTypes.GUILD_PREMIUM_SUBSCRIPTION: {
      content = SystemMessages.GuildMemberSubscribed.replace(/:user:/g, message.author.mention);
    }; break;
    case MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_1:
    case MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_2:
    case MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_3: {
      let premiumTier = PremiumGuildTiers.NONE;
      switch (message.type) {
        case MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_1: {
          premiumTier = PremiumGuildTiers.TIER_1;
        }; break;
        case MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_2: {
          premiumTier = PremiumGuildTiers.TIER_2;
        }; break;
        case MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_3: {
          premiumTier = PremiumGuildTiers.TIER_3;
        }; break;
      }
      const channel = message.channel;
      if (!channel) {
        return SystemMessages.GuildMemberSubscribed.replace(/:user:/g, message.author.mention);
      }
      const guild = channel.guild;
      if (!guild) {
        return SystemMessages.GuildMemberSubscribed.replace(/:user:/g, message.author.mention);
      }
      content = SystemMessages.GuildMemberSubscribedAchievedTier.replace(/:user:/g, message.author.mention);
      content = content.replace(/:guild:/g, guild.toString());
      content = content.replace(/:premiumTier:/g, (<any> PremiumGuildTierNames)[premiumTier]);
    }; break;
  }
  return <string> content;
}
