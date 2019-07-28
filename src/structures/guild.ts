import {
  Endpoints,
  Types as Options,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import {
  GuildFeatures,
  MAX_ATTACHMENT_SIZE,
  MAX_BITRATE,
  MAX_EMOJI_SLOTS,
  MAX_EMOJI_SLOTS_MORE,
  MfaLevels,
  Permissions,
  PremiumGuildLimits,
} from '../constants';
import { GatewayRawEvents } from '../gateway/rawevents';
import {
  getAcronym,
  PermissionTools,
  Snowflake,
} from '../utils';

import { BaseCollection } from '../collections/basecollection';
import {
  MembersCache,
  PresencesCache,
  VoiceStatesCache,
} from '../collections';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import {
  createChannelFromData,
  Channel,
} from './channel';
import { Emoji } from './emoji';
import { Member } from './member';
import { Role } from './role';
import { User } from './user';
import { VoiceRegion } from './voiceregion';
import { VoiceState } from './voicestate';


export const DEFAULT_MAX_PRESENCES = 5000;


const keys = [
  'afk_channel_id',
  'afk_timeout',
  'application_id',
  'banner',
  'channels',
  'default_message_notifications',
  'description',
  'embed_channel_id',
  'embed_enabled',
  'emojis',
  'explicit_content_filter',
  'features',
  'icon',
  'id',
  'joined_at',
  'large',
  'lazy',
  'max_members',
  'max_presences',
  'member_count',
  'members',
  'mfa_level',
  'name',
  'owner_id',
  'preferred_locale',
  'premium_subscription_count',
  'premium_tier',
  'presences',
  'region',
  'roles',
  'splash',
  'system_channel_flags',
  'system_channel_id',
  'unavailable',
  'vanity_url_code',
  'verification_level',
  'voice_states',
  'widget_channel_id',
  'widget_enabled',
];

const ignoreKeys = [
  'channels',
  'emojis',
  'joined_at',
  'max_presences',
  'members',
  'presences',
  'premium_subscription_count',
  'roles',
  'voice_states',
];

const skipKeys = ['id', 'roles', 'members'];

/**
 * Guild Structure
 * @category Structure
 */
export class Guild extends BaseStructure {
  _defaultKeys = keys;
  _ignoreKeys = ignoreKeys;
  readonly roles = new BaseCollection<string, null | Role>();

  afkChannelId: null | string = null;
  afkTimeout: number = 0;
  applicationId: null | string = null;
  banner: null | string = null;
  defaultMessageNotifications: number = 0;
  description: null | string = null;
  embedChannelId: null | string = null;
  embedEnabled: boolean = false;
  explicitContentFilter: number = 0;
  features!: Set<string>;
  icon: null | string = null;
  id: string = '';
  joinedAt: Date | null = null;
  maxMembers: number = 0;
  maxPresences: number = DEFAULT_MAX_PRESENCES;
  memberCount: number = 0;
  mfaLevel: number = 0;
  name: string = '';
  ownerId: string = '';
  preferredLocale: string = 'en-US';
  premiumSubscriptionCount: number = 0;
  premiumTier: number = 0;
  region: string = '';
  splash: null | string = '';
  systemChannelFlags: number = 0;
  systemChannelId: null | string = null;
  unavailable: boolean = false;
  vanityUrlCode: null | string = null;
  verificationLevel: number = 0;
  widgetChannelId: null | string = null;
  widgetEnabled: boolean = false;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get acronym(): string {
    return getAcronym(this.name);
  }

  get afkChannel(): Channel | null {
    if (this.afkChannelId !== null) {
      return this.client.channels.get(this.afkChannelId) || null;
    }
    return null;
  }

  get bannerUrl(): null | string {
    return null;
  }

  get channels(): BaseCollection<string, Channel> {
    return new BaseCollection(this.client.channels.filter((channel: Channel) => channel.guildId === this.id));
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

  get emojis(): BaseCollection<string, Emoji> {
    return new BaseCollection(this.client.emojis.filter((emoji: Emoji) => emoji.guildId === this.id));
  }

  get joinedAtUnix(): null | number {
    return this.joinedAt && this.joinedAt.getTime();
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
    if (this.client.user !== null) {
      return (<Member | undefined> this.client.members.get(this.id, this.client.user.id)) || null;
    }
    return null;
  }

  get members(): MembersCache | null {
    return this.client.members.get(this.id) || null;
  }

  get owner(): null | User {
    return this.client.users.get(this.ownerId) || null;
  }

  get presences(): null | PresencesCache {
    return this.client.presences.get(this.id) || null;
  }

  get splashUrl(): null | string {
    return null;
  }

  get systemChannel(): Channel | null {
    if (this.systemChannelId !== null) {
      return this.client.channels.get(this.systemChannelId) || null;
    }
    return null;
  }

  get voiceStates(): null | VoiceStatesCache {
    return this.client.voiceStates.get(this.id) || null;
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    member?: Member,
    options: {
      ignoreAdministrator?: boolean,
      ignoreOwner?: boolean,
    } = {},
  ): boolean {
    const ignoreAdministrator = !!options.ignoreAdministrator;
    const ignoreOwner = !!options.ignoreOwner;

    if (!ignoreOwner) {
      let memberId: string;
      if (member == undefined) {
        if (this.client.user === null) {
          throw new Error('Provide a member object please');
        }
        memberId = this.client.user.id;
      } else {
        memberId = member.id;
      }
      if (this.isOwner(memberId)) {
        return true;
      }
    }

    if (member == undefined) {
      const me = this.me;
      if (me === null) {
        throw new Error('Provide a member object please');
      }
      member = me;
    }

    if (member == undefined) {
      return false;
    }

    const total = member.permissions;
    if (!ignoreAdministrator && PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
      return true;
    }
    return PermissionTools.checkPermissions(total, permissions);
  }

  hasFeature(feature: string): boolean {
    return this.features.has(feature);
  }

  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  async ack() {
    return this.client.rest.ackGuild(this.id);
  }

  async addMember(userId: string, options: Options.AddGuildMember) {
    return this.client.rest.addGuildMember(this.id, userId, options);
  }

  async addMemberRole(userId: string, roleId: string) {
    return this.client.rest.addGuildMemberRole(this.id, userId, roleId);
  }

  async beginPrune(options: Options.BeginGuildPrune) {
    return this.client.rest.beginGuildPrune(this.id, options);
  }

  async createBan(userId: string, options: Options.CreateGuildBan) {
    return this.client.rest.createGuildBan(this.id, userId, options);
  }

  async createChannel(options: Options.CreateGuildChannel) {
    return this.client.rest.createGuildChannel(this.id, options);
  }

  async createEmoji(options: Options.CreateGuildEmoji) {
    return this.client.rest.createGuildEmoji(this.id, options);
  }

  async createIntegration(options: Options.CreateGuildIntegration) {
    return this.client.rest.createGuildIntegration(this.id, options);
  }

  async createRole(options: Options.CreateGuildRole) {
    return this.client.rest.createGuildRole(this.id, options);
  }


  async delete() {
    return this.client.rest.deleteGuild(this.id);
  }

  async deleteEmoji(emojiId: string) {
    return this.client.rest.deleteGuildEmoji(this.id, emojiId);
  }

  async deleteIntegration(integrationId: string) {
    return this.client.rest.deleteGuildIntegration(this.id, integrationId);
  }

  async deletePremiumSubscription(subscriptionId: string) {
    return this.client.rest.deleteGuildPremiumSubscription(this.id, subscriptionId);
  }

  async deleteRole(roleId: string) {
    return this.client.rest.deleteGuildRole(this.id, roleId);
  }


  async edit(options: Options.EditGuild) {
    return this.client.rest.editGuild(this.id, options);
  }

  async editChannel(channelId: string, options: Options.EditChannel) {
    return this.client.rest.editChannel(channelId, options);
  }

  async editChannelPositions(options: Options.EditGuildChannels) {
    return this.client.rest.editGuildChannels(this.id, options);
  }

  async editEmbed(options: Options.EditGuildEmbed) {
    return this.client.rest.editGuildEmbed(this.id, options);
  }

  async editEmoji(emojiId: string, options: Options.EditGuildEmoji) {
    return this.client.rest.editGuildEmoji(this.id, emojiId, options);
  }

  async editIntegration(integrationId: string, options: Options.EditGuildIntegration) {
    return this.client.rest.editGuildIntegration(this.id, integrationId, options);
  }

  async editMember(userId: string, options: Options.EditGuildMember) {
    return this.client.rest.editGuildMember(this.id, userId, options);
  }

  async editMfaLevel(options: Options.EditGuildMfaLevel) {
    return this.client.rest.editGuildMfaLevel(this.id, options);
  }

  async editNick(nick: string, userId: string = '@me') {
    return this.client.rest.editGuildNick(this.id, nick, userId);
  }

  async editRole(roleId: string, options: Options.EditGuildRole) {
    return this.client.rest.editGuildRole(this.id, roleId, options);
  }

  async editRolePositions(options: Options.EditGuildRolePositions) {
    return this.client.rest.editGuildRolePositions(this.id, options);
  }

  async editVanityUrl(code: string) {
    return this.client.rest.editGuildVanity(this.id, code);
  }


  async fetchApplications(channelId?: string) {
    return this.client.rest.fetchGuildApplications(this.id, channelId);
  }

  async fetchAuditLogs(options: Options.FetchGuildAuditLogs) {
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

  async fetchMembers(options: Options.FetchGuildMembers) {
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


  async join(options: Options.JoinGuild) {
    return this.client.rest.joinGuild(this.id, options);
  }

  async leave() {
    return this.client.rest.leaveGuild(this.id);
  }


  async removeBan(userId: string) {
    return this.client.rest.removeGuildBan(this.id, userId);
  }

  async removeMember(userId: string) {
    return this.client.rest.removeGuildMember(this.id, userId);
  }

  async removeMemberRole(userId: string, roleId: string) {
    return this.client.rest.removeGuildMemberRole(this.id, userId, roleId);
  }


  async search(options: Options.SearchOptions, retry?: boolean) {
    return this.client.rest.searchGuild(this.id, options, retry);
  }

  async syncIntegration(integrationId: string) {
    return this.client.rest.syncGuildIntegration(this.id, integrationId);
  }

  merge(data: BaseStructureData): void {
    for (let key in skipKeys) {
      if (data[key] !== undefined) {
        this.mergeValue(key, data[key]);
      }
    }
    super.merge.call(this, data, skipKeys);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'channels': {
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
        case 'emojis': {
          if (this.client.emojis.enabled) {
            for (let [id, emoji] of this.emojis) {
              if (!value.some((e: GatewayRawEvents.RawEmoji) => e.id === id)) {
                this.client.emojis.delete(id);
              }
            }
            for (let raw of value) {
              if (this.client.emojis.has(raw.id)) {
                (<Emoji> this.client.emojis.get(raw.id)).merge(raw);
              } else {
                raw.guild_id = this.id;
                this.client.emojis.insert(new Emoji(this.client, raw));
              }
            }
          }
        }; return;
        case 'features': {
          value = new Set(value);
        }; break;
        case 'joined_at': {
          value = new Date(value);
        }; break;
        case 'max_presences': {
          if (value === null) {
            value = DEFAULT_MAX_PRESENCES;
          }
        }; break;
        case 'members': {
          if (this.client.members.enabled || this.client.users.enabled) {
            if (this.client.members.has(this.id)) {
              (<MembersCache> this.client.members.get(this.id)).clear();
            }
            for (let raw of value) {
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
                  if (role === null) {
                    member.roles.set(roleId, this.roles.get(roleId) || null);
                  }
                }
              } else {
                if (this.client.users.has(raw.user.id)) {
                  (<User> this.client.users.get(raw.user.id)).merge(raw.user);
                } else {
                  this.client.users.insert(new User(this.client, raw.user));
                }
              }
            }
          }
        }; return;
        case 'roles': {
          for (let [roleId, role] of this.roles) {
            // remove any roles that's in cache but not in this new roles array
            if (role === null) {
              this.roles.delete(roleId);
            } else {
              if (!value.some((r: Role) => r.id === roleId)) {
                this.roles.delete(roleId);
              }
            }
          }
          for (let raw of value) {
            if (this.roles.has(raw.id)) {
              (<Role> this.roles.get(raw.id)).merge(raw);
            } else {
              raw.guild_id = this.id;
              this.roles.set(raw.id, new Role(this.client, raw));
            }
          }
        }; return;
        case 'premium_subscription_count': {
          if (value === null) {
            value = 0;
          }
        }; break;
        case 'presences': {
          if (this.client.presences.enabled) {
            if (this.client.presences.has(this.id)) {
              (<PresencesCache> this.client.presences.get(this.id)).clear();
            }
            for (let raw of value) {
              raw.guild_id = this.id;
              this.client.presences.add(raw);
            }
          }
        }; return;
        case 'voice_states': {
          if (this.client.voiceStates.enabled) {
            if (this.client.voiceStates.has(this.id)) {
              (<VoiceStatesCache> this.client.voiceStates.get(this.id)).clear();
            }
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
}
