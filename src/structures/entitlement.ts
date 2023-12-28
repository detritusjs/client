import { BaseSet } from '../collections/baseset';
import { ShardClient } from '../client';
import {
  DetritusKeys,
  DiscordKeys,
  EntitlementTypes,
} from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { User } from './user';


const keysEntitlement = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.DELETED,
  DiscordKeys.ENDS_AT,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.STARTS_AT,
  DiscordKeys.TYPE,
  DiscordKeys.USER_ID,
]);

/**
 * Entitlement Structure
 * @category Structure
 */
export class Entitlement extends BaseStructure {
  readonly _keys = keysEntitlement;

  applicationId: string = '';
  deleted: boolean = false;
  endsAtUnix: number = 0;
  guildId?: string;
  id: string = '';
  startsAtUnix: number = 0;
  type: number = EntitlementTypes.APPLICATION_SUBSCRIPTION;
  userId?: string;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get createdAt(): Date | null {
    const createdAtUnix = this.createdAtUnix;
    if (createdAtUnix !== null) {
      return new Date(createdAtUnix);
    }
    return null;
  }

  get createdAtUnix(): null | number {
    if (this.id) {
      return Snowflake.timestamp(this.id);
    }
    return null;
  }

  get ended(): boolean {
    if (this.endsAtUnix) {
      return this.endsAtUnix <= Date.now();
    }
    return false;;
  }

  get endsAt(): Date | null {
    if (this.endsAtUnix) {
      return new Date(this.endsAtUnix);
    }
    return null;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get started(): boolean {
    if (this.startsAtUnix) {
      return this.startsAtUnix <= Date.now();
    }
    return true;
  }

  get startsAt(): Date | null {
    if (this.startsAtUnix) {
      return new Date(this.startsAtUnix);
    }
    return null;
  }

  get user(): User | null {
    if (this.userId) {
      return this.client.users.get(this.userId) || null;
    }
    return null;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.APPLICATION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = data[DiscordKeys.APPLICATION_ID];
    }

    (this as any)[DetritusKeys[DiscordKeys.DELETED]] = !!data[DiscordKeys.DELETED];

    if (DiscordKeys.ENDS_AT in data) {
      const value = data[DiscordKeys.ENDS_AT];
      this.endsAtUnix = Date.parse(value);
    }

    (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID] || null;

    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }

    if (DiscordKeys.STARTS_AT in data) {
      const value = data[DiscordKeys.STARTS_AT];
      this.startsAtUnix = Date.parse(value);
    }

    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }

    if (DiscordKeys.USER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER_ID]] = data[DiscordKeys.USER_ID];
    }
  }

  toString(): string {
    return this.id;
  }
}
