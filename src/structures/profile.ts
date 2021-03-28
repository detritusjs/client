import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { ConnectedAccount } from './connectedaccount';
import { Guild } from './guild';
import { UserWithFlags } from './user';


const keysProfile = new BaseSet<string>([
  DiscordKeys.CONNECTED_ACCOUNTS,
  DiscordKeys.MUTUAL_GUILDS,
  DiscordKeys.PREMIUM_GUILD_SINCE,
  DiscordKeys.PREMIUM_SINCE,
  DiscordKeys.USER,
]);

/**
 * User Profile Structure
 * only non-bots will ever see these
 * @category Structure
 */
export class Profile extends BaseStructure {
  readonly _keys = keysProfile;

  connectedAccounts = new BaseCollection<string, ConnectedAccount>();
  mutualGuilds = new BaseCollection<string, {id: string, nick: null | string}>();
  nicks = new BaseCollection<string, string>();
  premiumGuildSinceUnix: number = 0;
  premiumSinceUnix: number = 0;
  user!: UserWithFlags;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get premiumGuildSince(): Date | null {
    if (this.premiumGuildSinceUnix) {
      return new Date(this.premiumGuildSinceUnix);
    }
    return null;
  }

  get premiumSince(): Date | null {
    if (this.premiumSinceUnix) {
      return new Date(this.premiumSinceUnix);
    }
    return null;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.CONNECTED_ACCOUNTS: {
          this.connectedAccounts.clear();
          for (let raw of value) {
            const account = new ConnectedAccount(this.client, raw);
            this.connectedAccounts.set(account.key, account);
          }
        }; return;
        case DiscordKeys.MUTUAL_GUILDS: {
          this.mutualGuilds.clear();
          for (let raw of value) {
            this.mutualGuilds.set(raw.id, raw);
          }
        }; return;
        case DiscordKeys.PREMIUM_GUILD_SINCE: {
          this.premiumGuildSinceUnix = (value) ? (new Date(value)).getTime() : 0;
        }; return;
        case DiscordKeys.PREMIUM_SINCE: {
          this.premiumSinceUnix = (value) ? (new Date(value)).getTime() : 0;
        }; return;
        case DiscordKeys.USER: {
          value = new UserWithFlags(this.client, value);
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
