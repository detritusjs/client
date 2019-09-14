import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, Permissions } from '../constants';
import { PermissionTools, Snowflake } from '../utils';

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
  DiscordKeys.ID,
  DiscordKeys.MANAGED,
  DiscordKeys.MENTIONABLE,
  DiscordKeys.NAME,
  DiscordKeys.PERMISSIONS,
  DiscordKeys.POSITION,
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
  managed: boolean = false;
  mentionable: boolean = false;
  name: string = '';
  permissions: number = 0;
  position: number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
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

  get isDefault(): boolean {
    return this.id === this.guildId;
  }

  get members(): BaseCollection<string, Member> {
    const collection = new BaseCollection<string, Member>();
    const guild = this.guild;
    const members = (guild) ? guild.members : null;
    if (members) {
      for (let [userId, member] of members) {
        if (member.roles.has(this.id)) {
          collection.set(userId, member);
        }
      }
    }
    return collection;
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

  permissionsFor(channelId: ChannelGuildBase | string): number {
    let channel: ChannelGuildBase;
    if (channelId instanceof ChannelGuildBase) {
      channel = channelId;
    } else {
      if (this.client.channels.has(channelId)) {
        channel = <ChannelGuildBase> this.client.channels.get(channelId);
      } else {
        return Permissions.NONE;
      }
    }

    let allow = 0;
    let deny = 0;
    if (channel.permissionOverwrites.has(this.id)) {
      const overwrite = <Overwrite> channel.permissionOverwrites.get(this.id);
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

  toString(): string {
    return this.mention;
  }
}
