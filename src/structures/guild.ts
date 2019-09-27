import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { EmojisOptions } from '../collections/emojis';
import { MembersOptions } from '../collections/members';
import { RolesOptions } from '../collections/roles';
import {
  DiscordKeys,
  GuildFeatures,
  DEFAULT_MAX_MEMBERS,
  DEFAULT_MAX_PRESENCES,
  MAX_ATTACHMENT_SIZE,
  MAX_BITRATE,
  MAX_EMOJI_SLOTS,
  MAX_EMOJI_SLOTS_MORE,
  MfaLevels,
  Permissions,
  PremiumGuildLimits,
  PremiumGuildTierNames,
  SystemChannelFlags,
} from '../constants';
import { GatewayRawEvents } from '../gateway/rawevents';
import {
  addQuery,
  getAcronym,
  getFormatFromHash,
  PermissionTools,
  Snowflake,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import {
  createChannelFromData,
  Channel,
  ChannelGuildCategory,
  ChannelGuildStore,
  ChannelGuildText,
  ChannelGuildVoice,
} from './channel';
import { Emoji } from './emoji';
import { Member } from './member';
import { Message } from './message';
import { Presence } from './presence';
import { Role } from './role';
import { User } from './user';
import { VoiceRegion } from './voiceregion';
import { VoiceState } from './voicestate';


export interface GuildCacheOptions {
  emojis?: EmojisOptions,
  roles?: RolesOptions,
}

const keysGuild = new BaseSet<string>([
  DiscordKeys.AFK_CHANNEL_ID,
  DiscordKeys.AFK_TIMEOUT,
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.BANNER,
  DiscordKeys.CHANNELS,
  DiscordKeys.DEFAULT_MESSAGE_NOTIFICATIONS,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.EMBED_CHANNEL_ID,
  DiscordKeys.EMBED_ENABLED,
  DiscordKeys.EMOJIS,
  DiscordKeys.EXPLICIT_CONTENT_FILTER,
  DiscordKeys.FEATURES,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.JOINED_AT,
  DiscordKeys.LARGE,
  DiscordKeys.LAZY,
  DiscordKeys.MAX_MEMBERS,
  DiscordKeys.MAX_PRESENCES,
  DiscordKeys.MEMBER_COUNT,
  DiscordKeys.MEMBERS,
  DiscordKeys.MFA_LEVEL,
  DiscordKeys.NAME,
  DiscordKeys.OWNER_ID,
  DiscordKeys.PREFERRED_LOCALE,
  DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT,
  DiscordKeys.PREMIUM_TIER,
  DiscordKeys.PRESENCES,
  DiscordKeys.REGION,
  DiscordKeys.ROLES,
  DiscordKeys.SPLASH,
  DiscordKeys.SYSTEM_CHANNEL_FLAGS,
  DiscordKeys.SYSTEM_CHANNEL_ID,
  DiscordKeys.UNAVAILABLE,
  DiscordKeys.VANITY_URL_CODE,
  DiscordKeys.VERIFICATION_LEVEL,
  DiscordKeys.VOICE_STATES,
  DiscordKeys.WIDGET_CHANNEL_ID,
  DiscordKeys.WIDGET_ENABLED,
]);

const keysMergeGuild = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.JOINED_AT,
  DiscordKeys.ROLES,
  DiscordKeys.MEMBERS,
  DiscordKeys.PRESENCES,
]);

/**
 * Guild Structure
 * @category Structure
 */
export class Guild extends BaseStructure {
  readonly _keys = keysGuild;
  readonly _keysMerge = keysMergeGuild;

  afkChannelId: null | string = null;
  afkTimeout: number = 0;
  applicationId?: null | string;
  banner: null | string = null;
  defaultMessageNotifications: number = 0;
  description: null | string = null;
  embedChannelId: null | string = null;
  embedEnabled: boolean = false;
  explicitContentFilter: number = 0;
  emojis: BaseCollection<string, Emoji>;
  features = new BaseSet<string>();
  hasMetadata: boolean = false;
  icon: null | string = null;
  id: string = '';
  isPartial: boolean = false;
  joinedAtUnix: number = 0;
  large: boolean = false;
  lazy: boolean = false;
  maxMembers: number = DEFAULT_MAX_MEMBERS;
  maxPresences: number = DEFAULT_MAX_PRESENCES;
  memberCount: number = 0;
  mfaLevel: number = 0;
  name: string = '';
  ownerId: string = '';
  preferredLocale: string = 'en-US';
  premiumSubscriptionCount: number = 0;
  premiumTier: number = 0;
  region: string = '';
  roles: BaseCollection<string, Role>;
  splash: null | string = null;
  systemChannelFlags: number = 0;
  systemChannelId: null | string = null;
  unavailable: boolean = false;
  vanityUrlCode: null | string = null;
  verificationLevel: number = 0;
  widgetChannelId: null | string = null;
  widgetEnabled: boolean = false;

  constructor(client: ShardClient, data: BaseStructureData, cache: GuildCacheOptions = {}) {
    super(client);
    this.emojis = new BaseCollection<string, Emoji>(cache.emojis || this.client.emojis.options);
    this.roles = new BaseCollection<string, Role>(cache.roles || this.client.roles.options);
    this.merge(data);
  }

  get acronym(): string {
    return getAcronym(this.name);
  }

  get afkChannel(): Channel | null {
    if (this.afkChannelId) {
      return this.client.channels.get(this.afkChannelId) || null;
    }
    return null;
  }

  get bannerUrl(): null | string {
    return this.bannerUrlFormat();
  }

  get categoryChannels(): BaseCollection<string, ChannelGuildCategory> {
    const collection = new BaseCollection<string, ChannelGuildCategory>();
    for (const [channelId, channel] of this.client.channels) {
      if (channel.isGuildCategory && channel.guildId === this.id) {
        collection.set(channelId, channel);
      }
    }
    return collection;
  }

  get channels(): BaseCollection<string, Channel> {
    const collection = new BaseCollection<string, Channel>();
    for (const [channelId, channel] of this.client.channels) {
      if (channel.guildId === this.id) {
        collection.set(channelId, channel);
      }
    }
    return collection;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get defaultRole(): null | Role {
    return this.roles.get(this.id) || null;
  }

  get hasSystemChannelSuppressJoinNotifications(): boolean {
    return this.hasSystemChannelFlag(SystemChannelFlags.SUPPRESS_JOIN_NOTIFICATIONS);
  }

  get hasSystemChannelSuppressPremiumSubscriptions(): boolean {
    return this.hasSystemChannelFlag(SystemChannelFlags.SUPPRESS_PREMIUM_SUBSCRIPTIONS);
  }

  get iconUrl(): null | string {
    return this.iconUrlFormat();
  }

  get joinedAt(): Date | null {
    if (this.joinedAtUnix) {
      return new Date(this.joinedAtUnix);
    }
    return null;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.GUILD(this.id);
  }

  get maxAttachmentSize(): number {
    const max = MAX_ATTACHMENT_SIZE;
    return Math.max(max, (<any> PremiumGuildLimits)[this.premiumTier].attachment);
  }

  get maxBitrate(): number {
    const max = MAX_BITRATE;
    return Math.max(max, (<any> PremiumGuildLimits)[this.premiumTier].bitrate);
  }

  get maxEmojis(): number {
    const max = (this.hasFeature(GuildFeatures.MORE_EMOJI) ? MAX_EMOJI_SLOTS_MORE : MAX_EMOJI_SLOTS);
    return Math.max(max, (<any> PremiumGuildLimits)[this.premiumTier].emoji);
  }

  get me(): Member | null {
    if (this.client.user) {
      return this.client.members.get(this.id, this.client.user.id) || null;
    }
    return null;
  }

  get members(): BaseCollection<string, Member> {
    if (this.client.members.has(this.id)) {
      return <BaseCollection<string, Member>> this.client.members.get(this.id);
    }
    return emptyBaseCollection;
  }

  get messages(): BaseCollection<string, Message> {
    if (this.client.messages.has(this.id)) {
      return <BaseCollection<string, Message>> this.client.messages.get(this.id);
    }
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

  get presences(): BaseCollection<string, Presence> {
    const collection = new BaseCollection<string, Presence>();
    for (let [userId, presence] of this.client.presences) {
      if (presence.guildIds.has(this.id)) {
        collection.set(userId, presence);
      }
    }
    return collection;
  }

  get splashUrl(): null | string {
    return this.splashUrlFormat();
  }

  get storeChannels(): BaseCollection<string, ChannelGuildStore> {
    const collection = new BaseCollection<string, ChannelGuildStore>();
    for (const [channelId, channel] of this.client.channels) {
      if (channel.isGuildStore && channel.guildId === this.id) {
        collection.set(channelId, channel);
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
    for (const [channelId, channel] of this.client.channels) {
      if (channel.isGuildText && channel.guildId === this.id) {
        collection.set(channelId, channel);
      }
    }
    return collection;
  }

  get voiceChannels(): BaseCollection<string, ChannelGuildVoice> {
    const collection = new BaseCollection<string, ChannelGuildVoice>();
    for (const [channelId, channel] of this.client.channels) {
      if (channel.isGuildVoice && channel.guildId === this.id) {
        collection.set(channelId, channel);
      }
    }
    return collection;
  }

  get voiceStates(): BaseCollection<string, VoiceState> {
    if (this.client.voiceStates.has(this.id)) {
      return <BaseCollection<string, VoiceState>> this.client.voiceStates.get(this.id);
    }
    return emptyBaseCollection;
  }

  get widgetImageUrl(): string {
    return Endpoints.Api.URL_STABLE + Endpoints.Api.PATH + Endpoints.formatRoute(Endpoints.Api.GUILD_WIDGET_PNG, {
      guildId: this.id,
    });
  }

  get widgetUrl(): string {
    return Endpoints.Api.URL_STABLE + Endpoints.RoutesQuery.WIDGET(this.id, {theme: 'dark'});
  }

  bannerUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (!this.banner) {
      return null;
    }
    const hash = this.banner;
    format = getFormatFromHash(
      hash,
      format,
      this.client.imageFormat,
    );
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.GUILD_BANNER(this.id, hash, format),
      query,
    );
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    member?: Member | null,
    options: {
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
      const total = member.permissions;
      if (!ignoreAdministrator && PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
        return true;
      }
      return PermissionTools.checkPermissions(total, permissions);
    }
    return false;
  }

  hasFeature(feature: string): boolean {
    return this.features.has(feature);
  }

  hasSystemChannelFlag(flag: number): boolean {
    return (this.systemChannelFlags & flag) === flag;
  }

  iconUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (!this.icon) {
      return null;
    }
    const hash = this.icon;
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.GUILD_ICON(this.id, hash, format), query);
  }

  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  splashUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (!this.splash) {
      return null;
    }
    const hash = this.splash;
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.GUILD_SPLASH(this.id, hash, format), query);
  }

  widgetImageUrlFormat(query?: UrlQuery): string {
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


  async edit(options: RequestTypes.EditGuild) {
    return this.client.rest.editGuild(this.id, options);
  }

  async editChannel(channelId: string, options: RequestTypes.EditChannel) {
    return this.client.rest.editChannel(channelId, options);
  }

  async editChannelPositions(channels: RequestTypes.EditGuildChannels, options: RequestTypes.EditGuildChannelsExtra = {}) {
    return this.client.rest.editGuildChannels(this.id, channels, options);
  }

  async editEmbed(options: RequestTypes.EditGuildEmbed) {
    return this.client.rest.editGuildEmbed(this.id, options);
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

  async editNick(nick: string, userId: string = '@me', options: RequestTypes.EditGuildNick = {}) {
    return this.client.rest.editGuildNick(this.id, nick, userId, options);
  }

  async editRole(roleId: string, options: RequestTypes.EditGuildRole) {
    return this.client.rest.editGuildRole(this.id, roleId, options);
  }

  async editRolePositions(roles: RequestTypes.EditGuildRolePositions, options: RequestTypes.EditGuildRolePositionsExtra = {}) {
    return this.client.rest.editGuildRolePositions(this.id, roles, options);
  }

  async editVanityUrl(code: string, options: RequestTypes.EditGuildVanity = {}) {
    return this.client.rest.editGuildVanity(this.id, code, options);
  }


  async fetchApplications(channelId?: string) {
    return this.client.rest.fetchGuildApplications(this.id, channelId);
  }

  async fetchAuditLogs(options: RequestTypes.FetchGuildAuditLogs) {
    return this.client.rest.fetchGuildAuditLogs(this.id, options);
  }

  async fetchBans() {
    return this.client.rest.fetchGuildBans(this.id);
  }

  async fetchChannels() {
    return this.client.rest.fetchGuildChannels(this.id);
  }

  async fetchEmbed() {
    return this.client.rest.fetchGuildEmbed(this.id);
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

  async fetchPremiumSubscriptions() {
    return this.client.rest.fetchGuildPremiumSubscriptions(this.id);
  }

  async fetchPruneCount() {
    return this.client.rest.fetchGuildPruneCount(this.id);
  }

  async fetchRoles() {
    return this.client.rest.fetchGuildRoles(this.id);
  }

  async fetchVanityUrl() {
    return this.client.rest.fetchGuildVanityUrl(this.id);
  }

  async fetchVoiceRegion(): Promise<VoiceRegion> {
    const regions = await this.fetchVoiceRegions();
    const region = regions.find((reg: VoiceRegion) => reg.id === this.region);
    if (!region) {
      throw new Error('Couldn\'t find this server\'s region from discord.');
    }
    return region;
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


  async search(options: RequestTypes.SearchOptions, retry?: boolean) {
    return this.client.rest.searchGuild(this.id, options, retry);
  }

  async syncIntegration(integrationId: string) {
    return this.client.rest.syncGuildIntegration(this.id, integrationId);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.CHANNELS: {
          if (this.client.channels.enabled) {
            for (let raw of value) {
              let channel: Channel;
              if (this.client.channels.has(raw.id)) {
                channel = <Channel> this.client.channels.get(raw.id);
                channel.merge(raw);
              } else {
                raw.guild_id = this.id;
                channel = createChannelFromData(this.client, raw);
                this.client.channels.insert(channel);
              }
            }
          }
        }; return;
        case DiscordKeys.EMOJIS: {
          if (this.client.emojis.enabled) {
            const emojis: Array<Emoji> = [];
            for (let raw of value) {
              let emoji: Emoji;
              if (this.emojis.has(raw.id)) {
                emoji = <Emoji> this.emojis.get(raw.id);
                emoji.merge(raw);
              } else {
                raw.guild_id = this.id;
                emoji = new Emoji(this.client, raw);
              }
              emojis.push(emoji);
            }
            this.emojis.clear();
            for (let emoji of emojis) {
              this.emojis.set(emoji.id || emoji.name, emoji);
            }
          }
        }; return;
        case DiscordKeys.FEATURES: {
          if (this.features) {
            this.features.clear();
            for (let raw of value) {
              this.features.add(raw);
            }
          } else {
            this.features = new BaseSet(value);
          }
        }; return;
        case DiscordKeys.JOINED_AT: {
          this.joinedAtUnix = (value) ? (new Date(value)).getTime() : 0;
        }; return;
        case DiscordKeys.MAX_PRESENCES: {
          if (value === null) {
            value = DEFAULT_MAX_PRESENCES;
          }
        }; break;
        case DiscordKeys.MEMBERS: {
          const cache = this.client.members.insertCache(this.id);
          cache.clear();

          for (let raw of value) {
            if (this.client.user && this.client.user.id === raw.user.id) {
              raw.guild_id = this.id;
              const member = new Member(this.client, raw);
              // now fill in the roles since they'll be null if we received this from READY (full guild object) or GUILD_CREATE so guild wasn't in cache
              for (let [roleId, role] of member.roles) {
                if (!role) {
                  member.roles.set(roleId, this.roles.get(roleId) || null);
                }
              }
              this.client.members.insert(member);
              continue;
            }

            if (this.client.members.enabled) {
              let member: Member;
              if (this.client.members.has(this.id, raw.user.id)) {
                member = <Member> this.client.members.get(this.id, raw.user.id);
                member.merge(raw);
              } else {
                raw.guild_id = this.id;
                member = new Member(this.client, raw);
                this.client.members.insert(member);
              }
              // now fill in the roles since they'll be null if we received this from READY (full guild object) or GUILD_CREATE so guild wasn't in cache
              for (let [roleId, role] of member.roles) {
                if (!role) {
                  member.roles.set(roleId, this.roles.get(roleId) || null);
                }
              }
            } else if (this.client.presences.enabled || this.client.users.enabled) {
              let user: User;
              if (this.client.users.has(raw.user.id)) {
                user = <User> this.client.users.get(raw.user.id);
                user.merge(raw.user);
              } else {
                user = new User(this.client, raw.user);
                this.client.users.insert(user);
              }
            }
          }
        }; return;
        case DiscordKeys.ROLES: {
          if (this.client.roles.enabled) {
            const roles: Array<Role> = [];
            for (let raw of value) {
              let role: Role;
              if (this.roles.has(raw.id)) {
                role = <Role> this.roles.get(raw.id);
                role.merge(raw);
              } else {
                raw.guild_id = this.id;
                role = new Role(this.client, raw);
              }
              roles.push(role);
            }
            this.roles.clear();
            for (let role of roles) {
              this.roles.set(role.id, role);
            }
          }
        }; return;
        case DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT: {
          value = value || 0;
        }; break;
        case DiscordKeys.PRESENCES: {
          this.client.presences.clearGuildId(this.id);
          if (this.client.presences.enabled) {
            for (let raw of value) {
              raw.guild_id = this.id;
              this.client.presences.insert(raw);
            }
          }
        }; return;
        case DiscordKeys.VOICE_STATES: {
          const cache = this.client.voiceStates.insertCache(this.id);
          cache.clear();

          if (this.client.voiceStates.enabled) {
            for (let raw of value) {
              if (this.client.voiceStates.has(this.id, raw.user_id)) {
                (<VoiceState> this.client.voiceStates.get(this.id, raw.user_id)).merge(raw);
              } else {
                raw.guild_id = this.id;
                const voiceState = new VoiceState(this.client, raw);
                if (!voiceState.member && this.client.members.has(this.id, raw.user_id)) {
                  voiceState.member = <Member> this.client.members.get(this.id, raw.user_id);
                }
                this.client.voiceStates.insert(new VoiceState(this.client, raw));
              }
            }
          }
        }; return;
      }
      super.mergeValue.call(this, key, value);
    }
  }

  toString(): string {
    return this.name;
  }
}
