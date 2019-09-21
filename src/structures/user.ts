import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  DiscordKeys,
  MessageCacheTypes,
  PremiumTypes,
  RelationshipTypes,
  UserFlags,
} from '../constants';
import { addQuery, getFormatFromHash, Snowflake, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { Message } from './message';
import { Presence } from './presence';


const keysUser = new BaseSet<string>([
  DiscordKeys.AVATAR,
  DiscordKeys.BOT,
  DiscordKeys.DISCRIMINATOR,
  DiscordKeys.ID,
  DiscordKeys.USERNAME,
]);

/**
 * Basic User Structure
 * @category Structure
 */
export class User extends BaseStructure {
  readonly _keys = keysUser;

  avatar: string | null = null;
  bot: boolean = false;
  discriminator: string = '0000';
  id: string = '';
  username: string = '';

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

  get avatarUrl(): string {
    return this.avatarUrlFormat();
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get defaultAvatarUrl(): string {
    return Endpoints.CDN.URL + Endpoints.CDN.AVATAR_DEFAULT(this.discriminator);
  }

  get dm(): Channel | null {
    return this.client.channels.find((channel) => channel.isDmSingle && channel.recipients.has(this.id)) || null;
  }

  get guilds(): BaseCollection<string, Guild> {
    const collection = new BaseCollection<string, Guild>();
    for (let [guildId, guild] of this.client.guilds) {
      if (this.client.members.has(guildId, this.id)) {
        collection.set(guildId, guild);
      }
    }
    return collection;
  }

  get isClientOwner(): boolean {
    return this.client.isOwner(this.id);
  }

  get isMe(): boolean {
    if (this.client.user) {
      return this.id === this.client.user.id;
    }
    return false
  }

  // https://github.com/discordapp/discord-api-docs/issues/1107
  get isPartial(): boolean {
    return !!this.username;
  }

  get isWebhook(): boolean {
    return this.bot && this.discriminator === '0000';
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.USER(this.id);
  }

  get mention(): string {
    return `<@${this.id}>`;
  }

  get messages(): BaseCollection<string, Message> {
    if (this.client.messages.type === MessageCacheTypes.USER) {
      if (this.client.messages.has(this.id)) {
        return <BaseCollection<string, Message>> this.client.messages.get(this.id);
      } else {
        return emptyBaseCollection;
      }
    }
    const collection = new BaseCollection<string, Message>();
    for (let [messageId, message] of this.client.messages) {
      if (message.author.id === this.id) {
        collection.set(messageId, message);
      }
    }
    return collection;
  }

  get name(): string {
    return this.username;
  }

  get names(): Array<string> {
    return [this.username];
  }

  get note(): string {
    return this.client.notes.get(this.id) || '';
  }

  get presence(): null | Presence {
    return this.client.presences.get(this.id) || null;
  }

  avatarUrlFormat(format?: null | string, query?: UrlQuery): string {
    if (!this.avatar) {
      return addQuery(this.defaultAvatarUrl, query);
    }
    const hash = this.avatar;
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.AVATAR(this.id, hash, format), query);
  }

  add() {
    return this.editRelationship(RelationshipTypes.FRIEND);
  }

  block() {
    return this.editRelationship(RelationshipTypes.BLOCKED);
  }

  createDm() {
    return this.client.rest.createDm({recipientId: this.id});
  }

  async createOrGetDm() {
    const channel = this.dm;
    if (channel) {
      return channel;
    }
    return this.createDm();
  }

  async createMessage(options: RequestTypes.CreateMessage | string = {}) {
    const channel = await this.createOrGetDm();
    return channel.createMessage(options);
  }

  deleteRelationship() {
    return this.client.rest.deleteRelationship(this.id);
  }

  editNote(note: string) {
    return this.client.rest.editNote(this.id, note);
  }

  editRelationship(type: number) {
    return this.client.rest.editRelationship(this.id, type);
  }

  fetchProfile() {
    return this.client.rest.fetchUserProfile(this.id);
  }

  unadd() {
    return this.deleteRelationship();
  }

  unblock() {
    return this.deleteRelationship();
  }

  toString(): string {
    return `${this.username}#${this.discriminator}`;
  }
}


const keysUserWithToken = new BaseSet<string>([
  ...keysUser,
  DiscordKeys.TOKEN,
]);

/**
 * User with Token Structure
 * e.g. when you edit your user
 * @category Structure
 */
export class UserWithToken extends User {
  readonly _keys = keysUserWithToken;

  token: string = '';

  constructor(
    client: ShardClient,
    data: BaseStructureData
  ) {
    super(client, data, false);
    this.merge(data);
  }
}


const keysUserWithFlags = new BaseSet<string>([
  ...keysUser,
  DiscordKeys.FLAGS,
]);

/**
 * User with Flags Structure
 * used to describe someone's badges, you get them from me/profile/team owner
 * @category Structure
 */
export class UserWithFlags extends User {
  readonly _keys = keysUserWithFlags;

  flags: number = 0;

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

  get hasStaff(): boolean {
    return this.hasFlag(UserFlags.STAFF);
  }

  get hasPartner(): boolean {
    return this.hasFlag(UserFlags.PARTNER);
  }

  get hasHypesquad(): boolean {
    return this.hasFlag(UserFlags.HYPESQUAD);
  }

  get hasBugHunter(): boolean {
    return this.hasFlag(UserFlags.BUG_HUNTER);
  }

  get hasMfaSms(): boolean {
    return this.hasFlag(UserFlags.MFA_SMS);
  }

  get hasPremiumPromoDismissed(): boolean {
    return this.hasFlag(UserFlags.PREMIUM_PROMO_DISMISSED);
  }

  get hasHypesquadHouseBravery(): boolean {
    return this.hasFlag(UserFlags.HYPESQUAD_ONLINE_HOUSE_1);
  }

  get hasHypesquadHouseBrilliance(): boolean {
    return this.hasFlag(UserFlags.HYPESQUAD_ONLINE_HOUSE_2);
  }

  get hasHypesquadHouseBalance(): boolean {
    return this.hasFlag(UserFlags.HYPESQUAD_ONLINE_HOUSE_3);
  }

  get hasEarlySupporter(): boolean {
    return this.hasFlag(UserFlags.PREMIUM_EARLY_SUPPORTER);
  }

  get hasTeamUser(): boolean {
    return this.hasFlag(UserFlags.TEAM_USER);
  }

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }
}


const keysUserExtended = new BaseSet<string>([
  ...keysUserWithFlags,
  DiscordKeys.EMAIL,
  DiscordKeys.LOCALE,
  DiscordKeys.MFA_ENABLED,
  DiscordKeys.PREMIUM_TYPE,
  DiscordKeys.VERIFIED,
]);

/**
 * User Extended Structure
 * received from /users/@me calls with an oauth2 token with correct permissions
 * @category Structure
 */
export class UserExtended extends UserWithFlags {
  readonly _keys = keysUserExtended;

  email?: string | null;
  flags: number = 0;
  locale?: string | null;
  mfaEnabled: boolean = false;
  premiumType: number = 0;
  verified: boolean = false;

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

  get isClaimed(): boolean {
    // isClaimed if bot or has email
    return !!this.bot || !this.email;
  }

  get hasNitroClassic(): boolean {
    return this.hasPremiumType(PremiumTypes.TIER_1);
  }

  get hasNitro(): boolean {
    return this.hasPremiumType(PremiumTypes.TIER_2);
  }

  hasPremiumType(type: number): boolean {
    return this.premiumType === type;
  }
}


const keysUserMe = new BaseSet<string>([
  ...keysUserExtended,
  DiscordKeys.PHONE,
]);

/**
 * User Me Structure
 * the current user, it has all their details
 * @category Structure
 */
export class UserMe extends UserExtended {
  readonly _keys = keysUserMe;

  phone?: string;

  constructor(
    client: ShardClient,
    data: BaseStructureData,
  ) {
    super(client, data, false);
    this.merge(data);
  }
}


/**
 * User Mixin Structure
 * Used to extend to receive all of [User]'s properties
 * @category Structure
 */
export class UserMixin extends BaseStructure {
  user!: User;

  get avatar(): null | string {
    return this.user.avatar;
  }

  get avatarUrl(): string {
    return this.user.avatarUrl;
  }

  get bot(): boolean {
    return this.user.bot;
  }

  get createdAt(): Date {
    return this.user.createdAt;
  }

  get createdAtUnix(): number {
    return this.user.createdAtUnix;
  }

  get defaultAvatarUrl(): string {
    return this.user.defaultAvatarUrl;
  }

  get discriminator(): string {
    return this.user.discriminator;
  }

  get dm(): Channel | null {
    return this.user.dm;
  }

  get id(): string {
    return this.user.id;
  }

  get isClientOwner(): boolean {
    return this.user.isClientOwner;
  }

  get isMe(): boolean {
    return this.user.isMe;
  }

  get isWebhook(): boolean {
    return this.user.isWebhook;
  }

  get jumpLink(): string {
    return this.user.jumpLink;
  }

  get mention(): string {
    return this.user.mention;
  }

  get messages(): BaseCollection<string, Message> {
    return this.user.messages;
  }

  get name(): string {
    return this.user.name;
  }

  get names(): Array<string> {
    return this.user.names;
  }

  get note(): string {
    return this.user.note;
  }

  get presence(): null | Presence {
    return this.user.presence;
  }

  get username(): string {
    return this.user.username;
  }

  avatarUrlFormat(format?: null | string, query?: UrlQuery): string {
    return this.user.avatarUrlFormat(format, query);
  }

  add() {
    return this.user.add();
  }

  block() {
    return this.user.block();
  }

  createDm() {
    return this.user.createDm();
  }

  createOrGetDm() {
    return this.user.createOrGetDm();
  }

  createMessage(options: RequestTypes.CreateMessage | string = {}) {
    return this.user.createMessage(options);
  }

  deleteRelationship() {
    return this.user.deleteRelationship();
  }

  editNote(note: string) {
    return this.user.editNote(note);
  }

  editRelationship(type: number) {
    return this.user.editRelationship(type);
  }

  fetchProfile() {
    return this.user.fetchProfile();
  }

  unadd() {
    return this.user.unadd();
  }

  unblock() {
    return this.user.unblock();
  }

  toString(): string {
    return this.user.toString();
  }
}
