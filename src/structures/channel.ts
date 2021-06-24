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
import { DiscordKeys, ChannelTypes, ChannelVideoQualityModes, Permissions, DEFAULT_GROUP_DM_AVATARS } from '../constants';
import {
  addQuery,
  getFormatFromHash,
  PartialBy,
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
import { StageInstance } from './stageinstance';
import { ThreadMember, ThreadMetadata } from './thread';
import { Typing } from './typing';
import { User } from './user';
import { VoiceState } from './voicestate';


export type Channel = (
  ChannelBase |
  ChannelDM |
  ChannelGuildVoice |
  ChannelDMGroup |
  ChannelGuildType
);

export type ChannelGuildType = (
  ChannelGuildBase |
  ChannelGuildCategory |
  ChannelGuildText |
  ChannelGuildStore |
  ChannelGuildThread |
  ChannelGuildStageVoice
);

export type ChannelTextType = (
  ChannelDM |
  ChannelDMGroup |
  ChannelGuildText |
  ChannelGuildThread
);

export function createChannelFromData(
  client: ShardClient,
  data?: BaseStructureData,
  isClone?: boolean,
): Channel {
  let Class = ChannelBase;
  if (data) {
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
      case ChannelTypes.GUILD_NEWS_THREAD:
      case ChannelTypes.GUILD_PUBLIC_THREAD:
      case ChannelTypes.GUILD_PRIVATE_THREAD: {
        Class = ChannelGuildThread;
      }; break;
      case ChannelTypes.GUILD_STAGE_VOICE: {
        Class = ChannelGuildStageVoice;
      }; break;
    }
  }
  return new Class(client, data, isClone);
}


const keysChannelBase = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.NAME,
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
  _name: string = '';
  _nicks?: BaseCollection<string, string>;
  _nsfw?: boolean;
  _permissionOverwrites?: BaseCollection<string, Overwrite>;
  _recipients?: BaseCollection<string, User>;

  applicationId?: string;
  bitrate?: number;
  deleted: boolean = false;
  guildId?: string;
  id: string = '';
  icon?: null | string;
  isPartial: boolean = false;
  lastMessageId?: null | string;
  lastPinTimestampUnix?: number;
  member?: ThreadMember;
  memberCount?: number;
  messageCount?: number;
  ownerId?: string;
  parentId?: null | string;
  position?: number;
  rateLimitPerUser?: number;
  rtcRegion?: null | string;
  threadMetadata?: ThreadMetadata;
  topic: null | string = null;
  type: ChannelTypes = ChannelTypes.BASE;
  userLimit?: number;
  videoQualityMode?: ChannelVideoQualityModes;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get canAddReactions(): boolean {
    return this.canMessage;
  }

  get canAttachFiles(): boolean {
    return this.canMessage;
  }

  get canDeafenMembers(): boolean {
    return this.isGuildStageVoice || this.isGuildVoice;
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
    return this.isGuildStageVoice || this.isGuildVoice;
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

  get canManageThreads(): boolean {
    return false;
  }

  get canMoveMembers(): boolean {
    return this.isGuildStageVoice || this.isGuildVoice;
  }

  get canMuteMembers(): boolean {
    return this.isGuildStageVoice || this.isGuildVoice;
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
    return this.isGuildStageVoice || this.isGuildVoice;
  }

  get canStream(): boolean {
    return this.isGuildStageVoice || this.isGuildVoice;
  }

  get canReadHistory(): boolean {
    return this.isText;
  }

  get canUseExternalEmojis(): boolean {
    return this.isDm;
  }

  get canUsePrivateThreads(): boolean {
    return false;
  }

  get canUsePublicThreads(): boolean {
    return false;
  }

  get canUseVAD(): boolean {
    return this.isVoice;
  }

  get canView(): boolean {
    return this.isText;
  }

  get children(): BaseCollection<string, ChannelGuildType> {
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
      (this.isGuildThreadNews) ||
      (this.isGuildThreadPrivate) ||
      (this.isGuildThreadPublic) ||
      (this.isGuildStageVoice);
  }

  get isGuildNews(): boolean {
    return this.type === ChannelTypes.GUILD_NEWS;
  }

  get isGuildStageVoice(): boolean {
    return this.type === ChannelTypes.GUILD_STAGE_VOICE;
  }

  get isGuildStore(): boolean {
    return this.type === ChannelTypes.GUILD_STORE;
  }

  get isGuildText(): boolean {
    return this.type === ChannelTypes.GUILD_TEXT;
  }

  get isGuildThread(): boolean {
    return this.isGuildThreadNews || this.isGuildThreadPrivate || this.isGuildThreadPublic;
  }

  get isGuildThreadNews(): boolean {
    return this.type === ChannelTypes.GUILD_NEWS_THREAD;
  }

  get isGuildThreadPrivate(): boolean {
    return this.type === ChannelTypes.GUILD_PRIVATE_THREAD;
  }

  get isGuildThreadPublic(): boolean {
    return this.type === ChannelTypes.GUILD_PUBLIC_THREAD;
  }

  get isGuildVoice(): boolean {
    return this.type === ChannelTypes.GUILD_VOICE;
  }

  get isLive(): boolean {
    return !!this.stageInstance;
  }

  get isManaged(): boolean {
    return !!this.applicationId;
  }

  get isSyncedWithParent(): boolean {
    return this.isSyncedWith(this.parent);
  }

  get isText(): boolean {
    return this.isDm || this.isGuildText || this.isGuildNews || this.isGuildThread;
  }

  get isVoice(): boolean {
    return this.isDm || this.isGuildVoice || this.isGuildStageVoice;
  }

  get joined(): boolean {
    return false;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.CHANNEL(null, this.id);
  }

  get lastMessage(): Message | null {
    if (this.lastMessageId) {
      return this.client.messages.get(this.lastMessageId) || null;
    }
    return null;
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

  get name(): string {
    return this._name;
  }

  get nicks(): BaseCollection<string, string> {
    if (this._nicks) {
      return this._nicks;
    }
    return emptyBaseCollection;
  }

  get nsfw(): boolean {
    return !!this._nsfw;
  }

  get owner(): User | null {
    if (this.ownerId) {
      return this.client.users.get(this.ownerId) || null;
    }
    return null;
  }

  get parent(): ChannelGuildCategory | ChannelGuildText | null {
    if (this.parentId && this.client.channels.has(this.parentId)) {
      return this.client.channels.get(this.parentId) as ChannelGuildCategory | ChannelGuildText;
    }
    return null;
  }

  get permissionOverwrites(): BaseCollection<string, Overwrite> {
    if (this._permissionOverwrites) {
      return this._permissionOverwrites;
    }
    return emptyBaseCollection;
  }

  get stageInstance(): StageInstance | null {
    if (this.isGuildStageVoice) {
      const guild = this.guild;
      if (guild) {
        for (let [stageId, stage] of guild.stageInstances) {
          if (stage.channelId === this.id) {
            return stage;
          }
        }
      }
    }
    return null;
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

  async addMember(userId: string): Promise<any> {
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

  async createStageInstance(options: PartialBy<RequestTypes.CreateStageInstance, 'channelId'>): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async createThread(options: RequestTypes.CreateChannelThread): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async createWebhook(options: RequestTypes.CreateWebhook): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async crosspostMessage(messageId: string): Promise<any> {
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

  async deleteStageInstance(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  edit(options: RequestTypes.EditChannel = {}) {
    return this.client.rest.editChannel(this.id, options);
  }

  async editMessage(messageId: string, options: RequestTypes.EditMessage = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async editOverwrite(overwriteId: string, options: RequestTypes.EditChannelOverwrite = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async editStageInstance(options: RequestTypes.EditStageInstance = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchCallStatus(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchInvites() {
    return this.client.rest.fetchChannelInvites(this.id);
  }

  async fetchMembers(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
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

  async fetchStageInstance(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchStoreListing(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchThreadsActive(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchThreadsArchivedPrivate(options: RequestTypes.FetchChannelThreadsArchivedPrivate = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchThreadsArchivedPrivateJoined(options: RequestTypes.FetchChannelThreadsArchivedPrivateJoined = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchThreadsArchivedPublic(options: RequestTypes.FetchChannelThreadsArchivedPublic = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchWebhooks(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async follow(options: RequestTypes.FollowChannel): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async grantEntitlement(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async join(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async leave(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async publish(options: RequestTypes.CreateApplicationNews): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async removeMember(userId: string): Promise<any> {
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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.NAME: {
          this._name = value;
        }; return;
        case DiscordKeys.NSFW: {
          this._nsfw = value;
        }; return;
      }
    }
    return super.mergeValue(key, value);
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
  type = ChannelTypes.DM;

  declare lastMessageId?: null | string;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
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
      return this.client.voiceStates.get(this.id)!;
    }
    return emptyBaseCollection;
  }

  iconUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (this.recipients.size) {
      const user = this.recipients.first()!;
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
              if (this.isClone) {
                user = new User(this.client, raw, true);
              } else {
                if (this.client.users.has(raw.id)) {
                  user = this.client.users.get(raw.id)!;
                  user.merge(raw);
                } else {
                  user = new User(this.client, raw);
                  this.client.users.insert(user);
                }
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
  type = ChannelTypes.GROUP_DM;

  declare applicationId?: string;
  icon: null | string = null;
  ownerId: string = '';

  constructor(client: ShardClient, data?: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
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
    return super.owner;
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
  type = ChannelTypes.BASE;

  guildId: string = '';
  parentId: null | string = null;
  position: number = -1;
  rateLimitPerUser: number = 0;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
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

  get canManageThreads(): boolean {
    return this.isText && this.can([
      Permissions.MANAGE_THREADS,
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

  get canUsePrivateThreads(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.USE_PRIVATE_THREADS,
    ]);
  }

  get canUsePublicThreads(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.USE_PUBLIC_THREADS,
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
        memberOrRole = this.client.members.get(this.guildId, this.client.user.id)!;
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
          const parentOverwrite = parentOverwrites.get(overwrite.id)!;
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
                overwrite = this._permissionOverwrites.get(raw.id)!;
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


/**
 * Guild Category Channel
 * @category Structure
 */
export class ChannelGuildCategory extends ChannelGuildBase {
  readonly _keys = keysChannelGuildBase;
  type = ChannelTypes.GUILD_CATEGORY;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get children(): BaseCollection<string, ChannelGuildType> {
    const collection = new BaseCollection<string, ChannelGuildType>();
    for (let [channelId, channel] of this.client.channels) {
      if (channel.isGuildChannel && channel.parentId === this.id) {
        collection.set(channelId, channel as ChannelGuildType);
      }
    }
    return collection;
  }
}


const keysChannelGuildText = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.LAST_MESSAGE_ID,
  DiscordKeys.LAST_PIN_TIMESTAMP,
  DiscordKeys.NAME,
  DiscordKeys.NSFW,
  DiscordKeys.PARENT_ID,
  DiscordKeys.PERMISSION_OVERWRITES,
  DiscordKeys.POSITION,
  DiscordKeys.RATE_LIMIT_PER_USER,
  DiscordKeys.TOPIC,
  DiscordKeys.TYPE,
]);

/**
 * Guild Text Channel, it can also be a news channel.
 * @category Structure
 */
export class ChannelGuildText extends ChannelGuildBase {
  readonly _keys = keysChannelGuildText;
  type = ChannelTypes.GUILD_TEXT;

  lastMessageId: null | string = null;
  topic: null | string = null;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
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

  async createThread(options: RequestTypes.CreateChannelThread) {
    return this.client.rest.createChannelThread(this.id, options);
  }

  async createWebhook(options: RequestTypes.CreateWebhook) {
    return this.client.rest.createWebhook(this.id, options);
  }

  async crosspostMessage(messageId: string) {
    return this.client.rest.crosspostMessage(this.id, messageId);
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

  async fetchThreadsActive() {
    return this.client.rest.fetchChannelThreadsActive(this.id);
  }

  async fetchThreadsArchivedPrivate(options: RequestTypes.FetchChannelThreadsArchivedPrivate = {}) {
    return this.client.rest.fetchChannelThreadsArchivedPrivate(this.id, options);
  }

  async fetchThreadsArchivedPrivateJoined(options: RequestTypes.FetchChannelThreadsArchivedPrivateJoined = {}) {
    return this.client.rest.fetchChannelThreadsArchivedPrivateJoined(this.id, options);
  }

  async fetchThreadsArchivedPublic(options: RequestTypes.FetchChannelThreadsArchivedPublic = {}) {
    return this.client.rest.fetchChannelThreadsArchivedPublic(this.id, options);
  }
  
  async fetchWebhooks() {
    return this.client.rest.fetchChannelWebhooks(this.id);
  }

  async follow(options: RequestTypes.FollowChannel): Promise<any> {
    return this.client.rest.followChannel(this.id, options);
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
  DiscordKeys.BITRATE,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.NAME,
  DiscordKeys.NSFW,
  DiscordKeys.PARENT_ID,
  DiscordKeys.PERMISSION_OVERWRITES,
  DiscordKeys.POSITION,
  DiscordKeys.RATE_LIMIT_PER_USER,
  DiscordKeys.RTC_REGION,
  DiscordKeys.TOPIC,
  DiscordKeys.TYPE,
  DiscordKeys.USER_LIMIT,
  DiscordKeys.VIDEO_QUALITY_MODE,
]);

/**
 * Guild Voice Channel
 * @category Structure
 */
export class ChannelGuildVoice extends ChannelGuildBase {
  readonly _keys = keysChannelGuildVoice;
  type = ChannelTypes.GUILD_VOICE;

  bitrate: number = 64000;
  rtcRegion: string | null = null;
  userLimit: number = 0;
  videoQualityMode: ChannelVideoQualityModes = ChannelVideoQualityModes.AUTO;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get joined(): boolean {
    if (this.client.voiceConnections.has(this.guildId)) {
      const voiceConnection = this.client.voiceConnections.get(this.guildId)!;
      return voiceConnection.guildId === this.id;
    }
    return false;
  }

  get members(): BaseCollection<string, Member> {
    const collection = new BaseCollection<string, Member>();
    const voiceStates = this.voiceStates;
    if (voiceStates) {
      for (let [cacheId, voiceState] of voiceStates) {
        if (voiceState.member) {
          collection.set(voiceState.userId, voiceState.member);
        }
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

  join(options: VoiceConnectOptions = {}) {
    return this.client.voiceConnect(this.guildId, this.id, options);
  }
}


const keysChannelGuildStore = new BaseSet<string>([
  DiscordKeys.BITRATE,
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
  DiscordKeys.USER_LIMIT,
]);

/**
 * Guild Store Channel
 * @category Structure
 */
export class ChannelGuildStore extends ChannelGuildBase {
  readonly _keys = keysChannelGuildStore;
  type = ChannelTypes.GUILD_STORE;

  bitrate: number = 0;
  userLimit: number = 0;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  async fetchStoreListing() {
    return this.client.rest.fetchChannelStoreListing(this.id);
  }

  async grantEntitlement() {
    return this.client.rest.createChannelStoreListingGrantEntitlement(this.id);
  }
}


const keysChannelGuildStageVoice = new BaseSet<string>([
  ...keysChannelGuildVoice,
  DiscordKeys.TOPIC,
]);

/**
 * Guild Stage Voice Channel
 * @category Structure
 */
export class ChannelGuildStageVoice extends ChannelGuildVoice {
  readonly _keys = keysChannelGuildStageVoice;
  type = ChannelTypes.GUILD_STAGE_VOICE;

  topic: null | string = null;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  createStageInstance(options: PartialBy<RequestTypes.CreateStageInstance, 'channelId'>) {
    return this.client.rest.createStageInstance({
      ...options,
      channelId: this.id,
    });
  }

  deleteStageInstance() {
    return this.client.rest.deleteStageInstance(this.id);
  }

  editStageInstance(options: RequestTypes.EditStageInstance = {}) {
    return this.client.rest.editStageInstance(this.id, options);
  }

  fetchStageInstance() {
    return this.client.rest.fetchStageInstance(this.id);
  }
}


const keysChannelGuildThread = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.LAST_MESSAGE_ID,
  DiscordKeys.LAST_PIN_TIMESTAMP,
  DiscordKeys.MEMBER,
  DiscordKeys.MEMBER_COUNT,
  DiscordKeys.MESSAGE_COUNT,
  DiscordKeys.NAME,
  DiscordKeys.NSFW,
  DiscordKeys.OWNER_ID,
  DiscordKeys.PARENT_ID,
  DiscordKeys.PERMISSION_OVERWRITES,
  DiscordKeys.POSITION,
  DiscordKeys.RATE_LIMIT_PER_USER,
  DiscordKeys.THREAD_METADATA,
  DiscordKeys.TYPE,
]);


/**
 * Guild Thread Channel
 * @category Structure
 */
export class ChannelGuildThread extends ChannelGuildBase {
  readonly _keys = keysChannelGuildThread;
  type = ChannelTypes.GUILD_PUBLIC_THREAD;

  declare member?: ThreadMember;
  memberCount: number = 0;
  messageCount: number = 0;
  ownerId: string = '';
  declare threadMetadata: ThreadMetadata;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get nsfw(): boolean {
    if (this.parent) {
      return this.parent.nsfw;
    }
    return false;
  }

  addMember(userId: string) {
    return this.client.rest.addThreadMember(this.id, userId);
  }

  fetchMembers() {
    return this.client.rest.fetchThreadMembers(this.id);
  }

  join() {
    return this.client.rest.joinThread(this.id);
  }

  leave() {
    return this.client.rest.leaveThread(this.id);
  }

  removeMember(userId: string) {
    return this.client.rest.removeThreadMember(this.id, userId);
  }

  mergeValue(key: string, value: any) {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.LAST_PIN_TIMESTAMP: {
          this.lastPinTimestampUnix = (value) ? (new Date(value).getTime()) : 0;
        }; return;
        case DiscordKeys.MEMBER: {
          value = new ThreadMember(this.client, value);
        }; break;
        case DiscordKeys.THREAD_METADATA: {
          value = new ThreadMetadata(this, value);
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
