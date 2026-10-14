import { Endpoints, RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, Permissions, PERMISSIONS_ALL, RoleFlags } from '../constants';
import {
  addQuery,
  getFormatFromHash,
  getQueryForImage,
  PermissionTools,
  Snowflake,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
} from './basestructure';
import { ChannelGuildBase } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { Overwrite } from './overwrite';


const keysRole = new BaseSet<string>([
  DiscordKeys.COLOR,
  DiscordKeys.COLORS,
  DiscordKeys.FLAGS,
  DiscordKeys.GUILD_ID,
  DiscordKeys.HOIST,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.MANAGED,
  DiscordKeys.MENTIONABLE,
  DiscordKeys.NAME,
  DiscordKeys.PERMISSIONS,
  DiscordKeys.POSITION,
  DiscordKeys.TAGS,
  DiscordKeys.UNICODE_EMOJI,
]);

export interface RoleColors {
  primaryColor: number,
  secondaryColor: null | number,
  tertiaryColor: null | number,
}

// accepts the raw snake_case object from discord or our camelCase one (from `differencesBetween()`)
function createRoleColors(value: any): RoleColors | null {
  if (!value) {
    return null;
  }
  return {
    primaryColor: value[DiscordKeys.PRIMARY_COLOR] ?? value.primaryColor ?? 0,
    secondaryColor: value[DiscordKeys.SECONDARY_COLOR] ?? value.secondaryColor ?? null,
    tertiaryColor: value[DiscordKeys.TERTIARY_COLOR] ?? value.tertiaryColor ?? null,
  };
}

/**
 * Guild Role Structure, used in [Guild]
 * @category Structure
 */
export class Role extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysRole); }

  color: number = 0;
  // role gradients, `secondaryColor` and `tertiaryColor` are null for a plain color
  colors: RoleColors | null = null;
  flags: number = 0;
  guildId: string = '';
  hoist: boolean = false;
  id: string = '';
  icon: null | string = null;
  managed: boolean = false;
  mentionable: boolean = false;
  name: string = '';
  permissions: bigint = Permissions.NONE;
  position: number = 0;
  tags: RoleTags | null = null;
  unicodeEmoji: null | string = null;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get botId(): null | string {
    if (this.tags && this.tags.botId) {
      return this.tags.botId;
    }
    return null;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get iconUrl(): null | string {
    return this.iconUrlFormat();
  }

  get integrationId(): null | string {
    if (this.tags && this.tags.integrationId) {
      return this.tags.integrationId;
    }
    return null;
  }

  get isBoosterRole(): boolean {
    if (this.tags) {
      return !!this.tags.premiumSubscriber;
    }
    return false;
  }

  get isDefault(): boolean {
    return this.id === this.guildId;
  }

  get isInPrompt(): boolean {
    return this.hasFlag(RoleFlags.IN_PROMPT);
  }

  get isPurchasable(): boolean {
    if (this.tags) {
      return !!this.tags.availableForPurchase;
    }
    return false;
  }

  get members(): BaseCollection<string, Member> {
    const guild = this.guild;
    const members = (guild) ? guild.members : null;
    if (members) {
      if (this.isDefault) {
        return members;
      }
      const collection = new BaseCollection<string, Member>();
      for (let [userId, member] of members) {
        if (member._roles && member._roles.includes(this.id)) {
          collection.set(userId, member);
        }
      }
      return collection;
    }
    return new BaseCollection<string, Member>();
  }

  get mention(): string {
    return `<@&${this.id}>`;
  }

  get subscriptionListingId(): null | string {
    if (this.tags && this.tags.subscriptionListingId) {
      return this.tags.subscriptionListingId;
    }
    return null;
  }

  can(
    permissions: PermissionTools.PermissionChecks,
    {ignoreAdministrator}: {ignoreAdministrator?: boolean} = {},
  ): boolean {
    if (!ignoreAdministrator && PermissionTools.checkPermissions(this.permissions, Permissions.ADMINISTRATOR)) {
      return true;
    }
    return PermissionTools.checkPermissions(this.permissions, permissions);
  }

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
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
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.ROLE_ICON(this.id, hash, format), query);
  }

  permissionsIn(
    channelId: ChannelGuildBase | string,
    {ignoreAdministrator}: {ignoreAdministrator?: boolean} = {},
  ): bigint {
    let channel: ChannelGuildBase;
    if (channelId instanceof ChannelGuildBase) {
      channel = channelId;
    } else {
      if (this.client.channels.has(channelId)) {
        channel = this.client.channels.get(channelId) as ChannelGuildBase;
      } else {
        return Permissions.NONE;
      }
    }

    let total = this.permissions;
    if (!this.isDefault) {
      const guild = this.guild;
      const everyone = (guild) ? guild.roles.get(this.guildId) : null;
      if (everyone) {
        total |= everyone.permissions;
      }
    }
    if (!ignoreAdministrator && PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
      return PERMISSIONS_ALL;
    }

    if (!this.isDefault && channel.permissionOverwrites.has(this.guildId)) {
      const overwrite = channel.permissionOverwrites.get(this.guildId)!;
      total = (total & ~overwrite.deny) | overwrite.allow;
    }
    if (channel.permissionOverwrites.has(this.id)) {
      const overwrite = channel.permissionOverwrites.get(this.id)!;
      total = (total & ~overwrite.deny) | overwrite.allow;
    }
    return total;
  }

  delete(options: RequestTypes.DeleteGuildRole = {}) {
    return this.client.rest.deleteGuildRole(this.guildId, this.id, options);
  }

  edit(options: RequestTypes.EditGuildRole) {
    return this.client.rest.editGuildRole(this.guildId, this.id, options);
  }

  editPosition(position: number, options?: RequestTypes.EditGuildRolePositionsExtra) {
    return this.client.rest.editGuildRolePositions(this.guildId, [{id: this.id, position}], options);
  }

  hasDifference(key: string, value: any): boolean {
    switch (key) {
      case DiscordKeys.COLORS: {
        if (value === undefined) {
          return false;
        }
        const old = this.colors;
        const colors = createRoleColors(value);
        if (!old || !colors) {
          return old !== colors;
        }
        return (
          old.primaryColor !== colors.primaryColor ||
          old.secondaryColor !== colors.secondaryColor ||
          old.tertiaryColor !== colors.tertiaryColor
        );
      };
    }
    return super.hasDifference(key, value);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    {
      // always merge in tags since it might not appear
      // we sometimes get `{}`
      const value = data[DiscordKeys.TAGS];

      let tags: RoleTags | null = null;
      if (value && Object.keys(value).length) {
        tags = new RoleTags(this.client, value);
      }
      (this as any)[DetritusKeys[DiscordKeys.TAGS]] = tags;
    }

    if (DiscordKeys.COLOR in data) {
      (this as any)[DetritusKeys[DiscordKeys.COLOR]] = data[DiscordKeys.COLOR];
    }
    if (DiscordKeys.COLORS in data) {
      this.colors = createRoleColors(data[DiscordKeys.COLORS]);
    }
    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.HOIST in data) {
      (this as any)[DetritusKeys[DiscordKeys.HOIST]] = data[DiscordKeys.HOIST];
    }
    if (DiscordKeys.ICON in data) {
      (this as any)[DetritusKeys[DiscordKeys.ICON]] = data[DiscordKeys.ICON];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.MANAGED in data) {
      (this as any)[DetritusKeys[DiscordKeys.MANAGED]] = data[DiscordKeys.MANAGED];
    }
    if (DiscordKeys.MENTIONABLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.MENTIONABLE]] = data[DiscordKeys.MENTIONABLE];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.PERMISSIONS in data) {
      const value = data[DiscordKeys.PERMISSIONS];
      (this as any)[DetritusKeys[DiscordKeys.PERMISSIONS]] = BigInt(value);
    }
    if (DiscordKeys.POSITION in data) {
      (this as any)[DetritusKeys[DiscordKeys.POSITION]] = data[DiscordKeys.POSITION];
    }
    if (DiscordKeys.UNICODE_EMOJI in data) {
      (this as any)[DetritusKeys[DiscordKeys.UNICODE_EMOJI]] = data[DiscordKeys.UNICODE_EMOJI];
    }
  }

  toJSON() {
    const data = super.toJSON() as any;
    // write `colors` back out in discord's shape so `clone()` round-trips
    if (this.colors) {
      data[DiscordKeys.COLORS] = {
        [DiscordKeys.PRIMARY_COLOR]: this.colors.primaryColor,
        [DiscordKeys.SECONDARY_COLOR]: this.colors.secondaryColor,
        [DiscordKeys.TERTIARY_COLOR]: this.colors.tertiaryColor,
      };
    }
    return data;
  }

  toString(): string {
    return this.name;
  }
}


const keysRoleTags = new BaseSet<string>([
  DiscordKeys.AVAILABLE_FOR_PURCHASE,
  DiscordKeys.BOT_ID,
  DiscordKeys.GUILD_CONNECTIONS,
  DiscordKeys.INTEGRATION_ID,
  DiscordKeys.PREMIUM_SUBSCRIBER,
  DiscordKeys.SUBSCRIPTION_LISTING_ID,
]);

/**
 * Guild Role Tags Structure, used in [Guild]
 * @category Structure
 */
export class RoleTags extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysRoleTags); }

  // `availableForPurchase`, `guildConnections`, and `premiumSubscriber` are sent as `null` when true and omitted when false
  availableForPurchase?: boolean;
  botId?: string;
  guildConnections?: boolean;
  integrationId?: string;
  premiumSubscriber?: boolean;
  subscriptionListingId?: string;

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

    (this as any)[DetritusKeys[DiscordKeys.AVAILABLE_FOR_PURCHASE]] = (DiscordKeys.AVAILABLE_FOR_PURCHASE in data) || undefined;
    (this as any)[DetritusKeys[DiscordKeys.BOT_ID]] = data[DiscordKeys.BOT_ID];
    (this as any)[DetritusKeys[DiscordKeys.GUILD_CONNECTIONS]] = (DiscordKeys.GUILD_CONNECTIONS in data) || undefined;
    (this as any)[DetritusKeys[DiscordKeys.INTEGRATION_ID]] = data[DiscordKeys.INTEGRATION_ID];
    (this as any)[DetritusKeys[DiscordKeys.PREMIUM_SUBSCRIBER]] = (DiscordKeys.PREMIUM_SUBSCRIBER in data) || undefined;
    (this as any)[DetritusKeys[DiscordKeys.SUBSCRIPTION_LISTING_ID]] = data[DiscordKeys.SUBSCRIPTION_LISTING_ID];
  }
}
