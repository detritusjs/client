import { ShardClient } from '../client';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { User } from './user';


const keys = [
  'ended',
  'guild_id',
  'id',
  'user_id',
];

/**
 * Premium Subscription Structure, details a user's nitro boost on the server
 * ATM, only non-bots will ever see these
 * @category Structure
 */
export class PremiumSubscription extends BaseStructure {
  _defaultKeys = keys;
  ended: boolean = false;
  guildId: string = '';
  id: string = '';
  userId: string = '';

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

  get user(): User | null {
    return this.client.users.get(this.userId) || null;
  }
}
