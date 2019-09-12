import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  DiscordKeys,
  MessageFlags,
  MessageTypes,
  MessageTypesDeletable,
  PremiumGuildTiers,
  PremiumGuildTierNames,
  SystemMessages,
} from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
  convertKey,
} from './basestructure';
import { Application } from './application';
import { Attachment } from './attachment';
import { Channel, createChannelFromData } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { MessageEmbed } from './messageembed';
import { Reaction } from './reaction';
import { Role } from './role';
import { User } from './user';


const keysMessage = new BaseSet<string>([
  DiscordKeys.ACTIVITY,
  DiscordKeys.APPLICATION,
  DiscordKeys.ATTACHMENTS,
  DiscordKeys.AUTHOR,
  DiscordKeys.CALL,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.CONTENT,
  DiscordKeys.EDITED_TIMESTAMP,
  DiscordKeys.EMBEDS,
  DiscordKeys.FLAGS,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.MEMBER,
  DiscordKeys.MENTIONS,
  DiscordKeys.MENTION_CHANNELS,
  DiscordKeys.MENTION_EVERYONE,
  DiscordKeys.MENTION_ROLES,
  DiscordKeys.MESSAGE_REFERENCE,
  DiscordKeys.NONCE,
  DiscordKeys.PINNED,
  DiscordKeys.REACTIONS,
  DiscordKeys.TIMESTAMP,
  DiscordKeys.TTS,
  DiscordKeys.TYPE,
  DiscordKeys.WEBHOOK_ID,
]);

const keysMergeMessage = new BaseSet<string>([
  DiscordKeys.AUTHOR,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.MENTIONS,
  DiscordKeys.TYPE,
  DiscordKeys.WEBHOOK_ID,
]);

const keysSkipDifferenceMessage = new BaseSet<string>([
  DiscordKeys.AUTHOR,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.MEMBER,
]);

/**
 * Channel Message Structure
 * @category Structure
 */
export class Message extends BaseStructure {
  readonly _keys = keysMessage;
  readonly _keysMerge = keysMergeMessage;
  readonly _keysSkipDifference = keysSkipDifferenceMessage;
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
  mentionChannels?: BaseCollection<string, Channel>;
  mentionEveryone: boolean = false;
  messageReference?: MessageReference;
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

    if (this.guildId && !this.member) {
      this.member = this.client.members.get(this.guildId, this.author.id);
    }
  }

  get canDelete(): boolean {
    if (this.fromMe || this.canManage) {
      if (this.type in MessageTypesDeletable && MessageTypesDeletable[this.type]) {
        return true;
      }
    }
    return false;
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

  get hasFlagCrossposted(): boolean {
    return this.hasFlag(MessageFlags.CROSSPOSTED);
  }

  get hasFlagIsCrossposted(): boolean {
    return this.hasFlag(MessageFlags.IS_CROSSPOST);
  }

  get hasFlagSuppressEmbeds(): boolean {
    return this.hasFlag(MessageFlags.SUPPRESS_EMBEDS);
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

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }

  async ack(token: string) {
    return this.client.rest.ackChannelMessage(this.channelId, this.id, token);
  }

  async delete(options: RequestTypes.DeleteMessage = {}) {
    return this.client.rest.deleteMessage(this.channelId, this.id, options);
  }

  async deleteReaction(emoji: string, userId: string = '@me') {
    return this.client.rest.deleteReaction(this.channelId, this.id, emoji, userId);
  }

  async deleteReactions() {
    return this.client.rest.deleteReactions(this.channelId, this.id);
  }

  async edit(options: RequestTypes.EditMessage | string = {}) {
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

  async reply(options: RequestTypes.CreateMessage | string = {}) {
    return this.client.rest.createMessage(this.channelId, options);
  }

  async suppressEmbeds(suppress: boolean = true) {
    return this.client.rest.messageSuppressEmbeds(this.channelId, this.id, {suppress});
  }

  async unpin() {
    return this.client.rest.deletePinnedMessage(this.channelId, this.id);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.ACTIVITY: {
          value = new MessageActivity(this, value);
        }; break;
        case DiscordKeys.APPLICATION: {
          let application: Application;
          if (this.client.applications.has(value.id)) {
            application = <Application> this.client.applications.get(value.id);
            application.merge(value);
          } else {
            application = new Application(this.client, value);
          }
          value = application;
        }; break;
        case DiscordKeys.ATTACHMENTS: {
          this.attachments.clear();
          for (let raw of value) {
            this.attachments.set(raw.id, new Attachment(this, raw));
          }
        }; return;
        case DiscordKeys.AUTHOR: {
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
        case DiscordKeys.CALL: {
          value = new MessageCall(this, value);
        }; break;
        case DiscordKeys.CONTENT: {
          if (this._content) {
            Object.defineProperty(this, '_content', {
              value: messageContentFormat(this, value),
            });
          }
        }; break;
        case DiscordKeys.EDITED_TIMESTAMP: {
          if (value) {
            value = new Date(value);
          }
        }; break;
        case DiscordKeys.EMBEDS: {
          this.embeds.clear();
          for (let i = 0; i < value.length; i++) {
            this.embeds.set(i, new MessageEmbed(this.client, value[i]));
          }
        }; return;
        case DiscordKeys.MEMBER: {
          const guildId = <string> this.guildId;
          let member: Member;
          if (this.client.members.has(guildId, this.author.id)) {
            member = <Member> this.client.members.get(guildId, this.author.id);
            // should we merge? this event is so common
          } else {
            value.guild_id = guildId;
            value.user = this.author;
            member = new Member(this.client, value);
          }
          value = member;
        }; break;
        case DiscordKeys.MENTIONS: {
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
                member = new Member(this.client, raw.member);
                member.merge({user: raw});
                this.client.members.insert(member);
              }
              this.mentions.set(member.id, member);
            } else {
              if (guildId && this.client.members.has(guildId, raw.id)) {
                const member = <Member> this.client.members.get(guildId, raw.id);
                member.merge({user: raw});
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
          }
        }; return;
        case DiscordKeys.MENTION_CHANNELS: {
          if (!this.mentionChannels) {
            this.mentionChannels = new BaseCollection<string, Channel>();
          }
          this.mentionChannels.clear();
          for (let raw of value) {
            let channel: Channel;
            if (this.client.channels.has(raw.id)) {
              channel = <Channel> this.client.channels.get(raw.id);
              channel.merge(raw);
            } else {
              channel = createChannelFromData(this.client, raw);
            }
            this.mentionChannels.set(channel.id, channel);
          }
        }; return;
        case DiscordKeys.MENTION_ROLES: {
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
        case DiscordKeys.MESSAGE_REFERENCE: {
          value = new MessageReference(this, value);
        }; break;
        case DiscordKeys.REACTIONS: {
          this.reactions.clear();
          for (let raw of value) {
            raw.channel_id = this.channelId;
            raw.guild_id = this.guildId;
            raw.message_id = this.id;

            const emojiId = raw.emoji.id || raw.emoji.name;
            this.reactions.set(emojiId, new Reaction(this.client, raw));
          }
        }; return;
        case DiscordKeys.TIMESTAMP: {
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


const keysMessageActivity = new BaseSet<string>([
  DiscordKeys.COVER_IMAGE,
  DiscordKeys.NAME,
  DiscordKeys.PARTY_ID,
  DiscordKeys.TYPE,
]);

/**
 * Channel Message Activity Structure, used for inviting people to listen/join
 * @category Structure
 */
export class MessageActivity extends BaseStructure {
  readonly _keys = keysMessageActivity;
  readonly message: Message;

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


const keysMessageCall = new BaseSet<string>([
  DiscordKeys.ENDED_TIMESTAMP,
  DiscordKeys.PARTICIPANTS,
]);

/**
 * Channel Message Call Structure, used to define the call properties in the DM it's from
 * Used to format the content
 * @category Structure
 */
export class MessageCall extends BaseStructure {
  readonly _keys = keysMessageCall;
  readonly message: Message;

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


const keysMessageReference = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.GUILD_ID,
  DiscordKeys.MESSAGE_ID,
]);

/**
 * Channel Message Reference Structure, used to tell the client that this is from a server webhook
 * Used for crossposts
 * @category Structure
 */
export class MessageReference extends BaseStructure {
  readonly _keys = keysMessageReference;
  readonly message: Message;

  channelId: string = '';
  guildId: string = '';
  messageId?: string;

  constructor(message: Message, data: BaseStructureData) {
    super(message.client);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  get channel(): null | Channel {
    return this.client.channels.get(this.channelId) || null;
  }

  get guild(): null | Guild {
    return this.client.guilds.get(this.guildId) || null;
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
    case MessageTypes.CHANNEL_FOLLOW_ADD: {
      content = SystemMessages.ChannelFollowAdd.replace(/:user:/g, message.author.mention);
      content = content.replace(/:webhookName:/g, message.content);
    }; break;
  }
  return <string> content;
}
