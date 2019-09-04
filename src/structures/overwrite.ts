import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, OverwriteTypes } from '../constants';
import { PermissionTools } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { Role } from './role';


const keysOverwrite = new BaseSet<string>([
  DiscordKeys.ALLOW,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.DENY,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Channel Overwrite Structure, used in [ChannelGuildBase] Structures
 * @category Structure
 */
export class Overwrite extends BaseStructure {
  readonly _keys = keysOverwrite;

  allow: number = 0;
  channelId: string = '';
  deny: number = 0;
  guildId: string = '';
  id: string = '';
  type: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) || null;
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get isMember(): boolean {
    return this.type === OverwriteTypes.MEMBER;
  }

  get isRole(): boolean {
    return this.type === OverwriteTypes.ROLE;
  }

  get member(): Member | null {
    if (this.isMember) {
      return this.client.members.get(this.guildId, this.id) || null;
    }
    return null;
  }

  get role(): null | Role {
    if (this.isRole) {
      const guild = this.guild;
      if (guild !== null) {
        return guild.roles.get(this.id) || null;
      }
    }
    return null;
  }

  can(permissions: PermissionTools.PermissionChecks): boolean {
    if (!PermissionTools.checkPermissions(this.deny, permissions)) {
      return PermissionTools.checkPermissions(this.allow, permissions);
    }
    return false;
  }

  delete() {
    return this.client.rest.deleteChannelOverwrite(this.channelId, this.id);
  }

  edit(
    options: {
      allow?: number,
      deny?: number,
    } = {},
  ) {
    return this.client.rest.editChannelOverwrite(this.channelId, this.id, {
      allow: options.allow,
      deny: options.deny,
      type: this.type,
    });
  }
}
