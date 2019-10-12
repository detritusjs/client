import { RequestTypes } from 'detritus-client-rest';

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
  DiscordKeys.DENY,
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Channel Overwrite Structure, used in [ChannelGuildBase] Structures
 * @category Structure
 */
export class Overwrite extends BaseStructure {
  readonly _keys = keysOverwrite;
  readonly channel: Channel;

  allow: number = 0;
  deny: number = 0;
  id: string = '';
  type: string = '';

  constructor(channel: Channel, data: BaseStructureData) {
    super(channel.client);
    this.channel = channel;
    this.merge(data);
    Object.defineProperty(this, 'channel', {enumerable: false});
  }

  get channelId(): string {
    return this.channel.id;
  }

  get guild(): Guild | null {
    return this.channel.guild;
  }

  get guildId(): string {
    return <string> this.channel.guildId;
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
      if (guild) {
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

  edit(options: RequestTypes.EditChannelOverwrite = {}) {
    return this.client.rest.editChannelOverwrite(this.channelId, this.id, {
      allow: options.allow,
      deny: options.deny,
      reason: options.reason,
      type: this.type,
    });
  }
}
