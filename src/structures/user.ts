import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  DiscordKeys,
  PremiumUserTypes,
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
  DiscordKeys.PUBLIC_FLAGS,
  DiscordKeys.SYSTEM,
  DiscordKeys.USERNAME,
]);

/**
 * Basic User Structure
 * @category Structure
 */
export class User extends BaseStructure {
  readonly _keys = keysUser;

  avatar: null | string = null;
  bot: boolean = false;
  discriminator: string = '0000';
  id: string = '';
  publicFlags: number = 0;
  system?: boolean;
  username: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
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
      if (guild.members.has(this.id)) {
        collection.set(guildId, guild);
      }
    }
    return collection;
  }

  get hasBugHunterLevel1(): boolean {
    return this.hasFlag(UserFlags.BUG_HUNTER_LEVEL_1);
  }

  get hasBugHunterLevel2(): boolean {
    return this.hasFlag(UserFlags.BUG_HUNTER_LEVEL_2);
  }

  get hasDiscordCertifiedModerator(): boolean {
    return this.hasFlag(UserFlags.DISCORD_CERTIFIED_MODERATOR);
  }

  get hasFreePremium(): boolean {
    return this.hasStaff || this.hasPartner;
  }

  get hasEarlySupporter(): boolean {
    return this.hasFlag(UserFlags.PREMIUM_EARLY_SUPPORTER);
  }

  get hasHypesquad(): boolean {
    return this.hasFlag(UserFlags.HYPESQUAD);
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

  get hasMfaSms(): boolean {
    return this.hasFlag(UserFlags.MFA_SMS);
  }

  get hasPartner(): boolean {
    return this.hasFlag(UserFlags.PARTNER);
  }

  get hasPremiumPromoDismissed(): boolean {
    return this.hasFlag(UserFlags.PREMIUM_PROMO_DISMISSED);
  }

  get hasStaff(): boolean {
    return this.hasFlag(UserFlags.STAFF);
  }

  get hasTeamUser(): boolean {
    return this.hasFlag(UserFlags.TEAM_USER);
  }

  get hasVerifiedBot(): boolean {
    return this.hasFlag(UserFlags.VERIFIED_BOT);
  }

  get hasVerifiedDeveloper(): boolean {
    return this.hasFlag(UserFlags.VERIFIED_DEVELOPER);
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

  get isSystem(): boolean {
    return !!this.system;
  }

  get isWebhook(): boolean {
    return this.bot && !this.isSystem && this.discriminator === '0000';
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.USER(this.id);
  }

  get mention(): string {
    return `<@${this.id}>`;
  }

  get messages(): BaseCollection<string, Message> {
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

  get tag(): string {
    return `${this.username}#${this.discriminator}`;
  }

  avatarUrlFormat(format?: null | string, query?: UrlQuery): string {
    if (!this.avatar) {
      return addQuery(this.defaultAvatarUrl, query);
    }
    const hash = this.avatar;
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.AVATAR(this.id, hash, format), query);
  }

  hasFlag(flag: number): boolean {
    return this.hasPublicFlag(flag);
  }

  hasPublicFlag(flag: number): boolean {
    return (this.publicFlags & flag) === flag;
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
    return this.tag;
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
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }
}


/**
 * User with Banner Structure
 * Gotten from fetching `/users/:userId`
 * @category Structure
 */
const keysUserWithBanner = new BaseSet<string>([
  ...keysUser,
  DiscordKeys.ACCENT_COLOR,
  DiscordKeys.BANNER,
  DiscordKeys.BANNER_COLOR,
]);

export class UserWithBanner extends User {
  readonly _keys = keysUserWithBanner;

  accentColor: number | null = null;
  banner: null | string = null;
  bannerColor: null | string = null;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get bannerUrl(): null | string {
    return this.bannerUrlFormat();
  }

  bannerUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (!this.banner) {
      return null;
    }
    const hash = this.banner;
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.BANNER(this.id, hash, format), query);
  }
}


const keysUserWithFlags = new BaseSet<string>([
  ...keysUserWithBanner,
  DiscordKeys.BIO,
  DiscordKeys.FLAGS,
]);

/**
 * User with Flags Structure
 * used to describe someone's badges, you get them from me/profile/team owner
 * @category Structure
 */
export class UserWithFlags extends UserWithBanner {
  readonly _keys = keysUserWithFlags;

  bio: null | string = null;
  flags: number = 0;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
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
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get isClaimed(): boolean {
    // isClaimed if bot or has email
    return !!this.bot || !this.email;
  }

  get hasNitroClassic(): boolean {
    return this.hasPremiumType(PremiumUserTypes.TIER_1);
  }

  get hasNitro(): boolean {
    return this.hasPremiumType(PremiumUserTypes.TIER_2);
  }

  hasPremiumType(type: number): boolean {
    return this.premiumType === type;
  }
}


const keysUserMe = new BaseSet<string>([
  ...keysUserExtended,
  DiscordKeys.ANALYTICS_TOKEN,
  DiscordKeys.PHONE,
]);

/**
 * User Me Structure
 * the current user, it has all their details
 * @category Structure
 */
export class UserMe extends UserExtended {
  readonly _keys = keysUserMe;

  analyticsToken?: string;
  phone?: string;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
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
    return this.avatarUrlFormat();
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

  get guilds(): BaseCollection<string, Guild> {
    return this.user.guilds;
  }

  get hasBugHunterLevel1(): boolean {
    return this.user.hasBugHunterLevel1;
  }

  get hasBugHunterLevel2(): boolean {
    return this.user.hasBugHunterLevel2;
  }

  get hasDiscordCertifiedModerator(): boolean {
    return this.user.hasDiscordCertifiedModerator;
  }

  get hasEarlySupporter(): boolean {
    return this.user.hasEarlySupporter;
  }

  get hasFreePremium(): boolean {
    return this.user.hasFreePremium;
  }

  get hasHypesquad(): boolean {
    return this.user.hasHypesquad;
  }

  get hasHypesquadHouseBravery(): boolean {
    return this.user.hasHypesquadHouseBravery;
  }

  get hasHypesquadHouseBrilliance(): boolean {
    return this.user.hasHypesquadHouseBrilliance;
  }

  get hasHypesquadHouseBalance(): boolean {
    return this.user.hasHypesquadHouseBalance;
  }

  get hasMfaSms(): boolean {
    return this.user.hasMfaSms;
  }

  get hasPartner(): boolean {
    return this.user.hasPartner;
  }

  get hasPremiumPromoDismissed(): boolean {
    return this.user.hasPremiumPromoDismissed;
  }

  get hasStaff(): boolean {
    return this.user.hasStaff;
  }

  get hasTeamUser(): boolean {
    return this.user.hasTeamUser;
  }

  get hasVerifiedBot(): boolean {
    return this.user.hasVerifiedBot;
  }

  get hasVerifiedDeveloper(): boolean {
    return this.user.hasVerifiedDeveloper;
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

  get isSystem(): boolean {
    return this.user.isSystem;
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

  get publicFlags(): number {
    return this.user.publicFlags;
  }

  get system(): boolean | undefined {
    return this.user.system;
  }

  get tag(): string {
    return this.user.tag;
  }

  get username(): string {
    return this.user.username;
  }

  avatarUrlFormat(format?: null | string, query?: UrlQuery): string {
    return this.user.avatarUrlFormat(format, query);
  }

  hasFlag(flag: number): boolean {
    return this.user.hasFlag(flag);
  }

  hasPublicFlag(flag: number): boolean {
    return this.user.hasPublicFlag(flag);
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
