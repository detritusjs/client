import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import {
  ShardClient,
  VoiceConnectOptions,
} from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, ChannelTypes, Permissions, DEFAULT_GROUP_DM_AVATARS } from '../constants';
import { VoiceConnection } from '../media/voiceconnection';
import {
  addQuery,
  getFormatFromHash,
  PermissionTools,
  Snowflake,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { Member } from './member';
import { Message } from './message';
import { Overwrite } from './overwrite';
import { Role } from './role';
import { Typing } from './typing';
import { User } from './user';
import { VoiceState } from './voicestate';


export type Channel = (
  ChannelBase |
  ChannelDM |
  ChannelGuildVoice |
  ChannelDMGroup |
  ChannelGuildBase |
  ChannelGuildCategory |
  ChannelGuildText |
  ChannelGuildStore
);

export function createChannelFromData(client: ShardClient, data: any): Channel {
  let Class = ChannelBase;
  switch (data.type) {
    case ChannelTypes.GUILD_TEXT: {
      Class = ChannelGuildText;
    }; break;
    case ChannelTypes.DM: {
      Class = ChannelDM;
    }; break;
    case ChannelTypes.GUILD_VOICE: {
      Class = ChannelGuildVoice;
    }; break;
    case ChannelTypes.GROUP_DM: {
      Class = ChannelDMGroup;
    }; break;
    case ChannelTypes.GUILD_CATEGORY: {
      Class = ChannelGuildCategory;
    }; break;
    case ChannelTypes.GUILD_NEWS: {
      Class = ChannelGuildText;
    }; break;
    case ChannelTypes.GUILD_STORE: {
      Class = ChannelGuildStore;
    }; break;
  }
  return new Class(client, data);
}


const keysChannelBase = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.TYPE,
]);

const keysMergeChannelBase = new BaseSet<string>();

/**
 * Basic Channel Structure
 * @category Structure
 */
export class ChannelBase extends BaseStructure {
  readonly _keys = keysChannelBase;
  readonly _keysMerge = keysMergeChannelBase;
  _nicks?: BaseCollection<string, string>;
  _permissionOverwrites?: BaseCollection<string, Overwrite>;
  _recipients?: BaseCollection<string, User>;

  applicationId?: string;
  bitrate: number = 0;
  deleted: boolean = false;
  guildId: string = '';
  id: string = '';
  icon?: null | string;
  isPartial: boolean = false;
  lastMessageId?: null | string;
  lastPinTimestampUnix: number = 0;
  name!: string;
  nsfw: boolean = false;
  parentId?: null | string;
  position: number = -1;
  rateLimitPerUser: number = 0;
  topic?: string;
  type: ChannelTypes = ChannelTypes.BASE;
  userLimit: number = 0;

  constructor(
    client: ShardClient,
    data: BaseStructureData,
    merge: boolean = true,
  ) {
    super(client);
    if (merge) {
      this.merge(data);
    }
  }

  get canAddReactions(): boolean {
    return this.canMessage;
  }

  get canAttachFiles(): boolean {
    return this.canMessage;
  }

  get canDeafenMembers(): boolean {
    return this.isGuildVoice;
  }

  get canEdit(): boolean {
    return this.isDm;
  }

  get canEmbedLinks(): boolean {
    return this.canMessage;
  }

  get canJoin(): boolean {
    if (this.isDm) {
      if (this.client.user && this.client.user.bot) {
        return false;
      }
      return true;
    }
    return this.isGuildVoice;
  }

  get canManageMessages(): boolean {
    return false;
  }

  get canManageWebhooks(): boolean {
    return false;
  }

  get canMentionEveryone(): boolean {
    return this.isText;
  }

  get canMessage(): boolean {
    return this.isText;
  }

  get canMoveMembers(): boolean {
    return this.isGuildVoice;
  }

  get canMuteMembers(): boolean {
    return this.isGuildVoice;
  }

  get canPrioritySpeaker(): boolean {
    return false;
  }

  get canSendTTSMessage(): boolean {
    return this.isText && !this.isDm;
  }

  get canSpeak(): boolean {
    if (this.isDm) {
      if (this.client.user && this.client.user.bot) {
        return false;
      }
      return true;
    }
    return this.isGuildVoice;
  }

  get canStream(): boolean {
    return this.isGuildVoice;
  }

  get canReadHistory(): boolean {
    return this.isText;
  }

  get canUseExternalEmojis(): boolean {
    return this.isDm;
  }

  get canUseVAD(): boolean {
    return this.isVoice;
  }

  get canView(): boolean {
    return this.isText;
  }

  get children(): BaseCollection<string, ChannelGuildBase> {
    return emptyBaseCollection;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get defaultIconUrl(): null | string {
    return null;
  }

  get guild(): Guild | null {
    return null;
  }

  get iconUrl(): null | string {
    return null;
  }

  get isDm(): boolean {
    return this.isDmSingle || this.isDmGroup;
  }

  get isDmGroup(): boolean {
    return this.type === ChannelTypes.GROUP_DM;
  }

  get isDmSingle(): boolean {
    return this.type === ChannelTypes.DM;
  }

  get isGuildCategory(): boolean {
    return this.type === ChannelTypes.GUILD_CATEGORY;
  }

  get isGuildChannel(): boolean {
    return (this.isGuildCategory) || 
      (this.isGuildText) ||
      (this.isGuildVoice) ||
      (this.isGuildNews) ||
      (this.isGuildStore) ||
      (this.isGuildLfgListings);
  }

  get isGuildLfgListings(): boolean {
    return this.type === ChannelTypes.GUILD_LFG_LISTINGS;
  }

  get isGuildNews(): boolean {
    return this.type === ChannelTypes.GUILD_NEWS;
  }

  get isGuildStore(): boolean {
    return this.type === ChannelTypes.GUILD_STORE;
  }

  get isGuildText(): boolean {
    return this.type === ChannelTypes.GUILD_TEXT;
  }

  get isGuildVoice(): boolean {
    return this.type === ChannelTypes.GUILD_VOICE;
  }

  get isManaged(): boolean {
    return !!this.applicationId;
  }

  get isSyncedWithParent(): boolean {
    return this.isSyncedWith(this.parent);
  }

  get isText(): boolean {
    return this.isDm || this.isGuildText || this.isGuildNews;
  }

  get isVoice(): boolean {
    return this.isDm || this.isGuildVoice;
  }

  get joined(): boolean {
    return false;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.CHANNEL(null, this.id);
  }

  get lastPinTimestamp(): Date | null {
    if (this.lastPinTimestampUnix) {
      return new Date(this.lastPinTimestampUnix);
    }
    return null;
  }

  get members(): BaseCollection<string, Member> {
    return emptyBaseCollection;
  }

  get messages(): BaseCollection<string, Message> {
    return emptyBaseCollection;
  }

  get mention(): string {
    return `<#${this.id}>`;
  }

  get nicks(): BaseCollection<string, string> {
    if (this._nicks) {
      return this._nicks;
    }
    return emptyBaseCollection;
  }

  get owner(): User | null {
    return null;
  }

  get parent(): ChannelGuildCategory | null {
    return null;
  }

  get permissionOverwrites(): BaseCollection<string, Overwrite> {
    if (this._permissionOverwrites) {
      return this._permissionOverwrites;
    }
    return emptyBaseCollection;
  }

  get recipients(): BaseCollection<string, User> {
    if (this._recipients) {
      return this._recipients;
    }
    return emptyBaseCollection;
  }

  get typing(): BaseCollection<string, Typing> {
    if (this.client.typings.has(this.id)) {
      return <BaseCollection<string, Typing>> this.client.typings.get(this.id);
    }
    return emptyBaseCollection;
  }

  get voiceStates(): BaseCollection<string, VoiceState> {
    return emptyBaseCollection;
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    memberOrRole?: Member | Role,
  ): boolean {
    return false;
  }

  iconUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    return null;
  }

  isSyncedWith(parent: ChannelGuildCategory | null): boolean {
    return false;
  }

  async addPinnedMessage(messageId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async addRecipient(userId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async bulkDelete(messageIds: Array<string>): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async close(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async createInvite(options: RequestTypes.CreateChannelInvite) {
    return this.client.rest.createChannelInvite(this.id, options);
  }

  async createMessage(options: RequestTypes.CreateMessage | string = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async createReaction(messageId: string, emoji: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async createWebhook(options: RequestTypes.CreateWebhook): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async delete(options: RequestTypes.DeleteChannel = {}) {
    return this.client.rest.deleteChannel(this.id, options);
  }

  async deleteMessage(messageId: string, options: RequestTypes.DeleteMessage = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async deleteOverwrite(overwriteId: string, options: RequestTypes.DeleteChannelOverwrite = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async deletePin(messageId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async deleteReaction(messageId: string, emoji: string, userId: string = '@me'): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async deleteReactions(messageId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  edit(options: RequestTypes.EditChannel = {}): Promise<any> {
    return this.client.rest.editChannel(this.id, options);
  }

  async editMessage(messageId: string, options: RequestTypes.EditMessage = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async editOverwrite(overwriteId: string, options: RequestTypes.EditChannelOverwrite = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchCallStatus(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchInvites() {
    return this.client.rest.fetchChannelInvites(this.id);
  }

  async fetchMessage(messageId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchMessages(options: RequestTypes.FetchMessages = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchPins(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchReactions(messageId: string, emoji: string, options: RequestTypes.FetchReactions = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchStoreListing(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchWebhooks(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async grantEntitlement(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async join(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async publish(options: RequestTypes.CreateApplicationNews): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async removeRecipient(userId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async search(options: RequestTypes.SearchOptions, retry?: boolean): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async startCallRinging(recipients?: Array<string>): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async stopCallRinging(recipients?: Array<string>): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async triggerTyping(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async turnIntoNewsChannel(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async turnIntoTextChannel(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async unack(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  toString(): string {
    return `#${this.name}`;
  }
}


export interface CallOptions extends VoiceConnectOptions {
  recipients?: Array<string>,
  verify?: boolean,
}

const keysChannelDm = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.LAST_MESSAGE_ID,
  DiscordKeys.LAST_PIN_TIMESTAMP,
  DiscordKeys.NICKS,
  DiscordKeys.RECIPIENTS,
  DiscordKeys.TYPE,
]);

/**
 * Single DM Channel
 * @category Structure
 */
export class ChannelDM extends ChannelBase {
  readonly _keys = keysChannelDm;
  _name: string = '';

  lastMessageId?: null | string;

  constructor(
    client: ShardClient,
    data: BaseStructureData,
    merge: boolean = true,
  ) {
    super(client, data, false);
    if (merge) {
      this.merge(data);
    }
  }

  get iconUrl(): null | string {
    return this.iconUrlFormat();
  }

  get joined(): boolean {
    return this.client.voiceConnections.has(this.id);
  }

  get messages(): BaseCollection<string, Message> {
    const collection = new BaseCollection<string, Message>();
    for (let [messageId, message] of this.client.messages) {
      if (message.channelId === this.id) {
        collection.set(messageId, message);
      }
    }
    return collection;
  }

  get name(): string {
    if (!this._name) {
      return this.recipients.join(', ') || 'DM Channel';
    }
    return this._name;
  }

  get voiceStates(): BaseCollection<string, VoiceState> {
    if (this.client.voiceStates.has(this.id)) {
      return <BaseCollection<string, VoiceState>> this.client.voiceStates.get(this.id);
    }
    return emptyBaseCollection;
  }

  iconUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (this.recipients.size) {
      const user = <User> this.recipients.first();
      return user.avatarUrlFormat(format, query);
    }
    return null;
  }

  async addPinnedMessage(messageId: string) {
    return this.client.rest.addPinnedMessage(this.id, messageId);
  }

  async bulkDelete(messageIds: Array<string>) {
    return this.client.rest.bulkDeleteMessages(this.id, messageIds);
  }

  async close() {
    return this.delete();
  }

  async createMessage(options: RequestTypes.CreateMessage | string = {}) {
    return this.client.rest.createMessage(this.id, options);
  }

  async createReaction(messageId: string, emoji: string) {
    return this.client.rest.createReaction(this.id, messageId, emoji);
  }

  async deleteMessage(messageId: string, options: RequestTypes.DeleteMessage = {}) {
    return this.client.rest.deleteMessage(this.id, messageId, options);
  }

  async deletePin(messageId: string) {
    return this.client.rest.deletePinnedMessage(this.id, messageId);
  }

  async deleteReaction(messageId: string, emoji: string, userId: string = '@me') {
    return this.client.rest.deleteReaction(this.id, messageId, userId);
  }

  async deleteReactions(messageId: string) {
    return this.client.rest.deleteReactions(this.id, messageId);
  }

  async editMessage(messageId: string, options: RequestTypes.EditMessage = {}) {
    return this.client.rest.editMessage(this.id, messageId, options);
  }

  async fetchCallStatus() {
    return this.client.rest.fetchChannelCall(this.id);
  }

  async fetchMessage(messageId: string) {
    return this.client.rest.fetchMessage(this.id, messageId);
  }

  async fetchMessages(options: RequestTypes.FetchMessages) {
    return this.client.rest.fetchMessages(this.id, options);
  }

  async fetchPins() {
    return this.client.rest.fetchPinnedMessages(this.id);
  }

  async fetchReactions(messageId: string, emoji: string, options: RequestTypes.FetchReactions = {}) {
    return this.client.rest.fetchReactions(this.id, messageId, emoji, options);
  }

  async join(options: CallOptions) {
    if (options.verify || options.verify === undefined) {
      await this.fetchCallStatus();
    }
    if (options.recipients) {
      await this.startCallRinging(options.recipients);
    }
    return this.client.voiceConnect(undefined, this.id, options);
  }

  async search(options: RequestTypes.SearchOptions, retry?: boolean) {
    return this.client.rest.searchChannel(this.id, options, retry);
  }

  async startCallRinging(recipients?: Array<string>) {
    return this.client.rest.startChannelCallRinging(this.id, {recipients});
  }

  async stopCallRinging(recipients?: Array<string>) {
    return this.client.rest.stopChannelCallRinging(this.id, {recipients});
  }

  async triggerTyping() {
    return this.client.rest.triggerTyping(this.id);
  }

  async unack() {
    return this.client.rest.unAckChannel(this.id);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.LAST_PIN_TIMESTAMP: {
          this.lastPinTimestampUnix = (value) ? (new Date(value).getTime()) : 0;
        }; return;
        case DiscordKeys.NAME: {
          this._name = value;
        }; return;
        case DiscordKeys.NICKS: {
          if (Object.keys(value).length) {
            if (!this._nicks) {
              this._nicks = new BaseCollection<string, string>();
            }
            this._nicks.clear();
            for (let userId in value) {
              this._nicks.set(userId, value[userId]);
            }
          } else {
            if (this._nicks) {
              this._nicks.clear();
              this._nicks = undefined;
            }
          }
        }; return;
        case DiscordKeys.RECIPIENTS: {
          if (value.length) {
            if (!this._recipients) {
              this._recipients = new BaseCollection<string, User>();
            }
            this._recipients.clear();
            if (this.client.user) {
              this._recipients.set(this.client.user.id, this.client.user);
            }

            for (let raw of value) {
              let user: User;
              if (this.client.users.has(raw.id)) {
                user = <User> this.client.users.get(raw.id);
                user.merge(raw);
              } else {
                user = new User(this.client, raw);
                this.client.users.insert(user);
              }
              this._recipients.set(user.id, user);

              // unsure of this
              if (DiscordKeys.NICK in raw) {
                if (!this._nicks) {
                  this._nicks = new BaseCollection<string, string>();
                }
                this._nicks.set(user.id, raw.nick);
              }
            }
          } else {
            if (this._recipients) {
              this._recipients.clear();
              this._recipients = undefined;
            }
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysChannelDmGroup = new BaseSet<string>([
  ...keysChannelDm,
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.ICON,
  DiscordKeys.NAME,
  DiscordKeys.OWNER_ID,
]);

/**
 * Group DM Channel
 * @category Structure
 */
export class ChannelDMGroup extends ChannelDM {
  readonly _keys = keysChannelDmGroup;

  applicationId?: string;
  icon: null | string = null;
  ownerId: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client, data, false);
    this.merge(data);
  }

  get defaultIconUrl(): string {
    const hash = DEFAULT_GROUP_DM_AVATARS[this.createdAtUnix % DEFAULT_GROUP_DM_AVATARS.length];
    return Endpoints.Assets.URL + Endpoints.Assets.ICON(hash);
  }

  get owner(): User | null {
    if (this._recipients && this._recipients.has(this.ownerId)) {
      return this._recipients.get(this.ownerId) || null;
    }
    return this.client.users.get(this.ownerId) || null;
  }

  iconUrlFormat(format?: null | string, query?: UrlQuery): string {
    if (!this.icon) {
      return this.defaultIconUrl;
    }
    const hash = this.icon;
    format = getFormatFromHash(
      hash,
      format,
      this.client.imageFormat,
    );
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.DM_ICON(this.id, hash, format),
      query,
    );
  }

  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  async addRecipient(userId: string) {
    return this.client.rest.addRecipient(this.id, userId);
  }

  async removeRecipient(userId: string) {
    return this.client.rest.removeRecipient(this.id, userId);
  }
}


const keysChannelGuildBase = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.NAME,
  DiscordKeys.NSFW,
  DiscordKeys.PARENT_ID,
  DiscordKeys.PERMISSION_OVERWRITES,
  DiscordKeys.POSITION,
  DiscordKeys.RATE_LIMIT_PER_USER,
  DiscordKeys.TYPE,
]);

const keysMergeChannelGuildBase = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
]);

/**
 * Basic Guild Channel
 * @category Structure
 */
export class ChannelGuildBase extends ChannelBase {
  readonly _keys = keysChannelGuildBase;
  readonly _keysMerge = keysMergeChannelGuildBase;

  guildId: string = '';
  nsfw: boolean = false;
  parentId?: null | string;
  position: number = -1;
  rateLimitPerUser: number = 0;

  constructor(
    client: ShardClient,
    data: BaseStructureData,
    merge: boolean = true,
  ) {
    super(client, data, false);
    if (merge) {
      this.merge(data);
    }
  }

  get canAddReactions(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
      Permissions.ADD_REACTIONS,
    ]);
  }

  get canAttachFiles(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
      Permissions.ATTACH_FILES,
    ]);
  }

  get canDeafenMembers(): boolean {
    return this.isVoice && this.can([
      Permissions.DEAFEN_MEMBERS,
    ]);
  }

  get canEdit(): boolean {
    return this.can([
      Permissions.MANAGE_CHANNELS,
    ]);
  }

  get canEmbedLinks(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
      Permissions.EMBED_LINKS,
    ]);
  }

  get canJoin(): boolean {
    return this.isVoice && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.CONNECT,
    ]);
  }

  get canManageMessages(): boolean {
    return this.isText && this.can([
      Permissions.MANAGE_MESSAGES,
    ]);
  }

  get canManageWebhooks(): boolean {
    return this.isText && this.can([
      Permissions.MANAGE_WEBHOOKS,
    ]);
  }

  get canMentionEveryone(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
      Permissions.MENTION_EVERYONE,
    ]);
  }

  get canMessage(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
    ]);
  }

  get canMoveMembers(): boolean {
    return this.isVoice && this.can([
      Permissions.MOVE_MEMBERS,
    ]);
  }

  get canMuteMembers(): boolean {
    return this.isVoice && this.can([
      Permissions.MUTE_MEMBERS,
    ]);
  }

  get canPrioritySpeaker(): boolean {
    return this.isVoice && this.can([
      Permissions.PRIORITY_SPEAKER,
    ]);
  }

  get canSendTTSMessage(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
      Permissions.SEND_TTS_MESSAGES,
    ]);
  }

  get canSpeak(): boolean {
    return this.isVoice && this.can([
      Permissions.SPEAK,
    ]);
  }

  get canStream(): boolean {
    return this.isVoice && this.can([
      Permissions.STREAM,
    ]);
  }

  get canReadHistory(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.READ_MESSAGE_HISTORY,
    ]);
  }

  get canUseExternalEmojis(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
      Permissions.USE_EXTERNAL_EMOJIS,
    ]);
  }

  get canUseVAD(): boolean {
    return this.isVoice && this.can([
      Permissions.USE_VAD,
    ]);
  }

  get canView(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
    ]);
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.CHANNEL(this.guildId, this.id);
  }

  get parent(): ChannelGuildCategory | null {
    if (this.parentId && this.client.channels.has(this.parentId)) {
      return <ChannelGuildCategory> this.client.channels.get(this.parentId);
    }
    return null;
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    memberOrRole?: Member | Role,
    {ignoreAdministrator, ignoreOwner}: {ignoreAdministrator?: boolean, ignoreOwner?: boolean} = {},
  ): boolean {
    let total = Permissions.NONE;
    if (memberOrRole instanceof Role) {
      total = memberOrRole.permissions;
      if (!ignoreAdministrator) {
        if (PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
          return true;
        }
      }
    } else {
      if (!memberOrRole) {
        if (!this.client.user) {
          return false;
        }
        if (!this.client.members.has(this.guildId, this.client.user.id)) {
          return false;
        }
        memberOrRole = <Member> this.client.members.get(this.guildId, this.client.user.id);
      }
  
      if (!ignoreOwner) {
        const guild = this.guild;
        if (guild && guild.isOwner(memberOrRole.id)) {
          return true;
        }
      }

      if (!ignoreAdministrator) {
        if (PermissionTools.checkPermissions(memberOrRole.permissions, Permissions.ADMINISTRATOR)) {
          return true;
        }
      }
      total = memberOrRole.permissionsIn(this);
    }

    return PermissionTools.checkPermissions(total, permissions);
  }

  isSyncedWith(parent: ChannelGuildCategory | null): boolean {
    if (parent) {
      const overwrites = this.permissionOverwrites;
      const parentOverwrites = parent.permissionOverwrites;
      if (overwrites.length !== parentOverwrites.length) {
        return false;
      }
      return overwrites.every((overwrite) => {
        if (parentOverwrites.has(overwrite.id)) {
          const parentOverwrite = <Overwrite> parentOverwrites.get(overwrite.id);
          return overwrite.allow === parentOverwrite.allow && overwrite.deny === parentOverwrite.deny;
        }
        return false;
      });
    }
    return false;
  }

  async deleteOverwrite(overwriteId: string, options: RequestTypes.DeleteChannelOverwrite = {}) {
    return this.client.rest.deleteChannelOverwrite(this.id, overwriteId, options);
  }

  async editOverwrite(overwriteId: string, options: RequestTypes.EditChannelOverwrite = {}) {
    return this.client.rest.editChannelOverwrite(this.id, overwriteId, options);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.PERMISSION_OVERWRITES: {
          if (value.length) {
            if (!this._permissionOverwrites) {
              this._permissionOverwrites = new BaseCollection<string, Overwrite>();
            }

            const overwrites: Array<Overwrite> = [];
            for (let raw of value) {
              let overwrite: Overwrite;
              if (this._permissionOverwrites.has(raw.id)) {
                overwrite = <Overwrite> this._permissionOverwrites.get(raw.id);
                overwrite.merge(raw);
              } else {
                overwrite = new Overwrite(this, raw);
              }
              overwrites.push(overwrite);
            }

            this._permissionOverwrites.clear();
            for (let overwrite of overwrites) {
              this._permissionOverwrites.set(overwrite.id, overwrite);
            }
          } else {
            if (this._permissionOverwrites) {
              this._permissionOverwrites.clear();
              this._permissionOverwrites = undefined;
            }
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysChannelGuildCategory = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.BITRATE,
  DiscordKeys.USER_LIMIT,
]);

/**
 * Guild Category Channel
 * @category Structure
 */
export class ChannelGuildCategory extends ChannelGuildBase {
  readonly _keys = keysChannelGuildCategory;

  bitrate: number = 0;
  userLimit: number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client, data, false);
    this.merge(data);
  }

  get children(): BaseCollection<string, Channel> {
    const collection = new BaseCollection<string, Channel>();
    for (let [channelId, channel] of this.client.channels) {
      if (channel.isGuildChannel && channel.parentId === this.id) {
        collection.set(channelId, channel);
      }
    }
    return collection;
  }
}


const keysChannelGuildText = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.LAST_MESSAGE_ID,
  DiscordKeys.LAST_PIN_TIMESTAMP,
  DiscordKeys.TOPIC,
]);

/**
 * Guild Text Channel, it can also be a news channel.
 * Not sure about the upcoming LFG group, it might not extend this
 * @category Structure
 */
export class ChannelGuildText extends ChannelGuildBase {
  readonly _keys = keysChannelGuildText;

  lastMessageId?: null | string;
  topic?: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client, data, false);
    this.merge(data);
  }

  get members(): BaseCollection<string, Member> {
    const collection = new BaseCollection<string, Member>();

    const guild = this.guild;
    if (guild) {
      for (let [userId, member] of guild.members) {
        if (this.can(Permissions.VIEW_CHANNEL, member)) {
          collection.set(userId, member);
        }
      }
    }

    return collection;
  }

  get messages(): BaseCollection<string, Message> {
    const collection = new BaseCollection<string, Message>();
    for (let [messageId, message] of this.client.messages) {
      if (message.channelId === this.id) {
        collection.set(messageId, message);
      }
    }
    return collection;
  }

  async addPinnedMessage(messageId: string) {
    return this.client.rest.addPinnedMessage(this.id, messageId);
  }

  async bulkDelete(messageIds: Array<string>) {
    return this.client.rest.bulkDeleteMessages(this.id, messageIds);
  }

  async createMessage(options: RequestTypes.CreateMessage | string = {}) {
    return this.client.rest.createMessage(this.id, options);
  }

  async createReaction(messageId: string, emoji: string) {
    return this.client.rest.createReaction(this.id, messageId, emoji);
  }

  async createWebhook(options: RequestTypes.CreateWebhook) {
    return this.client.rest.createWebhook(this.id, options);
  }

  async deleteMessage(messageId: string, options: RequestTypes.DeleteMessage = {}) {
    return this.client.rest.deleteMessage(this.id, messageId, options);
  }

  async deletePin(messageId: string) {
    return this.client.rest.deletePinnedMessage(this.id, messageId);
  }

  async deleteReaction(messageId: string, emoji: string, userId: string = '@me') {
    return this.client.rest.deleteReaction(this.id, messageId, userId);
  }

  async deleteReactions(messageId: string) {
    return this.client.rest.deleteReactions(this.id, messageId);
  }

  async editMessage(messageId: string, options: RequestTypes.EditMessage = {}) {
    return this.client.rest.editMessage(this.id, messageId, options);
  }

  async fetchMessage(messageId: string) {
    return this.client.rest.fetchMessage(this.id, messageId);
  }

  async fetchMessages(options: RequestTypes.FetchMessages) {
    return this.client.rest.fetchMessages(this.id, options);
  }

  async fetchPins() {
    return this.client.rest.fetchPinnedMessages(this.id);
  }

  async fetchReactions(messageId: string, emoji: string, options: RequestTypes.FetchReactions = {}) {
    return this.client.rest.fetchReactions(this.id, messageId, emoji, options);
  }

  async fetchWebhooks() {
    return this.client.rest.fetchChannelWebhooks(this.id);
  }

  async publish(options: RequestTypes.CreateApplicationNews) {
    options.channelId = this.id;
    return this.client.rest.createApplicationNews(options);
  }

  async search(options: RequestTypes.SearchOptions, retry?: boolean) {
    return this.client.rest.searchChannel(this.id, options, retry);
  }

  async triggerTyping() {
    return this.client.rest.triggerTyping(this.id);
  }

  async turnIntoNewsChannel() {
    return this.edit({
      type: ChannelTypes.GUILD_NEWS,
    });
  }

  async turnIntoTextChannel() {
    return this.edit({
      type: ChannelTypes.GUILD_TEXT,
    });
  }

  async unack() {
    return this.client.rest.unAckChannel(this.id);
  }

  mergeValue(key: string, value: any) {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.LAST_PIN_TIMESTAMP: {
          this.lastPinTimestampUnix = (value) ? (new Date(value).getTime()) : 0;
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysChannelGuildVoice = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.BITRATE,
  DiscordKeys.USER_LIMIT,
]);

/**
 * Guild Voice Channel
 * @category Structure
 */
export class ChannelGuildVoice extends ChannelGuildBase {
  readonly _keys = keysChannelGuildVoice;

  bitrate: number = 64000;
  userLimit: number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client, data, false);
    this.merge(data);
  }

  get joined(): boolean {
    if (this.client.voiceConnections.has(this.guildId)) {
      const voiceConnection = <VoiceConnection> this.client.voiceConnections.get(this.guildId);
      return voiceConnection.guildId === this.id;
    }
    return false;
  }

  get members(): BaseCollection<string, Member> {
    const collection = new BaseCollection<string, Member>();
    const voiceStates = this.voiceStates;
    if (voiceStates) {
      for (let [cacheId, voiceState] of voiceStates) {
        collection.set(voiceState.userId, voiceState.member);
      }
    }
    return collection;
  }

  get voiceStates(): BaseCollection<string, VoiceState> {
    const collection = new BaseCollection<string, VoiceState>();

    const voiceStates = this.client.voiceStates.get(this.guildId);
    if (voiceStates) {
      for (let [userId, voiceState] of voiceStates) {
        if (voiceState.channelId === this.id) {
          collection.set(userId, voiceState);
        }
      }
    }

    return collection;
  }

  join(options: VoiceConnectOptions) {
    return this.client.voiceConnect(this.guildId, this.id, options);
  }
}


const keysChannelGuildStore = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.BITRATE,
  DiscordKeys.USER_LIMIT,
]);

/**
 * Guild Store Channel
 * @category Structure
 */
export class ChannelGuildStore extends ChannelGuildBase {
  readonly _keys = keysChannelGuildStore;

  bitrate: number = 0;
  userLimit: number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client, data, false);
    this.merge(data);
  }

  async fetchStoreListing() {
    return this.client.rest.fetchChannelStoreListing(this.id);
  }

  async grantEntitlement() {
    return this.client.rest.createChannelStoreListingGrantEntitlement(this.id);
  }
}
