import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
} from './basestructure';
import { Guild } from './guild';
import { User } from './user';


const keysPremiumSubscription = new BaseSet<string>([
  DiscordKeys.ENDED,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.USER_ID,
]);

/**
 * Premium Subscription Structure, details a user's nitro boost on the server
 * ATM, only non-bots will ever see these
 * @category Structure
 */
export class PremiumSubscription extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysPremiumSubscription); }

  ended: boolean = false;
  guildId: string = '';
  id: string = '';
  userId: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
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

  get user(): User | null {
    return this.client.users.get(this.userId) || null;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ENDED in data) {
      (this as any)[DetritusKeys[DiscordKeys.ENDED]] = data[DiscordKeys.ENDED];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.USER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER_ID]] = data[DiscordKeys.USER_ID];
    }
  }
}
