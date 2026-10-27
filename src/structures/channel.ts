import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import {
  ShardClient,
  VoiceConnectObject,
  VoiceConnectOptions,
} from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  ChannelFlags,
  ChannelTypes,
  ChannelVideoQualityModes,
  Permissions,
  DEFAULT_GROUP_DM_AVATARS,
} from '../constants';
import {
  addQuery,
  getFormatFromHash,
  getQueryForImage,
  PartialBy,
  PermissionTools,
  Snowflake,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
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
  ChannelGuildVoice |
  ChannelGuildStore |
  ChannelGuildThread |
  ChannelGuildStageVoice |
  ChannelGuildDirectory |
  ChannelGuildForum
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
      case ChannelTypes.GUILD_DIRECTORY: {
        Class = ChannelGuildDirectory;
      }; break;
      case ChannelTypes.GUILD_FORUM: {
        Class = ChannelGuildForum;
      }; break;
      case ChannelTypes.GUILD_MEDIA: {
        Class = ChannelGuildMedia;
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
  static { setStructureKeys(this, '_keys', keysChannelBase); }
  static { setStructureKeys(this, '_keysMerge', keysMergeChannelBase); }
  declare _appliedTags?: BaseSet<string>;
  declare _availableTags?: BaseCollection<string, ChannelAvailableTag>;
  _name: string = '';
  declare _nicks?: BaseCollection<string, string>;
  declare _nsfw?: boolean;
  declare _permissions?: bigint;
  declare _permissionOverwrites?: BaseCollection<string, Overwrite>;
  declare _recipients?: BaseCollection<string, User>;

  declare applicationId?: null | string;
  declare bitrate?: number;
  declare defaultAutoArchiveDuration?: number;
  declare defaultForumLayout?: number;
  declare defaultReactionEmoji?: ChannelDefaultReactionEmoji | null;
  declare defaultSortOrder?: number | null;
  declare defaultThreadRateLimitPerUser?: number;
  deleted: boolean = false;
  declare flags?: number;
  declare guildId?: string;
  id: string = '';
  declare icon?: null | string;
  isPartial: boolean = false;
  declare lastMessageId?: null | string;
  declare lastPinTimestampUnix?: number;
  declare managed?: boolean;
  declare member?: ThreadMember;
  declare memberCount?: number;
  declare messageCount?: number;
  declare ownerId?: string;
  declare parentId?: null | string;
  declare position?: number;
  declare rateLimitPerUser?: number;
  declare rtcRegion?: null | string;
  declare status?: null | string;
  declare template?: string;
  declare totalMessageSent?: number;
  declare threadMetadata?: ThreadMetadata;
  topic: null | string = null;
  type: ChannelTypes = ChannelTypes.BASE;
  declare userLimit?: number;
  declare videoQualityMode?: ChannelVideoQualityModes;
  declare voiceStartTime?: null | number;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get appliedTags(): BaseSet<string> {
    if (this._appliedTags) {
      return this._appliedTags;
    }
    return new BaseSet<string>();
  }

  get availableTags(): BaseCollection<string, ChannelAvailableTag> {
    if (this._availableTags) {
      return this._availableTags;
    }
    return emptyBaseCollection;
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

  get canEditPermissions(): boolean {
    return false;
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
    return true;
  }

  get children(): BaseCollection<string, ChannelGuildType> {
    if (this.isGuildCategory) {
      const collection = new BaseCollection<string, ChannelGuildType>();
      for (let [channelId, channel] of this.client.channels) {
        if (channel.isGuildChannel && channel.parentId === this.id) {
          collection.set(channelId, channel as ChannelGuildType);
        }
      }
      return collection;
    }
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
      (this.isGuildStageVoice) || 
      (this.isGuildDirectory) ||
      (this.isGuildForum) ||
      (this.isGuildMedia);
  }

  get isGuildDirectory(): boolean {
    return this.type === ChannelTypes.GUILD_DIRECTORY;
  }

  get isGuildForum(): boolean {
    return this.type === ChannelTypes.GUILD_FORUM;
  }

  get isGuildMedia(): boolean {
    return this.type === ChannelTypes.GUILD_MEDIA;
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

  get isObfuscated(): boolean {
    return this.hasFlag(ChannelFlags.CHANNEL_OBFUSCATED);
  }

  get isPinned(): boolean {
    return this.hasFlag(ChannelFlags.PINNED);
  }

  get isSpoiler(): boolean {
    return this.hasFlag(ChannelFlags.IS_SPOILER_CHANNEL);
  }

  get isSyncedWithParent(): boolean {
    return this.isSyncedWith(this.parent);
  }

  get isText(): boolean {
    return this.isDm || this.isGuildText || this.isGuildVoice || this.isGuildStageVoice || this.isGuildNews || this.isGuildThread;
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

  get permissions(): bigint {
    if (this._permissions) {
      return this._permissions;
    }
    return 0n;
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

  get threads(): BaseCollection<string, ChannelGuildThread> {
    if (this.isGuildChannel) {
      const collection = new BaseCollection<string, ChannelGuildThread>();
      for (let [channelId, channel] of this.client.channels) {
        if (channel.isGuildThread && channel.parentId === this.id) {
          collection.set(channelId, channel as ChannelGuildThread);
        }
      }
      return collection;
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

  hasFlag(flag: number): boolean {
    if (this.flags == 0) {
      return false;
    }
    return ((this.flags || 0) & flag) === flag;
  }

  iconUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    return null;
  }

  isSyncedWith(parent: ChannelGuildCategory | null): boolean {
    return false;
  }

  async addPinnedMessage(messageId: string) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.addPinnedMessage(this.id, messageId);
  }

  async addMember(userId: string) {
    if (!this.isGuildThread) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.addThreadMember(this.id, userId);
  }

  async addRecipient(userId: string, options: RequestTypes.AddRecipient = {}) {
    if (!this.isDm) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.addRecipient(this.id, userId, options);
  }

  async bulkDelete(messageIds: Array<string>) {
    if (!this.isGuildText && !this.isGuildNews && !this.isGuildVoice && !this.isGuildStageVoice && !this.isGuildThread) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.bulkDeleteMessages(this.id, messageIds);
  }

  async close() {
    if (!this.isDm) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.delete();
  }

  async createInvite(options: RequestTypes.CreateChannelInvite) {
    return this.client.rest.createChannelInvite(this.id, options);
  }

  async createMessage(options: RequestTypes.CreateMessage | string = {}) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.createMessage(this.id, options);
  }

  async createReaction(messageId: string, emoji: string) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.createReaction(this.id, messageId, emoji);
  }

  async createStageInstance(options: PartialBy<RequestTypes.CreateStageInstance, 'channelId'>) {
    if (!this.isGuildStageVoice) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.createStageInstance({
      ...options,
      channelId: this.id,
    });
  }

  async createThread(options: RequestTypes.CreateChannelThread) {
    if (!this.isGuildText && !this.isGuildNews && !this.isGuildForum && !this.isGuildMedia) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.createChannelThread(this.id, options);
  }

  async createWebhook(options: RequestTypes.CreateWebhook) {
    if (!this.isGuildText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.createWebhook(this.id, options);
  }

  async crosspostMessage(messageId: string) {
    if (!this.isGuildNews) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.crosspostMessage(this.id, messageId);
  }

  async delete(options: RequestTypes.DeleteChannel = {}) {
    return this.client.rest.deleteChannel(this.id, options);
  }

  async deleteMessage(messageId: string, options: RequestTypes.DeleteMessage = {}) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.deleteMessage(this.id, messageId, options);
  }

  async deleteOverwrite(overwriteId: string, options: RequestTypes.DeleteChannelOverwrite = {}) {
    if (!this.isGuildChannel) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.deleteChannelOverwrite(this.id, overwriteId, options);
  }

  async deletePin(messageId: string) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.deletePinnedMessage(this.id, messageId);
  }

  async deleteReaction(messageId: string, emoji: string, userId: string = '@me') {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.deleteReaction(this.id, messageId, emoji, userId);
  }

  async deleteReactions(messageId: string) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.deleteReactions(this.id, messageId);
  }

  async deleteStageInstance() {
    if (!this.isGuildStageVoice) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.deleteStageInstance(this.id);
  }

  async edit(options: RequestTypes.EditChannel = {}) {
    return this.client.rest.editChannel(this.id, options);
  }

  async editMessage(messageId: string, options: RequestTypes.EditMessage = {}) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.editMessage(this.id, messageId, options);
  }

  async editOverwrite(overwriteId: string, options: RequestTypes.EditChannelOverwrite = {}) {
    if (!this.isGuildChannel) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.editChannelOverwrite(this.id, overwriteId, options);
  }

  async editStageInstance(options: RequestTypes.EditStageInstance = {}) {
    if (!this.isGuildStageVoice) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.editStageInstance(this.id, options);
  }

  async fetchCallStatus() {
    if (!this.isDm) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchChannelCall(this.id);
  }

  async fetchInvites() {
    return this.client.rest.fetchChannelInvites(this.id);
  }

  async fetchMembers(options: RequestTypes.FetchThreadMembers = {}) {
    if (!this.isGuildThread) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchThreadMembers(this.id, options);
  }

  async fetchMessage(messageId: string) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchMessage(this.id, messageId);
  }

  async fetchMessages(options: RequestTypes.FetchMessages = {}) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchMessages(this.id, options);
  }

  async fetchPins() {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchPinnedMessages(this.id);
  }

  async fetchReactions(messageId: string, emoji: string, options: RequestTypes.FetchReactions = {}) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchReactions(this.id, messageId, emoji, options);
  }

  async fetchStageInstance() {
    if (!this.isGuildStageVoice) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchStageInstance(this.id);
  }

  async fetchStoreListing() {
    if (!this.isGuildStore) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchChannelStoreListing(this.id);
  }

  async fetchThreadsActive() {
    if (!this.isGuildText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchChannelThreadsActive(this.id);
  }

  async fetchThreadsArchivedPrivate(options: RequestTypes.FetchChannelThreadsArchivedPrivate = {}) {
    if (!this.isGuildText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchChannelThreadsArchivedPrivate(this.id, options);
  }

  async fetchThreadsArchivedPrivateJoined(options: RequestTypes.FetchChannelThreadsArchivedPrivateJoined = {}) {
    if (!this.isGuildText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchChannelThreadsArchivedPrivateJoined(this.id, options);
  }

  async fetchThreadsArchivedPublic(options: RequestTypes.FetchChannelThreadsArchivedPublic = {}) {
    if (!this.isGuildText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchChannelThreadsArchivedPublic(this.id, options);
  }

  async fetchWebhooks() {
    if (!this.isGuildText && !this.isGuildNews && !this.isGuildVoice && !this.isGuildStageVoice && !this.isGuildForum && !this.isGuildMedia) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.fetchChannelWebhooks(this.id);
  }

  async follow(options: RequestTypes.FollowChannel) {
    if (!this.isGuildNews) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.followChannel(this.id, options);
  }

  async grantEntitlement() {
    if (!this.isGuildStore) {
      throw new Error('Channel type doesn\'t support this.');
    }
  }

  async join(): Promise<void>;
  async join(options?: CallOptions): Promise<VoiceConnectObject | null>;
  async join(options?: CallOptions): Promise<VoiceConnectObject | null | void> {
    if (this.isGuildThread) {
      return this.client.rest.joinThread(this.id);
    } else if (this.isVoice) {
      if (options && this.isDm) {
        if (options.verify || options.verify === undefined) {
          await this.fetchCallStatus();
        }
        if (options.recipients) {
          await this.startCallRinging(options.recipients);
        }
      }
      return this.client.voiceConnect(this.guildId || undefined, this.id, options);
    } else {
      throw new Error('Channel type doesn\'t support this.');
    }
  }

  async leave() {
    if (!this.isGuildThread) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.leaveThread(this.id);
  }

  async removeMember(userId: string) {
    if (!this.isGuildThread) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.removeThreadMember(this.id, userId);
  }

  async removeRecipient(userId: string) {
    if (!this.isDm) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.removeRecipient(this.id, userId);
  }

  async search(options: RequestTypes.SearchOptions, retry?: boolean) {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.searchChannel(this.id, options, retry);
  }

  async startCallRinging(recipients?: Array<string>) {
    if (!this.isDm) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.startChannelCallRinging(this.id, {recipients});
  }

  async stopCallRinging(recipients?: Array<string>) {
    if (!this.isDm) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.stopChannelCallRinging(this.id, {recipients});
  }

  async triggerTyping() {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.triggerTyping(this.id);
  }

  async turnIntoNewsChannel() {
    if (!this.isGuildText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.edit({
      type: ChannelTypes.GUILD_NEWS,
    });
  }

  async turnIntoTextChannel() {
    if (!this.isGuildText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.edit({
      type: ChannelTypes.GUILD_TEXT,
    });
  }

  async unack() {
    if (!this.isText) {
      throw new Error('Channel type doesn\'t support this.');
    }
    return this.client.rest.unAckChannel(this.id);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.IS_PARTIAL in data) {
      (this as any)[DetritusKeys[DiscordKeys.IS_PARTIAL]] = data[DiscordKeys.IS_PARTIAL];
    }
    if (DiscordKeys.NAME in data) {
      this._name = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
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
  static { setStructureKeys(this, '_keys', keysChannelDm); }
  type = ChannelTypes.DM;

  declare lastMessageId: null | string;

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
    return this.client.messages.getChannelMessages(this.id);
  }

  get name(): string {
    if (!this._name) {
      const userId = this.client.userId;
      const recipients = this.recipients.filter((recipient) => recipient.id !== userId);
      return ((recipients.length) ? recipients : this.recipients.toArray()).join(', ') || 'DM Channel';
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
      // the client user is inserted first into the recipients, use the other user's avatar
      const userId = this.client.userId;
      const user = this.recipients.find((recipient) => recipient.id !== userId) || this.recipients.first()!;
      return user.avatarUrlFormat(format, query);
    }
    return null;
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.LAST_MESSAGE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.LAST_MESSAGE_ID]] = data[DiscordKeys.LAST_MESSAGE_ID];
    }
    if (DiscordKeys.LAST_PIN_TIMESTAMP in data) {
      const value = data[DiscordKeys.LAST_PIN_TIMESTAMP];
      this.lastPinTimestampUnix = (value) ? Date.parse(value) : 0;
    }
    if (DiscordKeys.NICKS in data) {
      const value = data[DiscordKeys.NICKS];
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
    }
    if (DiscordKeys.RECIPIENTS in data) {
      const value = data[DiscordKeys.RECIPIENTS];
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

          if (DiscordKeys.NICK in raw) {
            if (!this._nicks) {
              this._nicks = new BaseCollection<string, string>();
            }
            this._nicks.set(user.id, raw[DiscordKeys.NICK]);
          }
        }
      } else {
        if (this._recipients) {
          this._recipients.clear();
          this._recipients = undefined;
        }
      }
    }
  }
}


const keysChannelDmGroup = new BaseSet<string>([
  ...keysChannelDm,
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.ICON,
  DiscordKeys.MANAGED,
  DiscordKeys.NAME,
  DiscordKeys.OWNER_ID,
].sort());

/**
 * Group DM Channel
 * @category Structure
 */
export class ChannelDMGroup extends ChannelDM {
  static { setStructureKeys(this, '_keys', keysChannelDmGroup); }
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

  iconUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): string {
    if (!this.icon) {
      return this.defaultIconUrl;
    }
    const hash = this.icon;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.CHANNEL_ICON(this.id, hash, format),
      query,
    );
  }

  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.APPLICATION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = data[DiscordKeys.APPLICATION_ID];
    }
    if (DiscordKeys.ICON in data) {
      (this as any)[DetritusKeys[DiscordKeys.ICON]] = data[DiscordKeys.ICON];
    }
    if (DiscordKeys.MANAGED in data) {
      (this as any)[DetritusKeys[DiscordKeys.MANAGED]] = data[DiscordKeys.MANAGED];
    }
    if (DiscordKeys.OWNER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.OWNER_ID]] = data[DiscordKeys.OWNER_ID];
    }
  }
}


const keysChannelGuildBase = new BaseSet<string>([
  DiscordKeys.FLAGS,
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

/**
 * Basic Guild Channel
 * @category Structure
 */
export class ChannelGuildBase extends ChannelBase {
  static { setStructureKeys(this, '_keys', keysChannelGuildBase); }
  type = ChannelTypes.BASE;

  flags: number = 0;
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

  // reacting doesn't need SEND_MESSAGES, so this works in read-only channels too
  get canAddReactions(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.READ_MESSAGE_HISTORY,
      Permissions.ADD_REACTIONS,
    ]) && this.canCommunicate;
  }

  get canAttachFiles(): boolean {
    return this.isText && this.canMessage && this.can([
      Permissions.ATTACH_FILES,
    ]);
  }

  get canDeafenMembers(): boolean {
    return this.isVoice && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.DEAFEN_MEMBERS,
    ]);
  }

  get canEdit(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_CHANNELS,
    ]);
  }

  get canEditPermissions(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_ROLES,
    ]);
  }

  get canEmbedLinks(): boolean {
    return this.isText && this.canMessage && this.can([
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
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_MESSAGES,
    ]);
  }

  get canManageWebhooks(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_WEBHOOKS,
    ]);
  }

  get canManageThreads(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_THREADS,
    ]);
  }

  get canMentionEveryone(): boolean {
    return this.isText && this.canMessage && this.can([
      Permissions.MENTION_EVERYONE,
    ]);
  }

  get canMessage(): boolean {
    return this.isText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
    ]) && this.canCommunicate;
  }

  /**
   * If the client user isn't timed out in this guild (timeouts block sending messages and adding reactions)
   */
  get canCommunicate(): boolean {
    if (this.client.user && this.client.members.has(this.guildId, this.client.user.id)) {
      const me = this.client.members.get(this.guildId, this.client.user.id)!;
      if (!me.communicationDisabledUntilUnix || me.communicationDisabledUntilUnix <= Date.now()) {
        // not timed out
        return true;
      }
      // now check if the user has admin/owner as someone can get timed out then get admin/owner
      return me.canAdministrator;
    }
    return false;
  }

  get canMoveMembers(): boolean {
    return this.isVoice && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MOVE_MEMBERS,
    ]);
  }

  get canMuteMembers(): boolean {
    return this.isVoice && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MUTE_MEMBERS,
    ]);
  }

  get canPrioritySpeaker(): boolean {
    return this.isVoice && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.PRIORITY_SPEAKER,
    ]);
  }

  get canSendTTSMessage(): boolean {
    return this.isText && this.canMessage && this.can([
      Permissions.SEND_TTS_MESSAGES,
    ]);
  }

  get canSpeak(): boolean {
    return this.isVoice && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SPEAK,
    ]);
  }

  get canStream(): boolean {
    return this.isVoice && this.can([
      Permissions.VIEW_CHANNEL,
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
    return this.isText && this.canMessage && this.can([
      Permissions.USE_EXTERNAL_EMOJIS,
    ]);
  }

  // threads can't be made inside of voice channels or other threads, and news channels have no private threads
  // forum/media channels override this, their posts need SEND_MESSAGES instead

  get canUsePrivateThreads(): boolean {
    return this.isGuildText && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.USE_PRIVATE_THREADS,
    ]);
  }

  get canUsePublicThreads(): boolean {
    return (this.isGuildText || this.isGuildNews) && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.USE_PUBLIC_THREADS,
    ]);
  }

  get canUseVAD(): boolean {
    return this.isVoice && this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.USE_VAD,
    ]);
  }

  get canView(): boolean {
    return this.can([
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
    let total: bigint = Permissions.NONE;
    if (memberOrRole instanceof Role) {
      if (!ignoreAdministrator) {
        if (PermissionTools.checkPermissions(memberOrRole.permissions, Permissions.ADMINISTRATOR)) {
          return true;
        }
      }
      total = memberOrRole.permissionsIn(this, {ignoreAdministrator});
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

      const guild = this.guild;
      if (!ignoreOwner) {
        if (guild && guild.isOwner(memberOrRole.id)) {
          return true;
        }
      }

      if (ignoreAdministrator && guild) {
        total = guild.permissionsFor(memberOrRole, this, {ignoreAdministrator, ignoreOwner: true});
      } else {
        // compute the member's role permissions once, `permissions` goes through every role each time it's read
        const permissionsBase = memberOrRole.permissions;
        if (!ignoreAdministrator && PermissionTools.checkPermissions(permissionsBase, Permissions.ADMINISTRATOR)) {
          return true;
        }
        // passing the starting permissions skips `permissionsIn()`'s administrator shortcut (already checked above)
        total = memberOrRole.permissionsIn(this, permissionsBase);
      }
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

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    // this first to fill up the other stuff
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }

    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
    }
    if (DiscordKeys.NSFW in data) {
      this._nsfw = data[DiscordKeys.NSFW];
    }
    if (DiscordKeys.PARENT_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.PARENT_ID]] = data[DiscordKeys.PARENT_ID];
    }
    // sent on channels inside of interactions, the invoking member's permissions in the channel
    if (DiscordKeys.PERMISSIONS in data) {
      const value = data[DiscordKeys.PERMISSIONS];
      this._permissions = (value !== undefined && value !== null) ? BigInt(value) : undefined;
    }
    if (DiscordKeys.PERMISSION_OVERWRITES in data) {
      const value = data[DiscordKeys.PERMISSION_OVERWRITES];
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
    }
    if (DiscordKeys.POSITION in data) {
      (this as any)[DetritusKeys[DiscordKeys.POSITION]] = data[DiscordKeys.POSITION];
    }
    if (DiscordKeys.RATE_LIMIT_PER_USER in data) {
      (this as any)[DetritusKeys[DiscordKeys.RATE_LIMIT_PER_USER]] = data[DiscordKeys.RATE_LIMIT_PER_USER];
    }
  }
}


/**
 * Guild Category Channel
 * @category Structure
 */
export class ChannelGuildCategory extends ChannelGuildBase {
  static { setStructureKeys(this, '_keys', keysChannelGuildBase); }
  type = ChannelTypes.GUILD_CATEGORY;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  // categories aren't text channels, but these permissions can still be set on them and sync down to their children

  get canManageMessages(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_MESSAGES,
    ]);
  }

  get canManageThreads(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_THREADS,
    ]);
  }

  get canManageWebhooks(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_WEBHOOKS,
    ]);
  }
}


const keysChannelGuildText = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.DEFAULT_AUTO_ARCHIVE_DURATION,
  DiscordKeys.DEFAULT_THREAD_RATE_LIMIT_PER_USER,
  DiscordKeys.LAST_MESSAGE_ID,
  DiscordKeys.LAST_PIN_TIMESTAMP,
  DiscordKeys.TOPIC,
].sort());

/**
 * Guild Text Channel, it can also be a news channel.
 * @category Structure
 */
export class ChannelGuildText extends ChannelGuildBase {
  static { setStructureKeys(this, '_keys', keysChannelGuildText); }
  type = ChannelTypes.GUILD_TEXT;

  declare lastMessageId: null | string;

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
    return this.client.messages.getChannelMessages(this.id);
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.DEFAULT_AUTO_ARCHIVE_DURATION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_AUTO_ARCHIVE_DURATION]] = data[DiscordKeys.DEFAULT_AUTO_ARCHIVE_DURATION];
    }
    if (DiscordKeys.DEFAULT_THREAD_RATE_LIMIT_PER_USER in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_THREAD_RATE_LIMIT_PER_USER]] = data[DiscordKeys.DEFAULT_THREAD_RATE_LIMIT_PER_USER];
    }
    if (DiscordKeys.LAST_MESSAGE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.LAST_MESSAGE_ID]] = data[DiscordKeys.LAST_MESSAGE_ID];
    }
    if (DiscordKeys.LAST_PIN_TIMESTAMP in data) {
      const value = data[DiscordKeys.LAST_PIN_TIMESTAMP];
      this.lastPinTimestampUnix = (value) ? Date.parse(value) : 0;
    }
    if (DiscordKeys.TOPIC in data) {
      (this as any)[DetritusKeys[DiscordKeys.TOPIC]] = data[DiscordKeys.TOPIC] || null;
    }
  }
}


// last_pin_timestamp is missing here
const keysChannelGuildVoice = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.BITRATE,
  DiscordKeys.LAST_MESSAGE_ID,
  DiscordKeys.RTC_REGION,
  DiscordKeys.STATUS,
  DiscordKeys.TOPIC,
  DiscordKeys.USER_LIMIT,
  DiscordKeys.VIDEO_QUALITY_MODE,
  DiscordKeys.VOICE_START_TIME,
].sort());

/**
 * Guild Voice Channel
 * @category Structure
 */
export class ChannelGuildVoice extends ChannelGuildBase {
  static { setStructureKeys(this, '_keys', keysChannelGuildVoice); }
  type = ChannelTypes.GUILD_VOICE;

  declare lastMessageId: null | string;

  bitrate: number = 64000;
  rtcRegion: null | string = null;
  // `status` and `voiceStartTime` come from the voice channel gateway events or `Guild.requestChannelInfo()`
  status: null | string = null;
  userLimit: number = 0;
  videoQualityMode: ChannelVideoQualityModes = ChannelVideoQualityModes.AUTO;
  // unix seconds
  voiceStartTime: null | number = null;

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
      return voiceConnection.channelId === this.id;
    }
    return false;
  }

  get voiceStartedAt(): Date | null {
    if (this.voiceStartTime) {
      return new Date(this.voiceStartTime * 1000);
    }
    return null;
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

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.BITRATE in data) {
      (this as any)[DetritusKeys[DiscordKeys.BITRATE]] = data[DiscordKeys.BITRATE];
    }
    if (DiscordKeys.LAST_MESSAGE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.LAST_MESSAGE_ID]] = data[DiscordKeys.LAST_MESSAGE_ID];
    }
    if (DiscordKeys.RTC_REGION in data) {
      (this as any)[DetritusKeys[DiscordKeys.RTC_REGION]] = data[DiscordKeys.RTC_REGION];
    }
    if (DiscordKeys.STATUS in data) {
      (this as any)[DetritusKeys[DiscordKeys.STATUS]] = data[DiscordKeys.STATUS];
    }
    if (DiscordKeys.TOPIC in data) {
      (this as any)[DetritusKeys[DiscordKeys.TOPIC]] = data[DiscordKeys.TOPIC] || null;
    }
    if (DiscordKeys.USER_LIMIT in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER_LIMIT]] = data[DiscordKeys.USER_LIMIT];
    }
    if (DiscordKeys.VIDEO_QUALITY_MODE in data) {
      (this as any)[DetritusKeys[DiscordKeys.VIDEO_QUALITY_MODE]] = data[DiscordKeys.VIDEO_QUALITY_MODE];
    }
    if (DiscordKeys.VOICE_START_TIME in data) {
      (this as any)[DetritusKeys[DiscordKeys.VOICE_START_TIME]] = data[DiscordKeys.VOICE_START_TIME];
    }
  }
}


const keysChannelGuildStore = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.BITRATE,
  DiscordKeys.USER_LIMIT,
].sort());

/**
 * Guild Store Channel
 * @category Structure
 */
export class ChannelGuildStore extends ChannelGuildBase {
  static { setStructureKeys(this, '_keys', keysChannelGuildStore); }
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

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.BITRATE in data) {
      (this as any)[DetritusKeys[DiscordKeys.BITRATE]] = data[DiscordKeys.BITRATE];
    }
    if (DiscordKeys.USER_LIMIT in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER_LIMIT]] = data[DiscordKeys.USER_LIMIT];
    }
  }
}


const keysChannelGuildStageVoice = new BaseSet<string>([
  ...keysChannelGuildVoice,
  DiscordKeys.TOPIC,
].sort());

/**
 * Guild Stage Voice Channel
 * @category Structure
 */
export class ChannelGuildStageVoice extends ChannelGuildVoice {
  static { setStructureKeys(this, '_keys', keysChannelGuildStageVoice); }
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

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.TOPIC in data) {
      (this as any)[DetritusKeys[DiscordKeys.TOPIC]] = data[DiscordKeys.TOPIC] || null;
    }
  }
}


function permissionChecksToBigInt(
  permissions: PermissionTools.PermissionChecks,
): bigint {
  if (Array.isArray(permissions)) {
    return permissions.reduce((total: bigint, permission) => total | permissionChecksToBigInt(permission), Permissions.NONE);
  }
  if (typeof(permissions) === 'string') {
    const key = permissions.toUpperCase();
    return (key in Permissions) ? (Permissions as any)[key] as bigint : Permissions.NONE;
  }
  return BigInt(permissions);
}


function toThreadPermissionChecks(
  permissions: PermissionTools.PermissionChecks,
): PermissionTools.PermissionChecks {
  if (Array.isArray(permissions)) {
    return permissions.map((permission) => toThreadPermissionChecks(permission) as bigint | number | string);
  }
  switch (typeof(permissions)) {
    case 'bigint':
    case 'number': {
      const value = BigInt(permissions);
      if ((value & Permissions.SEND_MESSAGES) === Permissions.SEND_MESSAGES) {
        return (value & ~Permissions.SEND_MESSAGES) | Permissions.SEND_MESSAGES_IN_THREADS;
      }
    }; break;
    case 'string': {
      if (permissions.toUpperCase() === 'SEND_MESSAGES') {
        return 'SEND_MESSAGES_IN_THREADS';
      }
    }; break;
  }
  return permissions;
}


const keysChannelGuildThread = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.APPLIED_TAGS,
  DiscordKeys.LAST_MESSAGE_ID,
  DiscordKeys.LAST_PIN_TIMESTAMP,
  DiscordKeys.MEMBER,
  DiscordKeys.MEMBER_COUNT,
  DiscordKeys.MESSAGE_COUNT,
  DiscordKeys.OWNER_ID,
  DiscordKeys.TOTAL_MESSAGE_SENT,
  DiscordKeys.THREAD_METADATA,
].sort());


/**
 * Guild Thread Channel
 * @category Structure
 */
export class ChannelGuildThread extends ChannelGuildBase {
  static { setStructureKeys(this, '_keys', keysChannelGuildThread); }
  type = ChannelTypes.GUILD_PUBLIC_THREAD;

  declare member?: ThreadMember;
  declare threadMetadata: ThreadMetadata;

  memberCount: number = 0;
  messageCount: number = 0;
  ownerId: string = '';

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

  can(
    permissions: PermissionTools.PermissionChecks,
    memberOrRole?: Member | Role,
    options: {ignoreAdministrator?: boolean, ignoreOwner?: boolean} = {},
  ): boolean {
    // threads have no overwrites of their own, they inherit the parent channel's computed permissions
    // and use SEND_MESSAGES_IN_THREADS in place of SEND_MESSAGES
    const parent = this.parent;
    const can = (checks: PermissionTools.PermissionChecks): boolean => {
      if (parent instanceof ChannelGuildBase) {
        return parent.can(checks, memberOrRole, options);
      }
      return super.can(checks, memberOrRole, options);
    };

    const checks = toThreadPermissionChecks(permissions);
    if (!can(checks)) {
      return false;
    }
    const requested = permissionChecksToBigInt(checks);

    // private threads are only visible to thread members, only the client user's membership is cached
    if (this.isGuildThreadPrivate && PermissionTools.checkPermissions(requested, Permissions.VIEW_CHANNEL)) {
      let isThreadMember = false;
      if (!(memberOrRole instanceof Role)) {
        const userId = (memberOrRole) ? memberOrRole.id : this.client.userId;
        isThreadMember = !!this.member && !!userId && this.member.userId === userId;
      }
      if (!isThreadMember && !can(Permissions.MANAGE_THREADS)) {
        return false;
      }
    }

    // sending in a locked thread (or unarchiving one) requires MANAGE_THREADS
    // unarchiving an unlocked thread only requires SEND_MESSAGES_IN_THREADS, which was checked above
    const metadata = this.threadMetadata;
    if (metadata && PermissionTools.checkPermissions(requested, Permissions.SEND_MESSAGES_IN_THREADS)) {
      if (metadata.locked && !can(Permissions.MANAGE_THREADS)) {
        return false;
      }
    }
    return true;
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.APPLIED_TAGS in data) {
      if (this._appliedTags) {
        this._appliedTags.clear();
        for (let raw of data[DiscordKeys.APPLIED_TAGS]) {
          this._appliedTags.add(raw);
        }
      } else {
        this._appliedTags = new BaseSet<string>(data[DiscordKeys.APPLIED_TAGS]);
      }
    }
    if (DiscordKeys.LAST_MESSAGE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.LAST_MESSAGE_ID]] = data[DiscordKeys.LAST_MESSAGE_ID];
    }
    if (DiscordKeys.LAST_PIN_TIMESTAMP in data) {
      const value = data[DiscordKeys.LAST_PIN_TIMESTAMP];
      this.lastPinTimestampUnix = (value) ? Date.parse(value) : 0;
    }
    if (DiscordKeys.MEMBER in data) {
      const value = data[DiscordKeys.MEMBER];
      if (value) {
        // the thread member object inside of GUILD_CREATE/THREAD_LIST_SYNC threads is missing `id` and `user_id`
        // it is always the current user's membership of this thread
        if (!value[DiscordKeys.ID]) {
          value[DiscordKeys.ID] = this.id;
        }
        if (!value[DiscordKeys.USER_ID] && this.client.user) {
          value[DiscordKeys.USER_ID] = this.client.user.id;
        }
      }
      if (value) {
        // keep the same object so references to it stay up to date
        if (this.member) {
          this.member.merge(value);
        } else {
          (this as any)[DetritusKeys[DiscordKeys.MEMBER]] = new ThreadMember(this.client, value);
        }
      } else {
        // null means we aren't a member anymore, not an empty member
        (this as any)[DetritusKeys[DiscordKeys.MEMBER]] = undefined;
      }
    }
    if (DiscordKeys.MEMBER_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.MEMBER_COUNT]] = data[DiscordKeys.MEMBER_COUNT];
    }
    if (DiscordKeys.MESSAGE_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.MESSAGE_COUNT]] = data[DiscordKeys.MESSAGE_COUNT];
    }
    if (DiscordKeys.OWNER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.OWNER_ID]] = data[DiscordKeys.OWNER_ID];
    }
    if (DiscordKeys.TOTAL_MESSAGE_SENT in data) {
      (this as any)[DetritusKeys[DiscordKeys.TOTAL_MESSAGE_SENT]] = data[DiscordKeys.TOTAL_MESSAGE_SENT];
    }
    if (DiscordKeys.THREAD_METADATA in data) {
      const value = data[DiscordKeys.THREAD_METADATA];
      (this as any)[DetritusKeys[DiscordKeys.THREAD_METADATA]] = new ThreadMetadata(this, value);
    }
  }
}



const keysChannelGuildDirectory = new BaseSet<string>([
  ...keysChannelGuildBase,
]);


/**
 * Guild Directory Channel
 * @category Structure
 */
export class ChannelGuildDirectory extends ChannelGuildBase {
  static { setStructureKeys(this, '_keys', keysChannelGuildDirectory); }
  type = ChannelTypes.GUILD_DIRECTORY;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }
}



const keysChannelGuildForum = new BaseSet<string>([
  ...keysChannelGuildBase,
  DiscordKeys.APPLIED_TAGS,
  DiscordKeys.AVAILABLE_TAGS,
  DiscordKeys.DEFAULT_AUTO_ARCHIVE_DURATION,
  DiscordKeys.DEFAULT_FORUM_LAYOUT,
  DiscordKeys.DEFAULT_REACTION_EMOJI,
  DiscordKeys.DEFAULT_SORT_ORDER,
  DiscordKeys.DEFAULT_THREAD_RATE_LIMIT_PER_USER,
  DiscordKeys.LAST_MESSAGE_ID,
  DiscordKeys.TEMPLATE,
  DiscordKeys.TOPIC,
].sort());


/**
 * Guild Forum Channel
 * @category Structure
 */
export class ChannelGuildForum extends ChannelGuildBase {
  static { setStructureKeys(this, '_keys', keysChannelGuildForum); }
  type = ChannelTypes.GUILD_FORUM;

  defaultAutoArchiveDuration: number = 0;
  template: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  // forums can't be messaged directly, but these permissions apply to their posts and webhooks can be made on them

  get canManageMessages(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_MESSAGES,
    ]);
  }

  get canManageThreads(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_THREADS,
    ]);
  }

  get canManageWebhooks(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.MANAGE_WEBHOOKS,
    ]);
  }

  get canReadHistory(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.READ_MESSAGE_HISTORY,
    ]);
  }

  get canUsePrivateThreads(): boolean {
    return false;
  }

  // creating a post is SEND_MESSAGES in forums, not CREATE_PUBLIC_THREADS
  get canUsePublicThreads(): boolean {
    return this.can([
      Permissions.VIEW_CHANNEL,
      Permissions.SEND_MESSAGES,
    ]);
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.APPLIED_TAGS in data) {
      if (this._appliedTags) {
        this._appliedTags.clear();
        for (let raw of data[DiscordKeys.APPLIED_TAGS]) {
          this._appliedTags.add(raw);
        }
      } else {
        this._appliedTags = new BaseSet<string>(data[DiscordKeys.APPLIED_TAGS]);
      }
    }
    if (DiscordKeys.AVAILABLE_TAGS in data) {
      const value = data[DiscordKeys.AVAILABLE_TAGS];
      if (value.length) {
        if (!this._availableTags) {
          this._availableTags = new BaseCollection<string, ChannelAvailableTag>();
        }
        this._availableTags.clear();
        for (let raw of value) {
          raw[DiscordKeys.CHANNEL_ID] = this.id;
          const tag = new ChannelAvailableTag(this.client, raw);
          this._availableTags.set(tag.id, tag);
        }
      } else {
        if (this._availableTags) {
          this._availableTags.clear();
          this._availableTags = undefined;
        }
      }
    }
    if (DiscordKeys.DEFAULT_AUTO_ARCHIVE_DURATION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_AUTO_ARCHIVE_DURATION]] = data[DiscordKeys.DEFAULT_AUTO_ARCHIVE_DURATION];
    }
    if (DiscordKeys.DEFAULT_FORUM_LAYOUT in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_FORUM_LAYOUT]] = data[DiscordKeys.DEFAULT_FORUM_LAYOUT];
    }
    if (DiscordKeys.DEFAULT_REACTION_EMOJI in data) {
      const value = data[DiscordKeys.DEFAULT_REACTION_EMOJI];
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_REACTION_EMOJI]] = (value) ? new ChannelDefaultReactionEmoji(this.client, value) : null;
    }
    if (DiscordKeys.DEFAULT_SORT_ORDER in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_SORT_ORDER]] = data[DiscordKeys.DEFAULT_SORT_ORDER];
    }
    if (DiscordKeys.DEFAULT_THREAD_RATE_LIMIT_PER_USER in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_THREAD_RATE_LIMIT_PER_USER]] = data[DiscordKeys.DEFAULT_THREAD_RATE_LIMIT_PER_USER];
    }
    if (DiscordKeys.LAST_MESSAGE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.LAST_MESSAGE_ID]] = data[DiscordKeys.LAST_MESSAGE_ID];
    }
    if (DiscordKeys.TEMPLATE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TEMPLATE]] = data[DiscordKeys.TEMPLATE];
    }
    if (DiscordKeys.TOPIC in data) {
      (this as any)[DetritusKeys[DiscordKeys.TOPIC]] = data[DiscordKeys.TOPIC] || null;
    }
  }
}


const keysChannelGuildMedia = new BaseSet<string>([
  ...keysChannelGuildForum,
].sort());


/**
 * Guild Media Channel
 * @category Structure
 */
export class ChannelGuildMedia extends ChannelGuildForum {
  static { setStructureKeys(this, '_keys', keysChannelGuildMedia); }
  type = ChannelTypes.GUILD_MEDIA;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }
}



const keysChannelAvailableTag = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.EMOJI_ID,
  DiscordKeys.EMOJI_NAME,
  DiscordKeys.ID,
  DiscordKeys.MODERATED,
  DiscordKeys.NAME,
]);

/**
 * Channel Available Tag (As seen in [[ChannelGuildForum]])
 * @category Structure
 */
export class ChannelAvailableTag extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysChannelAvailableTag); }

  channelId: string = '';
  emojiId: string | null = null;
  emojiName: string = '';
  id: string = '';
  moderated: boolean = false;
  name: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_ID]] = data[DiscordKeys.CHANNEL_ID];
    }
    if (DiscordKeys.EMOJI_ID in data) {
      const value = data[DiscordKeys.EMOJI_ID];
      (this as any)[DetritusKeys[DiscordKeys.EMOJI_ID]] = value || null;
    }
    if (DiscordKeys.EMOJI_NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.EMOJI_NAME]] = data[DiscordKeys.EMOJI_NAME];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.MODERATED in data) {
      (this as any)[DetritusKeys[DiscordKeys.MODERATED]] = data[DiscordKeys.MODERATED];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
  }
}


const keysChannelDefaultReactionEmoji = new BaseSet<string>([
  DiscordKeys.EMOJI_ID,
  DiscordKeys.EMOJI_NAME,
]);

/**
 * Channel Default Reaction Emoji (As seen in [[ChannelGuildForum]])
 * @category Structure
 */
export class ChannelDefaultReactionEmoji extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysChannelDefaultReactionEmoji); }

  emojiId: string | null = null;
  emojiName: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.EMOJI_ID in data) {
      const value = data[DiscordKeys.EMOJI_ID];
      (this as any)[DetritusKeys[DiscordKeys.EMOJI_ID]] = value || null;
    }
    if (DiscordKeys.EMOJI_NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.EMOJI_NAME]] = data[DiscordKeys.EMOJI_NAME];
    }
  }
}