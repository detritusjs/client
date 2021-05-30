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
  InteractionTypes,
  MessageComponentButtonStyles,
  MessageComponentTypes,
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
import { Channel, ChannelGuildThread, ChannelTextType, createChannelFromData } from './channel';
import { Emoji } from './emoji';
import { Guild } from './guild';
import { Member } from './member';
import { MessageEmbed } from './messageembed';
import { PresenceActivity } from './presence';
import { Reaction } from './reaction';
import { Role } from './role';
import { Sticker } from './sticker';
import { User } from './user';


const keysMessage = new BaseSet<string>([
  DiscordKeys.ACTIVITY,
  DiscordKeys.APPLICATION,
  DiscordKeys.ATTACHMENTS,
  DiscordKeys.AUTHOR,
  DiscordKeys.CALL,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.COMPONENTS,
  DiscordKeys.CONTENT,
  DiscordKeys.EDITED_TIMESTAMP,
  DiscordKeys.EMBEDS,
  DiscordKeys.FLAGS,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.INTERACTION,
  DiscordKeys.MEMBER,
  DiscordKeys.MENTIONS,
  DiscordKeys.MENTION_CHANNELS,
  DiscordKeys.MENTION_EVERYONE,
  DiscordKeys.MENTION_ROLES,
  DiscordKeys.MESSAGE_REFERENCE,
  DiscordKeys.NONCE,
  DiscordKeys.PINNED,
  DiscordKeys.REACTIONS,
  DiscordKeys.REFERENCED_MESSAGE,
  DiscordKeys.STICKERS,
  DiscordKeys.THREAD,
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
  _components?: BaseCollection<number, MessageComponentActionRow>;
  _embeds?: BaseCollection<number, MessageEmbed>;
  _mentions?: BaseCollection<string, Member | User>;
  _mentionChannels?: BaseCollection<string, Channel>;
  _mentionRoles?: BaseCollection<string, null | Role>;
  _reactions?: BaseCollection<string, Reaction>;
  _stickers?: BaseCollection<string, Sticker>;

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
  interaction?: MessageInteraction;
  member?: Member;
  mentionEveryone: boolean = false;
  messageReference?: MessageReference;
  nonce?: string;
  pinned: boolean = false;
  referencedMessage: Message | null = null;
  thread?: ChannelGuildThread;
  timestampUnix: number = 0;
  tts: boolean = false;
  type: MessageTypes = MessageTypes.BASE;
  webhookId?: string;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
    Object.defineProperties(this, {
      _content: {configurable: true, enumerable: false, writable: false},
      _attachments: {enumerable: false, writable: true},
      _embeds: {enumerable: false, writable: true},
      _mentions: {enumerable: false, writable: true},
      _mentionChannels: {enumerable: false, writable: true},
      _mentionRoles: {enumerable: false, writable: true},
      _reactions: {enumerable: false, writable: true},
      _stickers: {enumerable: false, writable: true},
    });

    if (this.guildId && !this.member) {
      this.member = this.client.members.get(this.guildId, this.author.id);
      if (this.member && this.isClone) {
        this.member = this.member.clone();
      }
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
    return (channel) ? channel.canAddReactions: this.inDm;
  }

  get canReply(): boolean {
    const channel = this.channel;
    return (channel) ? channel.canMessage : this.inDm;
  }

  get channel(): ChannelTextType | null {
    if (this.client.channels.has(this.channelId)) {
      return this.client.channels.get(this.channelId) as ChannelTextType;
    }
    return null;
  }

  get components(): BaseCollection<number, MessageComponentActionRow> {
    if (this._components) {
      return this._components;
    }
    return emptyBaseCollection;
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

  get editedAtUnix(): number {
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
    return this.type !== MessageTypes.DEFAULT && !this.isReply;
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

  get isReply(): boolean {
    return this.type === MessageTypes.REPLY;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(this.guildId, this.channelId, this.id);
  }

  get mentionHere(): boolean {
    return this.mentionEveryone && !this.content.includes('@everyone');
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

  get stickers(): BaseCollection<string, Sticker> {
    if (this._stickers) {
      return this._stickers;
    }
    return emptyBaseCollection;
  }

  get systemContent(): string {
    switch (this.type) {
      case MessageTypes.BASE:
      case MessageTypes.DEFAULT: 
      case MessageTypes.REPLY: {
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
        const channel = this.mentionChannels.get(id)!;
        return channel.toString();
      } else {
        if (this.client.channels.has(id)) {
          const channel = this.client.channels.get(id)!;
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
        const role = guild.roles.get(id)!;
        return `@${role}`;
      }
      return '@deleted-role';
    });

    content = content.replace(DiscordRegex[DiscordRegexNames.MENTION_USER], (match, mentionType, id) => {
      if (this.mentions.has(id)) {
        const memberOrUser = this.mentions.get(id)!;
        if (nick) {
          return `@${memberOrUser.name}`;
        }
        return `@${memberOrUser}`;
      } else {
        if (guildSpecific && this.guildId) {
          if (this.client.members.has(this.guildId, id)) {
            const member = this.client.members.get(this.guildId, id)!;
            if (nick) {
              return `@${member.name}`;
            }
            return `@${member}`;
          }
        } else {
          if (this.client.users.has(id)) {
            const user = this.client.users.get(id)!;
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

  async createThread(options: RequestTypes.CreateChannelMessageThread) {
    return this.client.rest.createChannelMessageThread(this.channelId, this.id, options);
  }

  async crosspost() {
    return this.client.rest.crosspostMessage(this.channelId, this.id);
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

  async triggerTyping() {
    return this.client.rest.triggerTyping(this.channelId);
  }

  async unpin() {
    return this.client.rest.deletePinnedMessage(this.channelId, this.id);
  }

  difference(key: string, value: any): [boolean, any] {
    let differences: any;
    switch (key) {
      case DiscordKeys.ATTACHMENTS: {
        // just check if any of the attachment ids are not in our own cache
        const hasDifference = (this.attachments.length !== value.length) || value.some((raw: any) => {
          return !this.attachments.has(raw.id);
        });
        if (hasDifference) {
          differences = this.attachments.clone();
        }
      }; break;
      case DiscordKeys.EMBEDS: {
        // this one might be difficult, i guess we're gonna have to do a deep difference dive
        const hasDifference = (this.embeds.length !== value.length) || value.some((raw: any, i: number) => {
          const embed = this.embeds.get(i);
          if (embed) {
            return !!embed.differences(raw);
          }
          return true;
        });
        if (hasDifference) {
          differences = this.embeds.clone();
        }
      }; break;
      case DiscordKeys.MENTIONS: {
        // just check the user id
        const hasDifference = (this.mentions.length !== value.length) || value.some((raw: any) => {
          return !this.mentions.has(raw.id);
        });
        if (hasDifference) {
          differences = this.mentions.clone();
        }
      }; break;
      default: {
        return super.difference(key, value);
      };
    }
    if (differences !== undefined) {
      return [true, differences];
    }
    return [false, null];
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.ACTIVITY: {
          value = new MessageActivity(this, value);
        }; break;
        case DiscordKeys.APPLICATION: {
          let application: Application;
          if (this.isClone) {
            application = new Application(this.client, value, this.isClone);
          } else {
            // highly unlikely we have this in cache, but might as well check
            if (this.client.applications.has(value.id)) {
              application = this.client.applications.get(value.id)!;
              application.merge(value);
            } else {
              application = new Application(this.client, value);
            }
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
          if (this.fromWebhook || this.isClone) {
            user = new User(this.client, value, this.isClone);
          } else {
            if (this.client.users.has(value.id)) {
              user = this.client.users.get(value.id)!;
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
        case DiscordKeys.COMPONENTS: {
          if (value.length) {
            if (!this._components) {
              this._components = new BaseCollection<number, MessageComponentActionRow>();
            }
            this._components.clear();
            for (let i = 0; i < value.length; i++) {
              this._components.set(i, new MessageComponentActionRow(this, value[i]));
            }
          } else {
            if (this._components) {
              this._components.clear();
              this._components = undefined;
            }
          }
        }; return;
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
              this._embeds.set(i, new MessageEmbed(this.client, value[i], this.isClone));
            }
          } else {
            if (this._embeds) {
              this._embeds.clear();
              this._embeds = undefined;
            }
          }
        }; return;
        case DiscordKeys.INTERACTION: {
          if (this.interaction) {
            this.interaction.merge(value);
          } else {
            this.interaction = new MessageInteraction(this, value);
          }
        }; return;
        case DiscordKeys.MEMBER: {
          const guildId = this.guildId!;
          value.guild_id = guildId;

          let member: Member;
          if (this.isClone) {
            member = new Member(this.client, value, this.isClone);
            member.user = this.author.clone();
          } else {
            if (this.client.members.has(guildId, this.author.id)) {
              member = this.client.members.get(guildId, this.author.id)!;
              // should we merge? this event is so common so we'll be wasting resources..
            } else {
              member = new Member(this.client, value);
              member.user = this.author.clone();
              this.client.members.insert(member);
            }
          }
          value = member;
        }; break;
        case DiscordKeys.MENTIONS: {
          if (value.length) {
            if (!this._mentions) {
              this._mentions = new BaseCollection<string, Member | User>();
            }
            this._mentions.clear();

            const guildId = this.guildId!;
            for (let raw of value) {
              if (raw.user) {
                // we just cloned the message object so we got the full member object
                // {...memberWithUser}
                const member = new Member(this.client, raw);
                this._mentions.set(member.id, member);
              } else if (raw.member) {
                // member object exists in the mention (is from a guild message create)
                // {member: {memberWithoutUser}, ...user}
                raw.member.guild_id = guildId;

                let member: Member;
                if (this.isClone) {
                  member = new Member(this.client, raw.member, this.isClone);
                  member.merge({user: raw});
                } else {
                  if (this.client.members.has(guildId, raw.id)) {
                    member = this.client.members.get(guildId, raw.id)!;
                    // should we merge?
                  } else {
                    member = new Member(this.client, raw.member);
                    member.merge({user: raw});
                    this.client.members.insert(member);
                  }
                }
                this._mentions.set(member.id, member);
              } else {
                // {...user}
                // check our member cache and try to fill the member object (could've gotten the message object from rest)
                if (this.isClone) {
                  if (guildId && this.client.members.has(guildId, raw.id)) {
                    const member = this.client.members.get(guildId, raw.id)!.clone();
                    member.merge({user: raw});
                    this._mentions.set(member.id, member);
                  } else {
                    const user = new User(this.client, raw, this.isClone);
                    this._mentions.set(user.id, user);
                  }
                } else {
                  // try and get object from cache and update it
                  if (guildId && this.client.members.has(guildId, raw.id)) {
                    const member = this.client.members.get(guildId, raw.id)!;
                    member.merge({user: raw});
                    this._mentions.set(member.id, member);
                  } else {
                    let user: User;
                    if (this.client.users.has(raw.id)) {
                      user = this.client.users.get(raw.id)!;
                      user.merge(raw);
                    } else {
                      user = new User(this.client, raw);
                      this.client.users.insert(user);
                    }
                    this._mentions.set(user.id, user);
                  }
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
              if (this.isClone) {
                channel = createChannelFromData(this.client, raw, this.isClone);
              } else {
                if (this.client.channels.has(raw.id)) {
                  channel = this.client.channels.get(raw.id)!;
                  channel.merge(raw);
                } else {
                  raw.is_partial = true;
                  channel = createChannelFromData(this.client, raw);
                }
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
        case DiscordKeys.REFERENCED_MESSAGE: {
          if (value) {
            let message: Message;
            if (this.isClone) {
              message = new Message(this.client, value, this.isClone);
            } else {
              if (this.client.messages.has(value.id)) {
                message = this.client.messages.get(value.id)!;
                message.merge(value);
              } else {
                message = new Message(this.client, value);
              }
            }
            value = message;
          }
        }; break;
        case DiscordKeys.STICKERS: {
          if (value.length) {
            if (!this._stickers) {
              this._stickers = new BaseCollection<string, Sticker>();
            }
            this._stickers.clear();
            for (let raw of value) {
              const sticker = new Sticker(this.client, raw);
              this.stickers.set(sticker.id, sticker);
            }
          } else {
            if (this._stickers) {
              this._stickers.clear();
              this._stickers = undefined;
            }
          }
        }; return;
        case DiscordKeys.TIMESTAMP: {
          this.timestampUnix = (new Date(value)).getTime();
        }; return;
        case DiscordKeys.THREAD: {
          value = createChannelFromData(this.client, value);
        }; break;
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
  readonly _uncloneable = true;
  readonly _keys = keysMessageActivity;
  readonly message: Message;

  coverImage: null | string = null;
  name: null | string = null;
  partyId: string = '';
  type: number = 0;

  constructor(message: Message, data: BaseStructureData) {
    super(message.client, undefined, message._clone);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  get activity(): null | PresenceActivity {
    const presence = this.message.author.presence;
    if (presence) {
      for (let [activityId, activity] of presence.activities) {
        if (activity.party && activity.party.id === this.partyId) {
          return activity;
        }
      }
    }
    return null;
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
  readonly _uncloneable = true;
  readonly _keys = keysMessageCall;
  readonly message: Message;

  endedTimestamp: Date | null = null;
  participants: Array<string> = [];

  constructor(message: Message, data: BaseStructureData) {
    super(message.client, undefined, message._clone);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  get duration(): number {
    if (this.endedTimestamp) {
      return Math.max(Date.now() - this.endedTimestamp.getTime(), 0);
    }
    return 0;
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


const keysMessageComponentActionRow = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.TYPE,
]);

/**
 * Channel Message Component Action Row Structure
 * @category Structure
 */
export class MessageComponentActionRow extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentActionRow;
  readonly message: Message;

  components = new BaseCollection<string, MessageComponent | MessageComponentSelectMenu>();
  type: MessageComponentTypes = MessageComponentTypes.ACTION_ROW;

  constructor(message: Message, data: BaseStructureData) {
    super(message.client, undefined, message._clone);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.COMPONENTS: {
          this.components.clear();
          for (let raw of value) {
            let component: MessageComponent | MessageComponentSelectMenu;
            switch (raw.type) {
              case MessageComponentTypes.SELECT_MENU: {
                component = new MessageComponentSelectMenu(this.message, raw);
              }; break;
              default: {
                component = new MessageComponent(this.message, raw);
              };
            }
            this.components.set(component.id, component);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysMessageComponent = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.DISABLED,
  DiscordKeys.EMOJI,
  DiscordKeys.LABEL,
  DiscordKeys.STYLE,
  DiscordKeys.TYPE,
  DiscordKeys.URL,
]);

/**
 * Channel Message Component Structure
 * @category Structure
 */
export class MessageComponent extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponent;
  readonly message: Message;

  customId?: string;
  disabled?: boolean;
  emoji?: Emoji;
  label?: string;
  style?: MessageComponentButtonStyles;
  type: MessageComponentTypes = MessageComponentTypes.BUTTON;
  url?: string;

  constructor(message: Message, data: BaseStructureData) {
    super(message.client, undefined, message._clone);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  get id(): string {
    return this.url || this.customId || '';
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.EMOJI: {
          if (this.emoji) {
            this.emoji.merge(value);
          } else {
            this.emoji = new Emoji(this.client, value);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysMessageComponentSelectMenu = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.MAX_VALUES,
  DiscordKeys.MIN_VALUES,
  DiscordKeys.OPTIONS,
  DiscordKeys.PLACEHOLDER,
  DiscordKeys.TYPE,
]);

/**
 * Channel Message Component Select Menu Structure
 * @category Structure
 */
export class MessageComponentSelectMenu extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentSelectMenu;
  readonly message: Message;

  customId: string = '';
  maxValues: number = 1;
  minValues: number = 1;
  options = new BaseCollection<string, MessageComponentSelectMenuOption>();
  placeholder: string = '';
  type: MessageComponentTypes.SELECT_MENU = MessageComponentTypes.SELECT_MENU;

  constructor(message: Message, data: BaseStructureData) {
    super(message.client, undefined, message._clone);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  get id(): string {
    return this.customId;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.OPTIONS: {
          this.options.clear();
          for (let raw of value) {
            const option = new MessageComponentSelectMenuOption(this.message, raw);
            this.options.set(option.value, option);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysMessageComponentSelectMenuOption = new BaseSet<string>([
  DiscordKeys.DEFAULT,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.EMOJI,
  DiscordKeys.LABEL,
  DiscordKeys.VALUE,
]);

/**
 * Channel Message Component Select Menu Structure
 * @category Structure
 */
export class MessageComponentSelectMenuOption extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentSelectMenuOption;
  readonly message: Message;

  default: boolean = false;
  description?: string;
  emoji?: Emoji;
  label: string = '';
  value: string = '';

  constructor(message: Message, data: BaseStructureData) {
    super(message.client, undefined, message._clone);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.EMOJI: {
          if (this.emoji) {
            this.emoji.merge(value);
          } else {
            this.emoji = new Emoji(this.client, value);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysMessageInteraction = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.TYPE,
  DiscordKeys.USER,
]);

/**
 * Channel Message Interaction Structure
 * @category Structure
 */
export class MessageInteraction extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageInteraction;
  readonly message: Message;

  id: string = '';
  name: string = '';
  type: InteractionTypes = InteractionTypes.PING;
  user!: User;

  constructor(message: Message, data: BaseStructureData) {
    super(message.client, undefined, message._clone);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false});
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.USER: {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = this.client.users.get(value.id)!;
            user.merge(value);
          } else {
            user = new User(this.client, value);
            this.client.users.insert(user);
          }
          value = user;
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
 * Channel Message Reference Structure, used to tell the client that this is from a server webhook or a reply
 * Used for crossposts
 * @category Structure
 */
export class MessageReference extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageReference;
  readonly parent: Message;

  channelId: string = '';
  guildId?: string = '';
  messageId?: string = '';

  constructor(message: Message, data: BaseStructureData) {
    super(message.client, undefined, message._clone);
    this.parent = message;
    this.merge(data);
    Object.defineProperty(this, 'parent', {enumerable: false});
  }

  get channel(): ChannelTextType | null {
    if (this.client.channels.has(this.channelId)) {
      return this.client.channels.get(this.channelId) as ChannelTextType;
    }
    return null;
  }

  get guild(): null | Guild {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get message(): null | Message {
    if (this.messageId) {
      return this.client.messages.get(this.messageId) || null;
    }
    return null;
  }
}


export function messageSystemContent(
  message: Message,
  text?: string,
): string {
  let content: string;
  if (text === undefined) {
    content = message.content;
  } else {
    content = text;
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
      if (message.call) {
        if (message.call.isEnded) {
          if (message.call.participants.includes(message.author.id)) {
            content = SystemMessages.CallStartedWithDuration;
          } else {
            content = SystemMessages.CallMissedWithDuration;
          }
          content = content.replace(/:duration:/g, String(message.call.duration));
        } else {
          if (!message.call.participants.includes(message.author.id)) {
            content = SystemMessages.CallMissed;
          }
        }
      }
      content = content.replace(/:user:/g, message.author.mention);
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
      content = (SystemMessages.GuildMemberJoin as any)[number].replace(/:user:/g, message.author.mention);
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
      content = content.replace(/:premiumTier:/g, (PremiumGuildTierNames as any)[premiumTier]);
    }; break;
    case MessageTypes.CHANNEL_FOLLOW_ADD: {
      content = SystemMessages.ChannelFollowAdd.replace(/:user:/g, message.author.mention);
      content = content.replace(/:webhookName:/g, message.content);
    }; break;
    case MessageTypes.GUILD_DISCOVERY_DISQUALIFIED: {
      content = SystemMessages.GuildDiscoveryDisqualified;
    }; break;
    case MessageTypes.GUILD_DISCOVERY_REQUALIFIED: {
      content = SystemMessages.GuildDiscoveryRequalified;
    }; break;
    case MessageTypes.GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING: {
      content = SystemMessages.GuildDiscoveryGracePeriodInitialWarning;
    }; break;
    case MessageTypes.GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING: {
      content = SystemMessages.GuildDiscoveryGracePeriodFinalWarning;
    }; break;
    case MessageTypes.APPLICATION_COMMAND: {
      content = SystemMessages.ApplicationCommandUsed.replace(/:user:/g, message.author.mention);
      if (message.application) {
        content = content.replace(/:application:/g, message.application.name);
      }
    }; break;
  }
  return content;
}
