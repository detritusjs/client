import { Client as ShardClient } from '../client';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User } from './user';


const keys = [
  'account',
  'enabled',
  'expire_behavior',
  'expire_grace_period',
  'guild_id',
  'id',
  'name',
  'role_id',
  'synced_at',
  'syncing',
  'type',
  'user',
];

export class Integration extends BaseStructure {
  _defaultKeys = keys;
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
        case 'account': {
          value = new IntegrationAccount(this, value);
        }; break;
        case 'synced_at': {
          value = new Date(value);
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


const keysIntegrationAccount = [
  'id',
  'name',
];

export class IntegrationAccount extends BaseStructure {
  _defaultKeys = keysIntegrationAccount;
  integration: Integration;

  id: string = '';
  name: string = '';

  constructor(integration: Integration, data: BaseStructureData) {
    super(integration.client);
    this.integration = integration;
    this.merge(data);
    Object.defineProperty(this, 'integration', {enumerable: false, writable: false});
  }
}
