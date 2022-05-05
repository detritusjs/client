import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../collections/baseset';
import { ShardClient } from '../client';
import {
  DetritusKeys,
  DiscordKeys,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { User } from './user';


const keysGuildBan = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
  DiscordKeys.REASON,
  DiscordKeys.USER,
]);

/**
 * Guild Ban Structure
 * @category Structure
 */
export class GuildBan extends BaseStructure {
  readonly _keys = keysGuildBan;

  guildId: string = '';
  reason: string | null = null;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  remove(options: RequestTypes.RemoveGuildBan = {}) {
    return this.client.rest.removeGuildBan(this.guildId, this.user.id, options);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.REASON in data) {
      (this as any)[DetritusKeys[DiscordKeys.REASON]] = data[DiscordKeys.REASON];
    }
    if (DiscordKeys.USER in data) {
      const value = data[DiscordKeys.USER];

      let user: User;
      if (this.client.users.has(value.id)) {
        user = this.client.users.get(value.id)!;
        user.merge(value);
      } else {
        user = new User(this.client, value);
        // maybe insert?
      }
      (this as any)[DetritusKeys[DiscordKeys.USER]] = user;
    }
  }
}
