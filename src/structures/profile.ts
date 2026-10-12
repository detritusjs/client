import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';

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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CONNECTED_ACCOUNTS in data) {
      this.connectedAccounts.clear();
      for (let raw of data[DiscordKeys.CONNECTED_ACCOUNTS]) {
        const account = new ConnectedAccount(this.client, raw);
        this.connectedAccounts.set(account.key, account);
      }
    }
    if (DiscordKeys.MUTUAL_GUILDS in data) {
      this.mutualGuilds.clear();
      for (let raw of data[DiscordKeys.MUTUAL_GUILDS]) {
        this.mutualGuilds.set(raw.id, raw);
      }
    }
    if (DiscordKeys.PREMIUM_GUILD_SINCE in data) {
      const value = data[DiscordKeys.PREMIUM_GUILD_SINCE];
      this.premiumGuildSinceUnix = (value) ? (new Date(value)).getTime() : 0;
    }
    if (DiscordKeys.PREMIUM_SINCE in data) {
      const value = data[DiscordKeys.PREMIUM_SINCE];
      this.premiumSinceUnix = (value) ? (new Date(value)).getTime() : 0;
    }
    if (DiscordKeys.USER in data) {
      const value = new UserWithFlags(this.client, data[DiscordKeys.USER]);
      (this as any)[DetritusKeys[DiscordKeys.USER]] = value;
    }
  }
}
