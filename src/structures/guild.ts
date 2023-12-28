import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  GuildExplicitContentFilterTypes,
  GuildFeatures,
  GuildNSFWLevels,
  Locales,
  LocalesText,
  MfaLevels,
  Permissions,
  PremiumGuildLimits,
  PremiumGuildTiers,
  SystemChannelFlags,
  DEFAULT_MAX_MEMBERS,
  DEFAULT_MAX_PRESENCES,
  DEFAULT_MAX_VIDEO_CHANNEL_USERS,
  MAX_ATTACHMENT_SIZE,
  MAX_BITRATE,
  MAX_EMOJI_SLOTS,
  MAX_EMOJI_SLOTS_MORE,
  PERMISSIONS_ALL,
} from '../constants';
import {
  addQuery,
  getAcronym,
  getFormatFromHash,
  getQueryForImage,
  PermissionTools,
  Snowflake,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
  convertKey,
} from './basestructure';
import {
  createChannelFromData,
  Channel,
  ChannelGuildCategory,
  ChannelGuildStageVoice,
  ChannelGuildStore,
  ChannelGuildText,
  ChannelGuildThread,
  ChannelGuildVoice,
} from './channel';
import { Emoji } from './emoji';
import { GuildScheduledEvent } from './guildscheduledevent';
import { Member } from './member';
import { Message } from './message';
import { Presence } from './presence';
import { Role } from './role';
import { StageInstance } from './stageinstance';
import { Sticker } from './sticker';
import { User } from './user';
import { VoiceRegion } from './voiceregion';
import { VoiceState } from './voicestate';


const keysBaseGuild = new BaseSet<string>([
  DiscordKeys.FEATURES,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.NAME,
]);

/**
 * Base Guild Structure
 * @category Structure
 */
export class BaseGuild extends BaseStructure {
  readonly _keys = keysBaseGuild;

  features = new BaseSet<string>();
  icon: null | string = null;
  id: string = '';
  name: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get acronym(): string {
    return getAcronym(this.name);
  }

  get canHaveBanner(): boolean {
    return this.isVerified || this.hasFeature(GuildFeatures.BANNER);
  }

  get canHaveDiscoveryFeatures(): boolean {
    return this.isDiscoverable || this.isPublic;
  }

  get canHaveNews(): boolean {
    return this.hasFeature(GuildFeatures.NEWS);
  }

  get canHavePublic(): boolean {
    return !this.hasFeature(GuildFeatures.PUBLIC_DISABLED);
  }

  get canHaveSplash(): boolean {
    return this.hasFeature(GuildFeatures.INVITE_SPLASH);
  }

  get canHaveStore(): boolean {
    return this.hasFeature(GuildFeatures.COMMERCE);
  }

  get canHaveTextInVoice(): boolean {
    return this.hasFeature(GuildFeatures.TEXT_IN_VOICE_ENABLED);
  }

  get canHaveVanityUrl(): boolean {
    return this.hasFeature(GuildFeatures.VANITY_URL);
  }

  get canHaveVipRegions(): boolean {
    return this.hasFeature(GuildFeatures.VIP_REGIONS);
  }
  
  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }
  
  get iconUrl(): null | string {
    return this.iconUrlFormat();
  }

  get isDiscoverable(): boolean {
    return this.hasFeature(GuildFeatures.DISCOVERABLE);
  }

  get isPartnered(): boolean {
    return this.hasFeature(GuildFeatures.PARTNERED);
  }

  get isPublic(): boolean {
    return this.hasFeature(GuildFeatures.PUBLIC) && !this.hasFeature(GuildFeatures.PUBLIC_DISABLED);
  }

  get isVerified(): boolean {
    return this.hasFeature(GuildFeatures.VERIFIED);
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.GUILD(this.id);
  }

  get widgetImageUrl(): string {
    return Endpoints.Api.URL_STABLE + Endpoints.Api.PATH + Endpoints.formatRoute(Endpoints.Api.GUILD_WIDGET_PNG, {
      guildId: this.id,
    });
  }

  get widgetUrl(): string {
    return Endpoints.Api.URL_STABLE + Endpoints.RoutesQuery.WIDGET(this.id, {theme: 'dark'});
  }


  hasFeature(feature: string): boolean {
    return this.features.has(feature);
  }

  iconUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): null | string {
    if (!this.icon) {
      return null;
    }
    const hash = this.icon;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.GUILD_ICON(this.id, hash, format), query);
  }

  widgetImageUrlFormat(query?: number | UrlQuery): string {
    query = getQueryForImage(query);
    return addQuery(this.widgetImageUrl, query);
  }

  widgetUrlFormat(options: RequestTypes.RouteWidget = {}): string {
    return Endpoints.Api.URL_STABLE + Endpoints.RoutesQuery.WIDGET(this.id, options);
  }


  async ack() {
    return this.client.rest.ackGuild(this.id);
  }

  async addMember(userId: string, options: RequestTypes.AddGuildMember) {
    return this.client.rest.addGuildMember(this.id, userId, options);
  }

  async addMemberRole(userId: string, roleId: string) {
    return this.client.rest.addGuildMemberRole(this.id, userId, roleId);
  }

  async beginPrune(options: RequestTypes.BeginGuildPrune = {}) {
    return this.client.rest.beginGuildPrune(this.id, options);
  }

  async createBan(userId: string, options: RequestTypes.CreateGuildBan) {
    return this.client.rest.createGuildBan(this.id, userId, options);
  }

  async createChannel(options: RequestTypes.CreateGuildChannel) {
    return this.client.rest.createGuildChannel(this.id, options);
  }

  async createEmoji(options: RequestTypes.CreateGuildEmoji) {
    return this.client.rest.createGuildEmoji(this.id, options);
  }

  async createIntegration(options: RequestTypes.CreateGuildIntegration) {
    return this.client.rest.createGuildIntegration(this.id, options);
  }

  async createRole(options: RequestTypes.CreateGuildRole) {
    return this.client.rest.createGuildRole(this.id, options);
  }

  async createSticker(options: RequestTypes.CreateGuildSticker) {
    return this.client.rest.createGuildSticker(this.id, options);
  }

  async createTemplate(options: RequestTypes.CreateGuildTemplate) {
    return this.client.rest.createGuildTemplate(this.id, options);
  }


  async delete() {
    return this.client.rest.deleteGuild(this.id);
  }

  async deleteChannel(channelId: string, options: RequestTypes.DeleteChannel = {}) {
    return this.client.rest.deleteChannel(channelId, options);
  }

  async deleteEmoji(emojiId: string, options: RequestTypes.DeleteGuildEmoji = {}) {
    return this.client.rest.deleteGuildEmoji(this.id, emojiId, options);
  }

  async deleteIntegration(integrationId: string, options: RequestTypes.DeleteGuildIntegration = {}) {
    return this.client.rest.deleteGuildIntegration(this.id, integrationId, options);
  }

  async deletePremiumSubscription(subscriptionId: string) {
    return this.client.rest.deleteGuildPremiumSubscription(this.id, subscriptionId);
  }

  async deleteRole(roleId: string, options: RequestTypes.DeleteGuildRole = {}) {
    return this.client.rest.deleteGuildRole(this.id, roleId, options);
  }

  async deleteSticker(stickerId: string) {
    return this.client.rest.deleteGuildSticker(this.id, stickerId);
  }

  async deleteTemplate(templateId: string) {
    return this.client.rest.deleteGuildTemplate(this.id, templateId);
  }


  async edit(options: RequestTypes.EditGuild) {
    return this.client.rest.editGuild(this.id, options);
  }

  async editChannel(channelId: string, options: RequestTypes.EditChannel) {
    return this.client.rest.editChannel(channelId, options);
  }

  async editChannelPositions(channels: RequestTypes.EditGuildChannels, options: RequestTypes.EditGuildChannelsExtra = {}) {
    return this.client.rest.editGuildChannels(this.id, channels, options);
  }

  async editEmoji(emojiId: string, options: RequestTypes.EditGuildEmoji) {
    return this.client.rest.editGuildEmoji(this.id, emojiId, options);
  }

  async editIntegration(integrationId: string, options: RequestTypes.EditGuildIntegration) {
    return this.client.rest.editGuildIntegration(this.id, integrationId, options);
  }

  async editMember(userId: string, options: RequestTypes.EditGuildMember) {
    return this.client.rest.editGuildMember(this.id, userId, options);
  }

  async editMfaLevel(options: RequestTypes.EditGuildMfaLevel) {
    return this.client.rest.editGuildMfaLevel(this.id, options);
  }

  async editNick(nick: string, options: RequestTypes.EditGuildNick = {}) {
    return this.client.rest.editGuildNick(this.id, nick, options);
  }

  async editRole(roleId: string, options: RequestTypes.EditGuildRole) {
    return this.client.rest.editGuildRole(this.id, roleId, options);
  }

  async editRolePositions(roles: RequestTypes.EditGuildRolePositions, options: RequestTypes.EditGuildRolePositionsExtra = {}) {
    return this.client.rest.editGuildRolePositions(this.id, roles, options);
  }

  async editSticker(stickerId: string, options: RequestTypes.EditGuildSticker = {}) {
    return this.client.rest.editGuildSticker(this.id, stickerId, options);
  }

  async editVanityUrl(code: string, options: RequestTypes.EditGuildVanity = {}) {
    return this.client.rest.editGuildVanity(this.id, code, options);
  }

  async editVoiceState(userId: string, options: RequestTypes.EditGuildVoiceState) {
    return this.client.rest.editGuildVoiceState(this.id, userId, options);
  }

  async editWidget(options: RequestTypes.EditGuildWidget) {
    return this.client.rest.editGuildWidget(this.id, options);
  }


  async fetchApplications(channelId?: string) {
    return this.client.rest.fetchGuildApplications(this.id, channelId);
  }

  async fetchAuditLogs(options: RequestTypes.FetchGuildAuditLogs) {
    return this.client.rest.fetchGuildAuditLogs(this.id, options);
  }

  async fetchBan(userId: string) {
    return this.client.rest.fetchGuildBan(this.id, userId);
  }

  async fetchBans() {
    return this.client.rest.fetchGuildBans(this.id);
  }

  async fetchChannels() {
    return this.client.rest.fetchGuildChannels(this.id);
  }

  async fetchEmoji(emojiId: string) {
    return this.client.rest.fetchGuildEmoji(this.id, emojiId);
  }

  async fetchEmojis() {
    return this.client.rest.fetchGuildEmojis(this.id);
  }

  async fetchInvites() {
    return this.client.rest.fetchGuildInvites(this.id);
  }

  async fetchIntegrations() {
    return this.client.rest.fetchGuildIntegrations(this.id);
  }

  async fetchMember(userId: string) {
    return this.client.rest.fetchGuildMember(this.id, userId);
  }

  async fetchMembers(options: RequestTypes.FetchGuildMembers) {
    return this.client.rest.fetchGuildMembers(this.id, options);
  }

  async fetchMembersSearch(options: RequestTypes.FetchGuildMembersSearch) {
    return this.client.rest.fetchGuildMembersSearch(this.id, options);
  }

  async fetchPremiumSubscriptions() {
    return this.client.rest.fetchGuildPremiumSubscriptions(this.id);
  }

  async fetchPruneCount() {
    return this.client.rest.fetchGuildPruneCount(this.id);
  }

  async fetchRoles() {
    return this.client.rest.fetchGuildRoles(this.id);
  }

  async fetchSticker(stickerId: string) {
    return this.client.rest.fetchGuildSticker(this.id, stickerId);
  }

  async fetchStickers() {
    return this.client.rest.fetchGuildStickers(this.id);
  }

  async fetchTemplates() {
    return this.client.rest.fetchGuildTemplates(this.id);
  }

  async fetchVanityUrl() {
    return this.client.rest.fetchGuildVanityUrl(this.id);
  }

  async fetchVoiceRegions() {
    return this.client.rest.fetchVoiceRegions(this.id);
  }

  async fetchWebhooks() {
    return this.client.rest.fetchGuildWebhooks(this.id);
  }

  async fetchWidget() {
    return this.client.rest.fetchGuildWidget(this.id);
  }

  async fetchWidgetJson() {
    return this.client.rest.fetchGuildWidgetJson(this.id);
  }

  async fetchWidgetPng(options: RequestTypes.FetchGuildWidgetPng = {}) {
    return this.client.rest.fetchGuildWidgetPng(this.id, options);
  }


  async join(options: RequestTypes.JoinGuild) {
    return this.client.rest.joinGuild(this.id, options);
  }

  async leave() {
    return this.client.rest.leaveGuild(this.id);
  }


  async removeBan(userId: string, options: RequestTypes.RemoveGuildBan = {}) {
    return this.client.rest.removeGuildBan(this.id, userId, options);
  }

  async removeMember(userId: string, options: RequestTypes.RemoveGuildMember = {}) {
    return this.client.rest.removeGuildMember(this.id, userId, options);
  }

  async removeMemberRole(userId: string, roleId: string, options: RequestTypes.RemoveGuildBan = {}) {
    return this.client.rest.removeGuildMemberRole(this.id, userId, roleId, options);
  }


  async requestMembers(
    options: {
      limit?: number,
      presences?: boolean,
      query: string,
      timeout?: number,
      userIds?: Array<string>,
    },
  ) {
    return this.client.requestGuildMembers(this.id, options);
  }


  async search(options: RequestTypes.SearchOptions, retry?: boolean) {
    return this.client.rest.searchGuild(this.id, options, retry);
  }

  async syncIntegration(integrationId: string) {
    return this.client.rest.syncGuildIntegration(this.id, integrationId);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.FEATURES in data) {
      const value = data[DiscordKeys.FEATURES];
      if (this.features) {
        this.features.clear();
        for (let raw of value) {
          this.features.add(raw);
        }
      } else {
        this.features = new BaseSet(value);
      }
    }

    if (DiscordKeys.ICON in data) {
      (this as any)[DetritusKeys[DiscordKeys.ICON]] = data[DiscordKeys.ICON];
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }

    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
  }

  toString(): string {
    return this.name;
  }
}


const keysGuildPartial = new BaseSet<string>([
  DiscordKeys.BANNER,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.FEATURES,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.NSFW,
  DiscordKeys.NSFW_LEVEL,
  DiscordKeys.SPLASH,
  DiscordKeys.VANITY_URL_CODE,
  DiscordKeys.VERIFICATION_LEVEL,
  DiscordKeys.WELCOME_SCREEN,
]);

/**
 * Partial Guild Structure
 * @category Structure
 */
export class GuildPartial extends BaseGuild {
  readonly _keys = keysGuildPartial;

  banner: null | string = null;
  description: null | string = null;
  nsfw: boolean = false;
  nsfwLevel: GuildNSFWLevels = GuildNSFWLevels.DEFAULT;
  splash: null | string = null;
  vanityUrlCode: null | string = null;
  verificationLevel: number = 0;
  welcomeScreen: GuildWelcomeScreen | null = null;

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

  get splashUrl(): null | string {
    return this.splashUrlFormat();
  }

  bannerUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): null | string {
    if (!this.banner) {
      return null;
    }
    const hash = this.banner;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.BANNER(this.id, hash, format),
      query,
    );
  }

  splashUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): null | string {
    if (!this.splash) {
      return null;
    }
    const hash = this.splash;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.GUILD_SPLASH(this.id, hash, format), query);
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.BANNER in data) {
      (this as any)[DetritusKeys[DiscordKeys.BANNER]] = data[DiscordKeys.BANNER];
    }

    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }

    if (DiscordKeys.NSFW in data) {
      (this as any)[DetritusKeys[DiscordKeys.NSFW]] = data[DiscordKeys.NSFW];
    }

    if (DiscordKeys.NSFW_LEVEL in data) {
      (this as any)[DetritusKeys[DiscordKeys.NSFW_LEVEL]] = data[DiscordKeys.NSFW_LEVEL];
    }

    if (DiscordKeys.SPLASH in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPLASH]] = data[DiscordKeys.SPLASH];
    }

    if (DiscordKeys.VANITY_URL_CODE in data) {
      (this as any)[DetritusKeys[DiscordKeys.VANITY_URL_CODE]] = data[DiscordKeys.VANITY_URL_CODE];
    }

    if (DiscordKeys.VERIFICATION_LEVEL in data) {
      (this as any)[DetritusKeys[DiscordKeys.VERIFICATION_LEVEL]] = data[DiscordKeys.VERIFICATION_LEVEL];
    }

    if (DiscordKeys.WELCOME_SCREEN in data) {
      const value = data[DiscordKeys.WELCOME_SCREEN];
      let welcomeScreen: GuildWelcomeScreen;
      if (this.isClone) {
        welcomeScreen = new GuildWelcomeScreen(this.client, value, this.isClone);
      } else {
        if (this.welcomeScreen) {
          welcomeScreen = this.welcomeScreen;
          welcomeScreen.merge(value);
        } else {
          welcomeScreen = new GuildWelcomeScreen(this.client, value, this.isClone);
        }
      }
      this.welcomeScreen = welcomeScreen;
    }
  }
}



const keysGuild = new BaseSet<string>([
  DiscordKeys.AFK_CHANNEL_ID,
  DiscordKeys.AFK_TIMEOUT,
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.BANNER,
  DiscordKeys.CHANNELS,
  DiscordKeys.DEFAULT_MESSAGE_NOTIFICATIONS,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.DISCOVERY_SPLASH,
  DiscordKeys.EMOJIS,
  DiscordKeys.EXPLICIT_CONTENT_FILTER,
  DiscordKeys.FEATURES,
  DiscordKeys.GUILD_SCHEDULED_EVENTS,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.JOINED_AT,
  DiscordKeys.LARGE,
  DiscordKeys.LAZY,
  DiscordKeys.MAX_MEMBERS,
  DiscordKeys.MAX_PRESENCES,
  DiscordKeys.MAX_VIDEO_CHANNEL_USERS,
  DiscordKeys.MEMBER_COUNT,
  DiscordKeys.MEMBERS,
  DiscordKeys.MFA_LEVEL,
  DiscordKeys.NAME,
  DiscordKeys.NSFW,
  DiscordKeys.NSFW_LEVEL,
  DiscordKeys.OWNER_ID,
  DiscordKeys.PREFERRED_LOCALE,
  DiscordKeys.PREMIUM_PROGRESS_BAR_ENABLED,
  DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT,
  DiscordKeys.PREMIUM_TIER,
  DiscordKeys.PRESENCES,
  DiscordKeys.PUBLIC_UPDATES_CHANNEL_ID,
  DiscordKeys.REGION,
  DiscordKeys.ROLES,
  DiscordKeys.RULES_CHANNEL_ID,
  DiscordKeys.SPLASH,
  DiscordKeys.STAGE_INSTANCES,
  DiscordKeys.STICKERS,
  DiscordKeys.SYSTEM_CHANNEL_FLAGS,
  DiscordKeys.SYSTEM_CHANNEL_ID,
  DiscordKeys.THREADS,
  DiscordKeys.UNAVAILABLE,
  DiscordKeys.VANITY_URL_CODE,
  DiscordKeys.VERIFICATION_LEVEL,
  DiscordKeys.VOICE_STATES,
  DiscordKeys.WELCOME_SCREEN,
  DiscordKeys.WIDGET_CHANNEL_ID,
  DiscordKeys.WIDGET_ENABLED,
]);

const keysSkipDifferenceGuild = new BaseSet<string>([
  DiscordKeys.EMOJIS,
  DiscordKeys.MEMBERS,
  DiscordKeys.PRESENCES,
  DiscordKeys.ROLES,
  DiscordKeys.STICKERS,
]);

/**
 * Guild Structure
 * @category Structure
 */
export class Guild extends GuildPartial {
  readonly _keys = keysGuild;
  readonly _keysSkipDifference = keysSkipDifferenceGuild;
  readonly _channelIds = new BaseSet<string>();
  readonly _threadIds = new BaseSet<string>();

  afkChannelId: null | string = null;
  afkTimeout: number = 0;
  applicationId?: null | string;
  banner: null | string = null;
  defaultMessageNotifications: number = 0;
  description: null | string = null;
  explicitContentFilter: GuildExplicitContentFilterTypes = GuildExplicitContentFilterTypes.DISABLED;
  emojis: BaseCollection<string, Emoji>;
  features = new BaseSet<string>();
  discoverySplash: null | string = null;
  guildScheduledEvents: BaseCollection<string, GuildScheduledEvent>;
  hasMetadata: boolean = false;
  icon: null | string = null;
  id: string = '';
  isPartial: boolean = false;
  isReady: boolean = false;
  joinedAtUnix: number = 0;
  large: boolean = false;
  lazy: boolean = false;
  left: boolean = false;
  maxMembers: number = DEFAULT_MAX_MEMBERS;
  maxPresences: number = DEFAULT_MAX_PRESENCES;
  maxVideoChannelUsers: number = DEFAULT_MAX_VIDEO_CHANNEL_USERS;
  memberCount: number = 0;
  members: BaseCollection<string, Member>;
  mfaLevel: MfaLevels = MfaLevels.NONE;
  name: string = '';
  nsfw: boolean = false;
  nsfwLevel: GuildNSFWLevels = GuildNSFWLevels.DEFAULT;
  ownerId: string = '';
  preferredLocale: Locales = Locales.ENGLISH_US;
  premiumProgressBarEnabled: boolean = false;
  premiumSubscriptionCount: number = 0;
  premiumTier: PremiumGuildTiers = PremiumGuildTiers.NONE;
  publicUpdatesChannelId: null | string = null;
  region: string = '';
  roles: BaseCollection<string, Role>;
  rulesChannelId: null | string = null;
  splash: null | string = null;
  stageInstances: BaseCollection<string, StageInstance>;
  stickers: BaseCollection<string, Sticker>;
  systemChannelFlags: number = 0;
  systemChannelId: null | string = null;
  unavailable: boolean = false;
  vanityUrlCode: null | string = null;
  verificationLevel: number = 0;
  welcomeScreen: GuildWelcomeScreen | null = null;
  widgetChannelId: null | string = null;
  widgetEnabled: boolean = false;

  constructor(client: ShardClient, data?: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    if (this.isClone) {
      this.emojis = new BaseCollection<string, Emoji>();
      this.guildScheduledEvents = new BaseCollection<string, GuildScheduledEvent>();
      this.members = new BaseCollection<string, Member>();
      this.roles = new BaseCollection<string, Role>();
      this.stageInstances = new BaseCollection<string, StageInstance>();
      this.stickers = new BaseCollection<string, Sticker>();
    } else {
      this.emojis = new BaseCollection<string, Emoji>(this.client.emojis.options);
      this.guildScheduledEvents = new BaseCollection<string, GuildScheduledEvent>(this.client.guildScheduledEvents.options);
      this.members = new BaseCollection<string, Member>(this.client.members.options);
      this.roles = new BaseCollection<string, Role>(this.client.roles.options);
      this.stageInstances = new BaseCollection<string, StageInstance>(this.client.stageInstances.options);
      this.stickers = new BaseCollection<string, Sticker>(this.client.stickers.options);
    }
    this.merge(data);
  }

  get afkChannel(): Channel | null {
    if (this.afkChannelId) {
      return this.client.channels.get(this.afkChannelId) || null;
    }
    return null;
  }

  get allTextChannels(): BaseCollection<string, ChannelGuildText> {
    const collection = new BaseCollection<string, ChannelGuildText>();
    for (let channelId of this._channelIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        if (channel.isText && !channel.isGuildThread) {
          collection.set(channelId, channel as ChannelGuildText);
        }
      }
    }
    return collection;
  }

  get allVoiceChannels(): BaseCollection<string, ChannelGuildStageVoice | ChannelGuildVoice> {
    const collection = new BaseCollection<string, ChannelGuildStageVoice | ChannelGuildVoice>();
    for (let channelId of this._channelIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        if (channel.isVoice) {
          collection.set(channelId, channel as ChannelGuildStageVoice | ChannelGuildVoice);
        }
      }
    }
    return collection;
  }

  get categoryChannels(): BaseCollection<string, ChannelGuildCategory> {
    const collection = new BaseCollection<string, ChannelGuildCategory>();
    for (let channelId of this._channelIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        if (channel.isGuildCategory) {
          collection.set(channelId, channel as ChannelGuildCategory);
        }
      }
    }
    return collection;
  }

  get channels(): BaseCollection<string, Channel> {
    const collection = new BaseCollection<string, Channel>();
    for (let channelId of this._channelIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        collection.set(channelId, channel);
      }
    }
    return collection;
  }

  get defaultRole(): null | Role {
    return this.roles.get(this.id) || null;
  }

  get discoverySplashUrl(): null | string {
    return this.discoverySplashUrlFormat();
  }

  get hasSystemChannelSuppressJoinNotifications(): boolean {
    return this.hasSystemChannelFlag(SystemChannelFlags.SUPPRESS_JOIN_NOTIFICATIONS);
  }

  get hasSystemChannelSuppressPremiumSubscriptions(): boolean {
    return this.hasSystemChannelFlag(SystemChannelFlags.SUPPRESS_PREMIUM_SUBSCRIPTIONS);
  }

  get joinedAt(): Date | null {
    if (this.joinedAtUnix) {
      return new Date(this.joinedAtUnix);
    }
    return null;
  }

  get maxAttachmentSize(): number {
    const max = MAX_ATTACHMENT_SIZE;
    return Math.max(max, (PremiumGuildLimits as any)[this.premiumTier].attachment);
  }

  get maxBitrate(): number {
    let max = MAX_BITRATE;
    if (this.canHaveVipRegions) {
      max = (PremiumGuildLimits as any)[PremiumGuildTiers.TIER_3].bitrate;
    }
    return Math.max(max, (PremiumGuildLimits as any)[this.premiumTier].bitrate);
  }

  get maxEmojis(): number {
    const max = (this.hasFeature(GuildFeatures.MORE_EMOJI) ? MAX_EMOJI_SLOTS_MORE : MAX_EMOJI_SLOTS);
    return Math.max(max, (PremiumGuildLimits as any)[this.premiumTier].emoji);
  }

  get me(): Member | null {
    if (this.client.user) {
      return this.members.get(this.client.user.id) || null;
    }
    return null;
  }

  get messages(): BaseCollection<string, Message> {
    const collection = new BaseCollection<string, Message>();
    for (let [messageId, message] of this.client.messages) {
      if (message.guildId === this.id) {
        collection.set(messageId, message);
      }
    }
    return collection;
  }

  get owner(): null | User {
    return this.client.users.get(this.ownerId) || null;
  }

  get preferredLocaleText(): string {
    if (this.preferredLocale in LocalesText) {
      return LocalesText[this.preferredLocale];
    }
    return '';
  }

  get presences(): BaseCollection<string, Presence> {
    const collection = new BaseCollection<string, Presence>();
    for (let [userId, presence] of this.client.presences) {
      if (presence._hasGuildId(this.id)) {
        collection.set(userId, presence);
      }
    }
    return collection;
  }

  get publicUpdatesChannel(): Channel | null {
    if (this.publicUpdatesChannelId) {
      return this.client.channels.get(this.publicUpdatesChannelId) || null;
    }
    return null;
  }

  get rulesChannel(): Channel | null {
    if (this.rulesChannelId) {
      return this.client.channels.get(this.rulesChannelId) || null;
    }
    return null;
  }

  get stageVoiceChannels(): BaseCollection<string, ChannelGuildStageVoice> {
    const collection = new BaseCollection<string, ChannelGuildStageVoice>();
    for (let channelId of this._channelIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        if (channel.isGuildStageVoice) {
          collection.set(channelId, channel as ChannelGuildStageVoice);
        }
      }
    }
    return collection;
  }

  get storeChannels(): BaseCollection<string, ChannelGuildStore> {
    const collection = new BaseCollection<string, ChannelGuildStore>();
    for (let channelId of this._channelIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        if (channel.isGuildStore) {
          collection.set(channelId, channel as ChannelGuildStore);
        }
      }
    }
    return collection;
  }

  get systemChannel(): Channel | null {
    if (this.systemChannelId) {
      return this.client.channels.get(this.systemChannelId) || null;
    }
    return null;
  }

  get textChannels(): BaseCollection<string, ChannelGuildText> {
    const collection = new BaseCollection<string, ChannelGuildText>();
    for (let channelId of this._channelIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        if (channel.isGuildText) {
          collection.set(channelId, channel as ChannelGuildText);
        }
      }
    }
    return collection;
  }

  get threads(): BaseCollection<string, ChannelGuildThread> {
    const collection = new BaseCollection<string, ChannelGuildThread>();
    for (let channelId of this._threadIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        if (channel.isGuildThread) {
          collection.set(channelId, channel as ChannelGuildThread);
        }
      }
    }
    return collection;
  }

  get voiceChannels(): BaseCollection<string, ChannelGuildVoice> {
    const collection = new BaseCollection<string, ChannelGuildVoice>();
    for (let channelId of this._channelIds) {
      if (this.client.channels.has(channelId)) {
        const channel = this.client.channels.get(channelId)!;
        if (channel.isGuildVoice) {
          collection.set(channelId, channel as ChannelGuildVoice);
        }
      }
    }
    return collection;
  }

  get voiceStates(): BaseCollection<string, VoiceState> {
    if (this.client.voiceStates.has(this.id)) {
      return this.client.voiceStates.get(this.id)!;
    }
    return emptyBaseCollection;
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    member?: Member | null,
    options: {
      channel?: Channel | string,
      ignoreAdministrator?: boolean,
      ignoreOwner?: boolean,
    } = {},
  ): boolean {
    const ignoreAdministrator = !!options.ignoreAdministrator;
    const ignoreOwner = !!options.ignoreOwner;

    if (!ignoreOwner) {
      let memberId: string;
      if (member) {
        memberId = member.id;
      } else {
        if (!this.client.user) {
          throw new Error('Provide a member object please');
        }
        memberId = this.client.user.id;
      }
      if (this.isOwner(memberId)) {
        return true;
      }
    }

    if (!member) {
      member = this.me;
    }
    if (member) {
      const total = this.permissionsFor(member, options.channel);
      if (!ignoreAdministrator && PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
        return true;
      }
      return PermissionTools.checkPermissions(total, permissions);
    }
    return false;
  }

  discoverySplashUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): null | string {
    if (!this.discoverySplash) {
      return null;
    }
    const hash = this.discoverySplash;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.GUILD_SPLASH(this.id, hash, format), query);
  }

  hasSystemChannelFlag(flag: number): boolean {
    return (this.systemChannelFlags & flag) === flag;
  }

  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  permissionsFor(member: Member, channel?: Channel | string): bigint {
    if (this.isOwner(member.user.id)) {
      return PERMISSIONS_ALL;
    }

    let permissions: bigint = Permissions.NONE;
    if (member._roles) {
      for (let roleId of member._roles) {
        const role = this.roles.get(roleId);
        if (role) {
          permissions |= role.permissions;
        }
      }
    }
    if (channel) {
      permissions = member.permissionsIn(channel, permissions);
    }
    return permissions;
  }

  async fetchVoiceRegion(): Promise<VoiceRegion> {
    const regions = await this.fetchVoiceRegions();
    const region = regions.find((reg: VoiceRegion) => reg.id === this.region);
    if (!region) {
      throw new Error('Couldn\'t find this server\'s region from discord.');
    }
    return region;
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    // merge roles first for members
    if (DiscordKeys.ROLES in data) {
      const value = data[DiscordKeys.ROLES];
      if (this.client.roles.enabled) {
        const roles: Array<Role> = [];
        for (let raw of value) {
          let role: Role;
          if (this.roles.has(raw.id)) {
            role = this.roles.get(raw.id)!;
            role.merge(raw);
          } else {
            raw[DiscordKeys.GUILD_ID] = this.id;
            role = new Role(this.client, raw, this.isClone);
          }
          roles.push(role);
        }
        this.roles.clear();
        for (let role of roles) {
          this.roles.set(role.id, role);
        }
      }
    }

    if (DiscordKeys.AFK_CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.AFK_CHANNEL_ID]] = data[DiscordKeys.AFK_CHANNEL_ID];
    }
    if (DiscordKeys.AFK_TIMEOUT in data) {
      (this as any)[DetritusKeys[DiscordKeys.AFK_TIMEOUT]] = data[DiscordKeys.AFK_TIMEOUT];
    }
    if (DiscordKeys.CHANNELS in data) {
      this._channelIds.clear();
      if (this.client.channels.enabled) {
        const value = data[DiscordKeys.CHANNELS];
        for (let raw of value) {
          raw[DiscordKeys.GUILD_ID] = this.id;

          let channel: Channel;
          if (this.isClone) {
            channel = createChannelFromData(this.client, raw, this.isClone);
          } else {
            if (this.client.channels.has(raw.id)) {
              channel = this.client.channels.get(raw.id)!;
              channel.merge(raw);
            } else {
              channel = createChannelFromData(this.client, raw);
              this.client.channels.insert(channel);
            }
          }
          this._channelIds.add(channel.id);
        }
      }
    }
    if (DiscordKeys.DEFAULT_MESSAGE_NOTIFICATIONS in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT_MESSAGE_NOTIFICATIONS]] = data[DiscordKeys.DEFAULT_MESSAGE_NOTIFICATIONS];
    }
    if (DiscordKeys.DISCOVERY_SPLASH in data) {
      (this as any)[DetritusKeys[DiscordKeys.DISCOVERY_SPLASH]] = data[DiscordKeys.DISCOVERY_SPLASH];
    }
    if (DiscordKeys.EMOJIS in data) {
      const value = data[DiscordKeys.EMOJIS];
      if (this.client.emojis.enabled) {
        const emojis: Array<Emoji> = [];
        for (let raw of value) {
          raw[DiscordKeys.GUILD_ID] = this.id;

          let emoji: Emoji;
          if (this.isClone) {
            emoji = new Emoji(this.client, raw, this.isClone);
          } else {
            if (this.emojis.has(raw.id)) {
              emoji = this.emojis.get(raw.id)!;
              emoji.merge(raw);
            } else {
              emoji = new Emoji(this.client, raw);
            }
          }
          emojis.push(emoji);
        }
        this.emojis.clear();
        for (let emoji of emojis) {
          this.emojis.set(emoji.id || emoji.name, emoji);
        }
      }
    }
    if (DiscordKeys.EXPLICIT_CONTENT_FILTER in data) {
      (this as any)[DetritusKeys[DiscordKeys.EXPLICIT_CONTENT_FILTER]] = data[DiscordKeys.EXPLICIT_CONTENT_FILTER];
    }
    if (DiscordKeys.GUILD_SCHEDULED_EVENTS in data) {
      const value = data[DiscordKeys.GUILD_SCHEDULED_EVENTS];
      this.guildScheduledEvents.clear();
      if (this.client.guildScheduledEvents.enabled) {
        for (let raw of value) {
          raw[DiscordKeys.GUILD_ID] = this.id;
          const event = new GuildScheduledEvent(this.client, raw);
          this.guildScheduledEvents.set(event.id, event);
        }
      }
    }
    if (DiscordKeys.JOINED_AT in data) {
      const value = data[DiscordKeys.JOINED_AT];
      this.joinedAtUnix = (value) ? (new Date(value)).getTime() : 0;
    }
    if (DiscordKeys.LARGE in data) {
      (this as any)[DetritusKeys[DiscordKeys.LARGE]] = data[DiscordKeys.LARGE];
    }
    if (DiscordKeys.LAZY in data) {
      (this as any)[DetritusKeys[DiscordKeys.LAZY]] = data[DiscordKeys.LAZY];
    }
    if (DiscordKeys.MAX_MEMBERS in data) {
      (this as any)[DetritusKeys[DiscordKeys.MAX_MEMBERS]] = data[DiscordKeys.MAX_MEMBERS];
    }
    if (DiscordKeys.MAX_PRESENCES in data) {
      let value = data[DiscordKeys.MAX_PRESENCES];
      if (value === null) {
        value = DEFAULT_MAX_PRESENCES;
      }
      (this as any)[DetritusKeys[DiscordKeys.MAX_PRESENCES]] = value;
    }
    if (DiscordKeys.MAX_VIDEO_CHANNEL_USERS in data) {
      (this as any)[DetritusKeys[DiscordKeys.MAX_VIDEO_CHANNEL_USERS]] = data[DiscordKeys.MAX_VIDEO_CHANNEL_USERS];
    }
    if (DiscordKeys.MEMBER_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.MEMBER_COUNT]] = data[DiscordKeys.MEMBER_COUNT];
    }
    if (DiscordKeys.MEMBERS in data) {
      // merge members before presences
      const value = data[DiscordKeys.MEMBERS];
      this.members.clear();
      for (let raw of value) {
        raw[DiscordKeys.GUILD_ID] = this.id;
        if (this.client.user && this.client.user.id === raw.user.id) {
          const member = new Member(this.client, raw, this.isClone);
          this.members.set(member.id, member);
          if (this.client.members.enabled || this.client.presences.enabled || this.client.users.enabled) {
            continue;
          }
          break;
        }

        if (this.client.members.enabled) {
          let member: Member;
          if (this.members.has(raw.user.id)) {
            member = this.members.get(raw.user.id)!;
            member.merge(raw);
          } else {
            member = new Member(this.client, raw, this.isClone);
            this.members.set(member.id, member);
          }
        } else if (this.client.presences.enabled || this.client.users.enabled) {
          // if this isn't a clone, merge user into our cache then
          if (!this.isClone) {
            let user: User;
            if (this.client.users.has(raw.user.id)) {
              user = this.client.users.get(raw.user.id)!;
              user.merge(raw.user);
            } else {
              user = new User(this.client, raw.user);
              this.client.users.insert(user);
            }
          }
        }
      }
    }
    if (DiscordKeys.MFA_LEVEL in data) {
      (this as any)[DetritusKeys[DiscordKeys.MFA_LEVEL]] = data[DiscordKeys.MFA_LEVEL];
    }
    if (DiscordKeys.OWNER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.OWNER_ID]] = data[DiscordKeys.OWNER_ID];
    }
    if (DiscordKeys.PREFERRED_LOCALE in data) {
      (this as any)[DetritusKeys[DiscordKeys.PREFERRED_LOCALE]] = data[DiscordKeys.PREFERRED_LOCALE];
    }
    if (DiscordKeys.PREMIUM_PROGRESS_BAR_ENABLED in data) {
      (this as any)[DetritusKeys[DiscordKeys.PREMIUM_PROGRESS_BAR_ENABLED]] = data[DiscordKeys.PREMIUM_PROGRESS_BAR_ENABLED];
    }
    if (DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT]] = data[DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT];
    }
    if (DiscordKeys.PREMIUM_TIER in data) {
      (this as any)[DetritusKeys[DiscordKeys.PREMIUM_TIER]] = data[DiscordKeys.PREMIUM_TIER];
    }
    if (DiscordKeys.PRESENCES in data) {
      const value = data[DiscordKeys.PRESENCES];
      if (!this.isClone) {
        // drop the presences when cloning the guild..

        this.client.presences.clearGuildId(this.id);
        if (this.client.presences.enabled) {
          for (let raw of value) {
            raw[DiscordKeys.GUILD_ID] = this.id;
            this.client.presences.insert(raw);
          }
        }
      }
    }
    if (DiscordKeys.PUBLIC_UPDATES_CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.PUBLIC_UPDATES_CHANNEL_ID]] = data[DiscordKeys.PUBLIC_UPDATES_CHANNEL_ID];
    }
    if (DiscordKeys.REGION in data) {
      (this as any)[DetritusKeys[DiscordKeys.REGION]] = data[DiscordKeys.REGION];
    }
    if (DiscordKeys.RULES_CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.RULES_CHANNEL_ID]] = data[DiscordKeys.RULES_CHANNEL_ID];
    }
    if (DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT]] = data[DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT] || 0;
    }
    if (DiscordKeys.STAGE_INSTANCES in data) {
      const value = data[DiscordKeys.STAGE_INSTANCES];
      if (this.client.stageInstances.enabled) {
        const stageInstances: Array<StageInstance> = [];
        for (let raw of value) {
          let stage: StageInstance;
          if (this.stageInstances.has(raw.id)) {
            stage = this.stageInstances.get(raw.id)!;
            stage.merge(raw);
          } else {
            raw[DiscordKeys.GUILD_ID] = this.id;
            stage = new StageInstance(this.client, raw, this.isClone);
          }
          stageInstances.push(stage);
        }
        this.stageInstances.clear();
        for (let stage of stageInstances) {
          this.stageInstances.set(stage.id, stage);
        }
      }
    }
    if (DiscordKeys.STICKERS in data) {
      const value = data[DiscordKeys.STICKERS];
      if (this.client.stickers.enabled) {
        const stickers: Array<Sticker> = [];
        for (let raw of value) {
          raw[DiscordKeys.GUILD_ID] = this.id;

          let sticker: Sticker;
          if (this.isClone) {
            sticker = new Sticker(this.client, raw, this.isClone);
          } else {
            if (this.stickers.has(raw.id)) {
              sticker = this.stickers.get(raw.id)!;
              sticker.merge(raw);
            } else {
              sticker = new Sticker(this.client, raw);
            }
          }
          stickers.push(sticker);
        }
        this.stickers.clear();
        for (let sticker of stickers) {
          this.stickers.set(sticker.id, sticker);
        }
      }
    }
    if (DiscordKeys.SYSTEM_CHANNEL_FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.SYSTEM_CHANNEL_FLAGS]] = data[DiscordKeys.SYSTEM_CHANNEL_FLAGS];
    }
    if (DiscordKeys.SYSTEM_CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.SYSTEM_CHANNEL_ID]] = data[DiscordKeys.SYSTEM_CHANNEL_ID];
    }
    if (DiscordKeys.THREADS in data) {
      const value = data[DiscordKeys.THREADS];
      this._threadIds.clear();
      if (this.client.channels.enabled) {
        for (let raw of value) {
          raw[DiscordKeys.GUILD_ID] = this.id;

          let channel: Channel;
          if (this.isClone) {
            channel = createChannelFromData(this.client, raw, this.isClone);
          } else {
            if (this.client.channels.has(raw.id)) {
              channel = this.client.channels.get(raw.id)!;
              channel.merge(raw);
            } else {
              channel = createChannelFromData(this.client, raw);
              this.client.channels.insert(channel);
            }
          }
          this._threadIds.add(channel.id);
        }
      }
    }
    if (DiscordKeys.UNAVAILABLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.UNAVAILABLE]] = data[DiscordKeys.UNAVAILABLE];
    }
    if (DiscordKeys.VOICE_STATES in data) {
      // drop the voice states when cloning the guild.. (unexpected behavior, maybe stop guilds from being cloned?)

      const value = data[DiscordKeys.VOICE_STATES];
      if (this.client.voiceStates.enabled && !this.isClone) {
        const cache = this.client.voiceStates.insertCache(this.id);
        cache.clear();
        for (let raw of value) {
          if (cache.has(raw.user_id)) {
            const voiceState = cache.get(raw.user_id)!;
            voiceState.merge(raw);
          } else {
            raw[DiscordKeys.GUILD_ID] = this.id;
            const voiceState = new VoiceState(this.client, raw);
            if (!voiceState.member && this.members.has(voiceState.userId)) {
              voiceState.member = this.members.get(voiceState.userId)!;
            }
            cache.set(voiceState.userId, voiceState);
          }
        }
      }
    }
    if (DiscordKeys.WIDGET_CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.WIDGET_CHANNEL_ID]] = data[DiscordKeys.WIDGET_CHANNEL_ID];
    }
    if (DiscordKeys.WIDGET_ENABLED in data) {
      (this as any)[DetritusKeys[DiscordKeys.WIDGET_ENABLED]] = data[DiscordKeys.WIDGET_ENABLED];
    }
  }
}



const keysGuildMe = new BaseSet<string>([
  DiscordKeys.FEATURES,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.OWNER,
  DiscordKeys.PERMISSIONS,
]);

/**
 * Guild Me Structure
 * @category Structure
 */
export class GuildMe extends BaseGuild {
  readonly _keys = keysGuildMe;

  owner: boolean = false;
  permissions: bigint = Permissions.NONE;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    options: {
      ignoreAdministrator?: boolean,
      ignoreOwner?: boolean,
    } = {},
  ): boolean {
    const ignoreAdministrator = !!options.ignoreAdministrator;
    const ignoreOwner = !!options.ignoreOwner;

    if (!ignoreOwner) {
      if (this.owner) {
        return true;
      }
    }

    const total = this.permissions;
    if (!ignoreAdministrator && PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
      return true;
    }
    return PermissionTools.checkPermissions(total, permissions);
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.PERMISSIONS in data) {
      (this as any)[DetritusKeys[DiscordKeys.PERMISSIONS]] = BigInt(data[DiscordKeys.PERMISSIONS]);
    }
  }
}



const keysGuildWelcomeScreen = new BaseSet<string>([
  DiscordKeys.DESCRIPTION,
  DiscordKeys.WELCOME_CHANNELS,
]);

/**
 * Guild Welcome Screen, used in [[Guild]]
 * @category Structure
 */
export class GuildWelcomeScreen extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysGuildWelcomeScreen;

  description: string = '';
  welcomeChannels = new BaseCollection<string, GuildWelcomeScreenChannel>();

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

    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }

    if (DiscordKeys.WELCOME_CHANNELS in data) {
      const value = data[DiscordKeys.WELCOME_CHANNELS];
      this.welcomeChannels.clear();
      for (let raw of value) {
        const welcomeChannel = new GuildWelcomeScreenChannel(this, raw);
        this.welcomeChannels.set(welcomeChannel.channelId, welcomeChannel);
      }
    }
  }
}



const keysGuildWelcomeScreenChannel = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.EMOJI_ID,
  DiscordKeys.EMOJI_NAME,
]);

/**
 * Guild Welcome Screen Channel, used in [[GuildWelcomeScreen]]
 * @category Structure
 */
export class GuildWelcomeScreenChannel extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysGuildWelcomeScreenChannel;

  readonly guildWelcomeScreen: GuildWelcomeScreen;

  channelId: string = '';
  description: string = '';
  emojiId?: string;
  emojiName: string | null = null;

  constructor(guildWelcomeScreen: GuildWelcomeScreen, data: BaseStructureData) {
    super(guildWelcomeScreen.client, undefined, guildWelcomeScreen._clone);
    this.guildWelcomeScreen = guildWelcomeScreen;
    this.merge(data);
    Object.defineProperty(this, 'guildWelcomeScreen', {enumerable: false, writable: false});
  }
}
