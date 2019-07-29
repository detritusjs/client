import {
  Endpoints,
  Types as Options,
} from 'detritus-client-rest';

import {
  ShardClient,
  VoiceConnectOptions,
} from '../client';
import { BaseCollection } from '../collections/basecollection';
import { VoiceStatesCache } from '../collections/voicestates';
import {
  ChannelTypes,
  ImageFormats,
  Permissions,
} from '../constants';
import { VoiceConnection } from '../media/voiceconnection';
import {
  PermissionTools,
  Snowflake,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { Member } from './member';
import { Overwrite } from './overwrite';
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


const keysChannelBase: ReadonlyArray<string> = [
  'id',
  'name',
  'type',
];

/**
 * Basic Channel Structure
 * @category Structure
 */
export class ChannelBase extends BaseStructure {
  readonly _keys = keysChannelBase;
  readonly nicks = new BaseCollection<string, string>();
  readonly permissionOverwrites = new BaseCollection<string, Overwrite>();
  readonly recipients = new BaseCollection<string, User>();
 
  applicationId: null | string = null;
  bitrate: number = 0;
  guildId: string = '';
  id: string = '';
  lastMessageId: null | string = null;
  lastPinTimestamp: null | Date = null;
  name: string = '';
  nsfw: boolean = false;
  parentId: null | string = null;
  position: number = -1;
  rateLimitPerUser: number = 0;
  topic: null | string = null;
  type: number = ChannelTypes.BASE;
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
      if (this.client.user !== null && this.client.user.bot) {
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
      if (this.client.user !== null && this.client.user.bot) {
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

  get children(): any {
    return null;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get guild(): any {
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

  get members(): any {
    return null;
  }

  get mention(): string {
    return `<#${this.id}>`;
  }

  get owner(): any {
    return null;
  }

  get parent(): any {
    return null;
  }

  get voiceStates(): any {
    return null;
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    member?: Member,
  ): boolean {
    return false;
  }

  iconUrlFormat(...args: any[]): any {
    return null;
  }

  async addPinnedMessage(messageId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async addRecipient(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async bulkDelete(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async close(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async createInvite(options: Options.CreateChannelInvite) {
    return this.client.rest.createChannelInvite(this.id, options);
  }

  async createMessage(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async createReaction(messageId: string, emoji: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async createWebhook(options: Options.CreateWebhook): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async delete() {
    return this.client.rest.deleteChannel(this.id);
  }

  async deleteMessage(messageId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async deleteOverwrite(overwriteId: string): Promise<any> {
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

  async edit(options: Options.EditChannel): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async editMessage(messageId: string, options: Options.EditMessage = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async editOverwrite(overwriteId: string): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchCallStatus(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchInvites() {
    return this.client.rest.fetchChannelInvites(this.id);
  }

  async fetchMessage(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchMessages(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchPins(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchReactions(messageId: string, emoji: string, options: Options.FetchReactions = {}): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async fetchWebhooks(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async join(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async removeRecipient(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async search(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async startCallRinging(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async stopCallRinging(...args: any[]): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async triggerTyping(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  async unack(): Promise<any> {
    throw new Error('Channel type doesn\'t support this.');
  }

  toString(): string {
    return (this.isDmSingle) ? 'DM Channel' : `#${this.name}`;
  }
}


export interface CallOptions extends VoiceConnectOptions {
  recipients?: Array<string>,
  verify?: boolean,
}

const keysChannelDm: ReadonlyArray<string> = [
  'last_message_id',
  'last_pin_timestamp',
  'nicks',
  'recipients',
  ...keysChannelBase,
];

/**
 * Single DM Channel
 * @category Structure
 */
export class ChannelDM extends ChannelBase {
  readonly _keys = keysChannelDm;
  lastMessageId: null | string = null;
  lastPinTimestamp: null | Date = null;

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

  iconUrlFormat(format?: string): null | string {
    if (this.recipients.size) {
      return (<User> this.recipients.first()).avatarUrlFormat(format);
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

  async createMessage(options: Options.CreateMessage | string) {
    return this.client.rest.createMessage(this.id, options);
  }

  async createReaction(messageId: string, emoji: string) {
    return this.client.rest.createReaction(this.id, messageId, emoji);
  }

  async deleteMessage(messageId: string) {
    return this.client.rest.deleteMessage(this.id, messageId);
  }

  async deleteOverwrite(overwriteId: string) {
    return this.client.rest.deleteChannelOverwrite(this.id, overwriteId);
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

  async editMessage(messageId: string, options: Options.EditMessage = {}) {
    return this.client.rest.editMessage(this.id, messageId, options);
  }

  async fetchCallStatus() {
    return this.client.rest.fetchChannelCall(this.id);
  }

  async fetchMessage(messageId: string) {
    return this.client.rest.fetchMessage(this.id, messageId);
  }

  async fetchMessages(options: Options.FetchMessages) {
    return this.client.rest.fetchMessages(this.id, options);
  }

  async fetchPins() {
    return this.client.rest.fetchPinnedMessages(this.id);
  }

  async fetchReactions(messageId: string, emoji: string, options: Options.FetchReactions = {}) {
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

  async search(options: Options.SearchOptions, retry?: boolean) {
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
        case 'last_pin_timestamp': {
          value = new Date(value);
        }; break;
        case 'nicks': {
          this.nicks.clear();
          for (let userId in value) {
            this.nicks.set(userId, value[userId]);
          }
        }; return;
        case 'recipients': {
          this.recipients.clear();
          for (let raw of value) {
            let user: User;
            if (this.client.users.has(raw.id)) {
              user = <User> this.client.users.get(raw.id);
              user.merge(raw);
            } else {
              user = new User(this.client, raw);
              this.client.users.insert(user);
            }
            this.recipients.set(user.id, user);
            if ('nick' in raw) {
              this.nicks.set(user.id, raw.nick);
            }
          }
        }; return;
      }
      super.mergeValue.call(this, key, value);
    }
  }
}


const keysChannelDmGroup: ReadonlyArray<string> = [
  'application_id',
  'icon',
  'name',
  'owner_id',
  ...keysChannelDm,
];

/**
 * Group DM Channel
 * @category Structure
 */
export class ChannelDMGroup extends ChannelDM {
  readonly _keys = keysChannelDmGroup;
  applicationId: null | string = null;
  icon: null | string = null;
  name: string = '';
  ownerId: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client, data, false);
    this.merge(data);
  }

  get owner(): null | User {
    return this.client.users.get(this.ownerId) || null;
  }

  iconUrlFormat(format?: string): null | string {
    if (!this.icon) {
      return null;
    }
    if (format) {
      format = format.toLowerCase();
    } else {
      format = this.client.imageFormat || ImageFormats.PNG;
    }
    const valid = [ImageFormats.JPEG, ImageFormats.JPG, ImageFormats.PNG, ImageFormats.WEBP];
    if (!valid.includes(format)) {
      throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
    }
    return Endpoints.CDN.URL + Endpoints.CDN.DM_ICON(this.id, this.icon, format);
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


const keysChannelGuildBase: ReadonlyArray<string> = [
  'guild_id',
  'nsfw',
  'parent_id',
  'permission_overwrites',
  'position',
  'rate_limit_per_user',
  ...keysChannelBase,
];

const keysMergeChannelGuildBase: ReadonlyArray<string> = [
  'id',
  'guild_id',
];

/**
 * Basic Guild Channel
 * @category Structure
 */
export class ChannelGuildBase extends ChannelBase {
  readonly _keys = keysChannelGuildBase;
  readonly _keysMerge: ReadonlyArray<string> | null = keysMergeChannelGuildBase;
  readonly permissionOverwrites = new BaseCollection<string, Overwrite>();

  guildId: string = '';
  nsfw: boolean = false;
  parentId: null | string = null;
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
    member?: Member,
  ): boolean {
    if (member === undefined) {
      if (this.client.user === null) {
        return false;
      }
      if (this.client.members.has(this.guildId, this.client.user.id)) {
        member = <Member> this.client.members.get(this.guildId, this.client.user.id);
      } else {
        return false;
      }
    }
    const guild = this.guild;
    if (guild !== null) {
      if (guild.isOwner(member.id)) {
        return true;
      }
    }
    const total = member.permissionsFor(this);
    if (PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
      return true;
    }
    return PermissionTools.checkPermissions(total, permissions);
  }

  async deleteOverwrite(overwriteId: string) {
    return this.client.rest.deleteChannelOverwrite(this.id, overwriteId);
  }

  async editOverwrite(overwriteId: string, options: Options.EditChannelOverwrite = {}) {
    return this.client.rest.editChannelOverwrite(this.id, overwriteId, options);
  }

  difference(key: string, value: any): [boolean, any] {
    let differences: any;
    switch (key) {
      case 'permission_overwrites': {
        const old = this.permissionOverwrites;
        if (old.size || old.size !== value.length) {
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
        case 'permission_overwrites': {
          this.permissionOverwrites.clear();
          for (let raw of value) {
            raw.channel_id = this.id;
            raw.guild_id = this.guildId;
            this.permissionOverwrites.set(raw.id, new Overwrite(this.client, raw));
          }
        }; return;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}


const keysChannelGuildCategory: ReadonlyArray<string> = [
  'bitrate',
  'user_limit',
  ...keysChannelGuildBase,
];

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
    const channels = this.client.channels.filter((channel: ChannelGuildBase) => channel.isGuildChannel && channel.parentId === this.id);
    return new BaseCollection(channels);
  }
}


const keysChannelGuildText: ReadonlyArray<string> = [
  'last_message_id',
  'last_pin_timestamp',
  'topic',
  ...keysChannelGuildBase,
];

/**
 * Guild Text Channel, it can also be a news channel.
 * Not sure about the upcoming LFG group, it might not extend this
 * @category Structure
 */
export class ChannelGuildText extends ChannelGuildBase {
  readonly _keys = keysChannelGuildText;
  lastMessageId: null | string = null;
  lastPinTimestamp: null | Date = null;
  topic: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client, data, false);
    this.merge(data);
  }

  async addPinnedMessage(messageId: string) {
    return this.client.rest.addPinnedMessage(this.id, messageId);
  }

  async bulkDelete(messageIds: Array<string>) {
    return this.client.rest.bulkDeleteMessages(this.id, messageIds);
  }

  async createMessage(options: Options.CreateMessage | string) {
    return this.client.rest.createMessage(this.id, options);
  }

  async createReaction(messageId: string, emoji: string) {
    return this.client.rest.createReaction(this.id, messageId, emoji);
  }

  async createWebhook(options: Options.CreateWebhook) {
    return this.client.rest.createWebhook(this.id, options);
  }

  async deleteMessage(messageId: string) {
    return this.client.rest.deleteMessage(this.id, messageId);
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

  async editMessage(messageId: string, options: Options.EditMessage = {}) {
    return this.client.rest.editMessage(this.id, messageId, options);
  }

  async fetchMessage(messageId: string) {
    return this.client.rest.fetchMessage(this.id, messageId);
  }

  async fetchMessages(options: Options.FetchMessages) {
    return this.client.rest.fetchMessages(this.id, options);
  }

  async fetchPins() {
    return this.client.rest.fetchPinnedMessages(this.id);
  }

  async fetchReactions(messageId: string, emoji: string, options: Options.FetchReactions = {}) {
    return this.client.rest.fetchReactions(this.id, messageId, emoji, options);
  }

  async fetchWebhooks() {
    return this.client.rest.fetchChannelWebhooks(this.id);
  }

  async publish(options: Options.CreateApplicationNews) {
    options.channelId = this.id;
    return this.client.rest.createApplicationNews(options);
  }

  async search(options: Options.SearchOptions, retry?: boolean) {
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

  difference(key: string, value: any): [boolean, any] {
    let differences: any;
    switch (key) {
      case 'last_pin_timestamp': {
        const old = this.lastPinTimestamp;
        if (old !== null && value !== null) {
          if (old.getTime() !== (new Date(value)).getTime()) {
            differences = old;
          }
        } else {
          if (old !== value) {
            differences = old;
          }
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

  mergeValue(key: string, value: any) {
    switch (key) {
      case 'last_pin_timestamp': {
        value = new Date(value);
      }; break;
    }
    return super.mergeValue.call(this, key, value);
  }
}


const keysChannelGuildVoice: ReadonlyArray<string> = [
  'bitrate',
  'user_limit',
  ...keysChannelGuildBase,
];

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

  get members(): BaseCollection<string, Member> | null {
    const voiceStates = this.voiceStates;
    if (voiceStates) {
      const members: Array<Member> = voiceStates.map((state: VoiceState) => state.member);
      return new BaseCollection(members.filter((member: Member) => member));
    }
    return null;
  }

  get voiceStates(): BaseCollection<string, VoiceState> | null {
    if (this.client.voiceStates.has(this.guildId)) {
      const voiceStates = <VoiceStatesCache> this.client.voiceStates.get(this.guildId);
      return new BaseCollection(voiceStates.filter((state: VoiceState) => state.channelId === this.id), 'userId');
    }
    return null;
  }

  join(options: VoiceConnectOptions) {
    return this.client.voiceConnect(this.guildId, this.id, options);
  }
}


/**
 * Guild Store Channel
 * @category Structure
 */
export class ChannelGuildStore extends ChannelGuildBase {
  async fetchStoreListing() {
    return this.client.rest.fetchChannelStoreListing(this.id);
  }

  async grantEntitlement() {
    return this.client.rest.createChannelStoreListingGrantEntitlement(this.id);
  }
}
