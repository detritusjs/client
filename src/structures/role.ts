import { Endpoints, RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, Permissions } from '../constants';
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
} from './basestructure';
import { ChannelGuildBase } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { Overwrite } from './overwrite';


const keysRole = new BaseSet<string>([
  DiscordKeys.COLOR,
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

/**
 * Guild Role Structure, used in [Guild]
 * @category Structure
 */
export class Role extends BaseStructure {
  readonly _keys = keysRole;

  color: number = 0;
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
      return this.tags.premiumSubscriber;
    }
    return false;
  }

  get isDefault(): boolean {
    return this.id === this.guildId;
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

  can(
    permissions: PermissionTools.PermissionChecks,
    {ignoreAdministrator}: {ignoreAdministrator?: boolean} = {},
  ): boolean {
    if (!ignoreAdministrator && PermissionTools.checkPermissions(this.permissions, Permissions.ADMINISTRATOR)) {
      return true;
    }
    return PermissionTools.checkPermissions(this.permissions, permissions);
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

  permissionsIn(channelId: ChannelGuildBase | string): bigint {
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

    let allow = Permissions.NONE, deny = Permissions.NONE;
    if (channel.permissionOverwrites.has(this.id)) {
      const overwrite = channel.permissionOverwrites.get(this.id)!;
      allow |= overwrite.allow;
      deny |= overwrite.deny;
    }
    return (this.permissions & ~deny) | allow;
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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    {
      // always merge in tags since it might not appear
      const value = data[DiscordKeys.TAGS];
      (this as any)[DetritusKeys[DiscordKeys.TAGS]] = (value) ? new RoleTags(this.client, value) : null;
    }

    if (DiscordKeys.COLOR in data) {
      (this as any)[DetritusKeys[DiscordKeys.COLOR]] = data[DiscordKeys.COLOR];
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

  toString(): string {
    return this.name;
  }
}


const keysRoleTags = new BaseSet<string>([
  DiscordKeys.BOT_ID,
  DiscordKeys.INTEGRATION_ID,
  DiscordKeys.PREMIUM_SUBSCRIBER,
]);

/**
 * Guild Role Tags Structure, used in [Guild]
 * @category Structure
 */
export class RoleTags extends BaseStructure {
  readonly _keys = keysRoleTags;

  botId?: string;
  integrationId?: string;
  premiumSubscriber: boolean = false;

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    (this as any)[DetritusKeys[DiscordKeys.BOT_ID]] = data[DiscordKeys.BOT_ID];
    (this as any)[DetritusKeys[DiscordKeys.INTEGRATION_ID]] = data[DiscordKeys.INTEGRATION_ID];
    (this as any)[DetritusKeys[DiscordKeys.PREMIUM_SUBSCRIBER]] = (DiscordKeys.PREMIUM_SUBSCRIBER in data);
  }
}
