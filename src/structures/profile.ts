import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { ConnectedAccount } from './connectedaccount';
import { Guild } from './guild';
import { User } from './user';


const keysProfile = new BaseSet<string>([
  'connected_accounts',
  'mutual_guilds',
  'premium_guild_since',
  'premium_since',
  'user',
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
        case 'connectedAccounts': {
          this.connectedAccounts.clear();
          for (let raw of value) {
            const connectedAccount = new ConnectedAccount(this.client, raw);
            this.connectedAccounts.set(connectedAccount.id, connectedAccount);
          }
        }; return;
        case 'mutualGuilds': {
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
        case 'premiumGuildSince': {
          if (value !== null) {
            value = new Date(value);
          }
        }; break;
        case 'premiumSince': {
          if (value !== null) {
            value = new Date(value);
          }
        }; break;
        case 'user': {
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
