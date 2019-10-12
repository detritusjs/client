import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User } from './user';


const keysIntegration = new BaseSet<string>([
  DiscordKeys.ACCOUNT,
  DiscordKeys.ENABLED,
  DiscordKeys.EXPIRE_BEHAVIOR,
  DiscordKeys.EXPIRE_GRACE_PERIOD,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.ROLE_ID,
  DiscordKeys.SYNCED_AT,
  DiscordKeys.SYNCING,
  DiscordKeys.TYPE,
  DiscordKeys.USER,
]);

/**
 * Guild Integration Structure
 * @category Structure
 */
export class Integration extends BaseStructure {
  readonly _keys = keysIntegration;

  account!: IntegrationAccount;
  enabled: boolean = false;
  expireBehavior: number = 0;
  expireGracePeriod: number = 0;
  guildId: string = '';
  id: string = '';
  name: string = '';
  roleId: string = '';
  syncedAt!: Date;
  syncing: boolean = false;
  type: string = '';
  user!: User;

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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.ACCOUNT: {
          value = new IntegrationAccount(this, value);
        }; break;
        case DiscordKeys.SYNCED_AT: {
          value = new Date(value);
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
      return super.mergeValue(key, value);
    }
  }
}


const keysIntegrationAccount = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.NAME,
]);

/**
 * Guild Integration Account Structure, used in [[Integration]]
 * @category Structure
 */
export class IntegrationAccount extends BaseStructure {
  readonly _keys = keysIntegrationAccount;
  readonly integration: Integration;

  id: string = '';
  name: string = '';

  constructor(integration: Integration, data: BaseStructureData) {
    super(integration.client);
    this.integration = integration;
    this.merge(data);
    Object.defineProperty(this, 'integration', {enumerable: false, writable: false});
  }
}
