import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, IntegrationExpireBehaviors, Oauth2Scopes } from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
} from './basestructure';
import { Application } from './application';
import { User } from './user';


const keysIntegration = new BaseSet<string>([
  DiscordKeys.ACCOUNT,
  DiscordKeys.APPLICATION,
  DiscordKeys.ENABLED,
  DiscordKeys.ENABLE_EMOTICONS,
  DiscordKeys.EXPIRE_BEHAVIOR,
  DiscordKeys.EXPIRE_GRACE_PERIOD,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.REVOKED,
  DiscordKeys.ROLE_ID,
  DiscordKeys.SCOPES,
  DiscordKeys.SUBSCRIBER_COUNT,
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
  static { setStructureKeys(this, '_keys', keysIntegration); }

  account!: IntegrationAccount;
  application?: Application;
  enabled: boolean = false;
  enableEmoticons?: boolean;
  expireBehavior?: IntegrationExpireBehaviors;
  expireGracePeriod?: number;
  guildId: string = '';
  id: string = '';
  name: string = '';
  scopes?: Array<Oauth2Scopes>;
  revoked?: boolean;
  roleId?: string;
  subscriberCount?: number;
  syncedAt?: Date;
  syncing?: boolean;
  type: string = '';
  user?: User;

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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ACCOUNT in data) {
      const value = new IntegrationAccount(this, data[DiscordKeys.ACCOUNT]);
      (this as any)[DetritusKeys[DiscordKeys.ACCOUNT]] = value;
    }
    if (DiscordKeys.APPLICATION in data) {
      // todo: maybe use our own application object if its ours?
      const value = new Application(this.client, data[DiscordKeys.APPLICATION]);
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION]] = value;
    }
    if (DiscordKeys.ENABLED in data) {
      (this as any)[DetritusKeys[DiscordKeys.ENABLED]] = data[DiscordKeys.ENABLED];
    }
    if (DiscordKeys.ENABLE_EMOTICONS in data) {
      (this as any)[DetritusKeys[DiscordKeys.ENABLE_EMOTICONS]] = data[DiscordKeys.ENABLE_EMOTICONS];
    }
    if (DiscordKeys.EXPIRE_BEHAVIOR in data) {
      (this as any)[DetritusKeys[DiscordKeys.EXPIRE_BEHAVIOR]] = data[DiscordKeys.EXPIRE_BEHAVIOR];
    }
    if (DiscordKeys.EXPIRE_GRACE_PERIOD in data) {
      (this as any)[DetritusKeys[DiscordKeys.EXPIRE_GRACE_PERIOD]] = data[DiscordKeys.EXPIRE_GRACE_PERIOD];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.REVOKED in data) {
      (this as any)[DetritusKeys[DiscordKeys.REVOKED]] = data[DiscordKeys.REVOKED];
    }
    if (DiscordKeys.ROLE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ROLE_ID]] = data[DiscordKeys.ROLE_ID];
    }
    if (DiscordKeys.SCOPES in data) {
      (this as any)[DetritusKeys[DiscordKeys.SCOPES]] = data[DiscordKeys.SCOPES];
    }
    if (DiscordKeys.SUBSCRIBER_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.SUBSCRIBER_COUNT]] = data[DiscordKeys.SUBSCRIBER_COUNT];
    }
    if (DiscordKeys.SYNCED_AT in data) {
      const value = data[DiscordKeys.SYNCED_AT];
      (this as any)[DetritusKeys[DiscordKeys.SYNCED_AT]] = (value) ? new Date(value) : undefined;
    }
    if (DiscordKeys.SYNCING in data) {
      (this as any)[DetritusKeys[DiscordKeys.SYNCING]] = data[DiscordKeys.SYNCING];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.USER in data) {
      const value = data[DiscordKeys.USER];

      let user: User;
      if (this.isClone) {
        user = new User(this.client, value, this.isClone);
      } else {
        if (this.client.users.has(value.id)) {
          user = this.client.users.get(value.id) as User;
          user.merge(value);
        } else {
          user = new User(this.client, value);
        }
      }
      (this as any)[DetritusKeys[DiscordKeys.USER]] = user;
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
  readonly _uncloneable = true;
  static { setStructureKeys(this, '_keys', keysIntegrationAccount); }
  declare readonly integration: Integration;

  id: string = '';
  name: string = '';

  constructor(integration: Integration, data: BaseStructureData) {
    super(integration.client, undefined, integration._clone);
    Object.defineProperty(this, 'integration', {configurable: true, enumerable: false, writable: false, value: integration});
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
  }
}
