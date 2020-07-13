import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  DiscordKeys,
  DiscordRegex,
  DiscordRegexNames,
  MessageFlags,
  MessageTypes,
  MessageTypesDeletable,
  PremiumGuildTiers,
  PremiumGuildTierNames,
  SystemMessages,
} from '../constants';
import { Markup, Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
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

// we need webhook id before merging the user to make sure not to cache it
const keysMergeMessage = new BaseSet<string>([
  DiscordKeys.WEBHOOK_ID,
  DiscordKeys.AUTHOR,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.MENTIONS,
  DiscordKeys.TYPE,
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
  _attachments?: BaseCollection<string, Attachment>;
  _embeds?: BaseCollection<number, MessageEmbed>;
  _mentions?: BaseCollection<string, Member | User>;
  _mentionChannels?: BaseCollection<string, Channel>;
  _mentionRoles?: BaseCollection<string, null | Role>;
  _reactions?: BaseCollection<string, Reaction>;

  activity?: MessageActivity;
  application?: Application;
  author!: User;
  call?: MessageCall;
  channelId: string = '';
  content: string = '';
  deleted: boolean = false;
  editedTimestampUnix: number = 0;
  flags: number = 0;
  guildId?: string;
  id: string = '';
  member?: Member;
  mentionEveryone: boolean = false;
  messageReference?: MessageReference;
  nonce?: string;
  pinned: boolean = false;
  timestampUnix: number = 0;
  tts: boolean = false;
  type: MessageTypes = MessageTypes.BASE;
  webhookId?: string;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
    Object.defineProperties(this, {
      _content: {configurable: true, enumerable: false, writable: false},
      _attachments: {enumerable: false, writable: true},
      _embeds: {enumerable: false, writable: true},
      _mentions: {enumerable: false, writable: true},
      _mentionChannels: {enumerable: false, writable: true},
      _mentionRoles: {enumerable: false, writable: true},
    });

    if (this.guildId && !this.member) {
      this.member = this.client.members.get(this.guildId, this.author.id);
    }
  }

  get attachments(): BaseCollection<string, Attachment> {
    if (this._attachments) {
      return this._attachments;
    }
    return emptyBaseCollection;
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

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get editedAt(): Date | null {
    return this.editedTimestamp;
  }

  get editedAtUnix(): null | number {
    return this.editedTimestampUnix;
  }

  get editedTimestamp(): Date | null {
    if (this.editedTimestampUnix) {
      return new Date(this.editedTimestampUnix);
    }
    return null;
  }

  get embeds(): BaseCollection<number, MessageEmbed> {
    if (this._embeds) {
      return this._embeds;
    }
    return emptyBaseCollection;
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

  get hasAttachment(): boolean {
    return !!(this.attachments.length || this.embeds.some((embed) => embed.hasAttachment));
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
    return !!this.editedTimestampUnix;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(this.guildId, this.channelId, this.id);
  }

  get mentions(): BaseCollection<string, Member | User> {
    if (this._mentions) {
      return this._mentions;
    }
    return emptyBaseCollection;
  }

  get mentionChannels(): BaseCollection<string, Channel> {
    if (this._mentionChannels) {
      return this._mentionChannels;
    }
    return emptyBaseCollection;
  }

  get mentionRoles(): BaseCollection<string, null | Role> {
    if (this._mentionRoles) {
      return this._mentionRoles;
    }
    return emptyBaseCollection;
  }

  get reactions(): BaseCollection<string, Reaction> {
    if (this._reactions) {
      return this._reactions;
    }
    return emptyBaseCollection;
  }

  get systemContent(): string {
    switch (this.type) {
      case MessageTypes.BASE:
      case MessageTypes.DEFAULT: {
        return this.content;
      };
      default: {
        Object.defineProperty(this, '_content', {
          value: messageSystemContent(this),
        });
      };
    }
    return this._content;
  }

  get timestamp(): Date {
    return new Date(this.timestampUnix);
  }

  convertContent(
    options: {
      escapeMentions?: boolean,
      guildSpecific?: boolean,
      nick?: boolean,
      text?: string,
    } = {},
  ): string {
    const escape = !!(options.escapeMentions || options.escapeMentions === undefined);
    const guildSpecific = !!(options.guildSpecific || options.guildSpecific === undefined);
    const nick = !!(options.nick || options.nick === undefined);

    let content = (options.text !== undefined) ? options.text : this.systemContent;
    content = content.replace(DiscordRegex[DiscordRegexNames.MENTION_CHANNEL], (match, id) => {
      if (this.mentionChannels.has(id)) {
        const channel = this.mentionChannels.get(id) as Channel;
        return channel.toString();
      } else {
        if (this.client.channels.has(id)) {
          const channel = this.client.channels.get(id) as Channel;
          if (guildSpecific && this.guildId) {
            if (this.guildId === channel.guildId) {
              return channel.toString();
            }
          } else {
            return channel.toString();
          }
        }
      }
      return '#deleted-channel';
    });

    const guild = this.guild;
    content = content.replace(DiscordRegex[DiscordRegexNames.MENTION_ROLE], (match, id) => {
      if (guild && guild.roles.has(id)) {
        const role = <Role> guild.roles.get(id);
        return `@${role}`;
      }
      return '@deleted-role';
    });

    content = content.replace(DiscordRegex[DiscordRegexNames.MENTION_USER], (match, mentionType, id) => {
      if (this.mentions.has(id)) {
        const memberOrUser = this.mentions.get(id) as Member | User;
        if (nick) {
          return `@${memberOrUser.name}`;
        }
        return `@${memberOrUser}`;
      } else {
        if (guildSpecific && this.guildId) {
          if (this.client.members.has(this.guildId, id)) {
            const member = this.client.members.get(this.guildId, id) as Member;
            if (nick) {
              return `@${member.name}`;
            }
            return `@${member}`;
          }
        } else {
          if (this.client.users.has(id)) {
            const user = this.client.users.get(id) as User;
            return `@${user}`;
          }
        }
      }
      return match;
    });

    if (escape) {
      content = Markup.escape.mentions(content);
    }
    return content;
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

  async triggerTyping() {
    return this.client.rest.triggerTyping(this.channelId);
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
          if (value.length) {
            if (!this._attachments) {
              this._attachments = new BaseCollection<string, Attachment>();
            }
            this._attachments.clear();
            for (let raw of value) {
              this._attachments.set(raw.id, new Attachment(this, raw));
            }
          } else {
            if (this._attachments) {
              this._attachments.clear();
              this._attachments = undefined;
            }
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
              value: messageSystemContent(this, value),
            });
          }
        }; break;
        case DiscordKeys.EDITED_TIMESTAMP: {
          this.editedTimestampUnix = (value) ? (new Date(value).getTime()) : 0;
        }; return;
        case DiscordKeys.EMBEDS: {
          if (value.length) {
            if (!this._embeds) {
              this._embeds = new BaseCollection<number, MessageEmbed>();
            }
            this._embeds.clear();
            for (let i = 0; i < value.length; i++) {
              this._embeds.set(i, new MessageEmbed(this.client, value[i]));
            }
          } else {
            if (this._embeds) {
              this._embeds.clear();
              this._embeds = undefined;
            }
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
          if (value.length) {
            if (!this._mentions) {
              this._mentions = new BaseCollection<string, Member | User>();
            }
            this._mentions.clear();

            const guildId = <string> this.guildId;
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
                this._mentions.set(member.id, member);
              } else {
                if (guildId && this.client.members.has(guildId, raw.id)) {
                  const member = <Member> this.client.members.get(guildId, raw.id);
                  member.merge({user: raw});
                  this._mentions.set(member.id, member);
                } else {
                  let user: User;
                  if (this.client.users.has(raw.id)) {
                    user = <User> this.client.users.get(raw.id);
                    user.merge(raw);
                  } else {
                    user = new User(this.client, raw);
                    this.client.users.insert(user);
                  }
                  this._mentions.set(user.id, user);
                }
              }
            }
          } else {
            if (this._mentions) {
              this._mentions.clear();
              this._mentions = undefined;
            }
          }
        }; return;
        case DiscordKeys.MENTION_CHANNELS: {
          if (value.length) {
            if (!this._mentionChannels) {
              this._mentionChannels = new BaseCollection<string, Channel>();
            }
            this._mentionChannels.clear();
            for (let raw of value) {
              let channel: Channel;
              if (this.client.channels.has(raw.id)) {
                channel = <Channel> this.client.channels.get(raw.id);
                channel.merge(raw);
              } else {
                raw.is_partial = true;
                channel = createChannelFromData(this.client, raw);
              }
              this._mentionChannels.set(channel.id, channel);
            }
          } else {
            if (this._mentionChannels) {
              this._mentionChannels.clear();
              this._mentionChannels = undefined;
            }
          }
        }; return;
        case DiscordKeys.MENTION_ROLES: {
          if (value.length) {
            if (!this._mentionRoles) {
              this._mentionRoles = new BaseCollection<string, null | Role>();
            }
            this._mentionRoles.clear();

            const guild = this.guild;
            for (let roleId of value) {
              this._mentionRoles.set(roleId, (guild) ? guild.roles.get(roleId) || null : null);
            }
          } else {
            if (this._mentionRoles) {
              this._mentionRoles.clear();
              this._mentionRoles = undefined;
            }
          }
        }; return;
        case DiscordKeys.MESSAGE_REFERENCE: {
          value = new MessageReference(this, value);
        }; break;
        case DiscordKeys.REACTIONS: {
          if (value.length) {
            if (!this._reactions) {
              this._reactions = new BaseCollection<string, Reaction>();
            }
            this._reactions.clear();
            for (let raw of value) {
              raw.channel_id = this.channelId;
              raw.guild_id = this.guildId;
              raw.message_id = this.id;

              const emojiId = raw.emoji.id || raw.emoji.name;
              this.reactions.set(emojiId, new Reaction(this.client, raw));
            }
          } else {
            if (this._reactions) {
              this._reactions.clear();
              this._reactions = undefined;
            }
          }
        }; return;
        case DiscordKeys.TIMESTAMP: {
          this.timestampUnix = (new Date(value)).getTime();
        }; return;
      }
      return super.mergeValue(key, value);
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

  get group(): BaseCollection<string, User> {
    const group = new BaseCollection<string, User>();
    if (this.partyId) {
      for (let [userId, presence] of this.client.presences) {
        for (let [activityId, activity] of presence.activities) {
          if (activity.party && activity.party.id === this.partyId) {
            group.set(userId, presence.user);
            break;
          }
        }
      }
    }
    return group;
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
      return super.mergeValue(key, value);
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


export function messageSystemContent(
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
