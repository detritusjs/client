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
import { User } from './user';


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
  mutualGuilds = new BaseCollection<string, Guild | null>();
  nicks = new BaseCollection<string, string>();
  premiumGuildSince: Date | null = null;
  premiumSince: Date | null = null;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.CONNECTED_ACCOUNTS: {
          this.connectedAccounts.clear();
          for (let raw of value) {
            const connectedAccount = new ConnectedAccount(this.client, raw);
            this.connectedAccounts.set(connectedAccount.id, connectedAccount);
          }
        }; return;
        case DiscordKeys.MUTUAL_GUILDS: {
          this.mutualGuilds.clear();
          for (let raw of value) {
            if (this.client.guilds.has(raw.id)) {
              const guild = <Guild> this.client.guilds.get(raw.id);
              this.mutualGuilds.set(guild.id, guild);
            } else {
              this.mutualGuilds.set(raw.id, null);
            }
          }
        }; return;
        case DiscordKeys.PREMIUM_GUILD_SINCE: {
          if (value) {
            value = new Date(value);
          }
        }; break;
        case DiscordKeys.PREMIUM_SINCE: {
          if (value) {
            value = new Date(value);
          }
        }; break;
        case DiscordKeys.USER: {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = <User> this.client.users.get(value.id);
            user.merge(value);
          } else {
            user = new User(this.client, value);
          }
          value = user;
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}
