import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  SubscriptionStatusTypes,
} from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User } from './user';


const keysSubscription = new BaseSet<string>([
  DiscordKeys.CANCELED_AT,
  DiscordKeys.COUNTRY,
  DiscordKeys.CURRENT_PERIOD_END,
  DiscordKeys.CURRENT_PERIOD_START,
  DiscordKeys.ENTITLEMENT_IDS,
  DiscordKeys.ID,
  DiscordKeys.RENEWAL_SKU_IDS,
  DiscordKeys.SKU_IDS,
  DiscordKeys.STATUS,
  DiscordKeys.USER_ID,
]);

/**
 * Subscription Structure
 * @category Structure
 */
export class Subscription extends BaseStructure {
  readonly _keys = keysSubscription;

  canceledAtUnix: number = 0;
  // only present when fetched with a private oauth2 scope
  country?: string;
  currentPeriodEndUnix: number = 0;
  currentPeriodStartUnix: number = 0;
  entitlementIds: Array<string> = [];
  id: string = '';
  renewalSkuIds: Array<string> | null = null;
  skuIds: Array<string> = [];
  status: SubscriptionStatusTypes = SubscriptionStatusTypes.ACTIVE;
  userId: string = '';

  constructor(client: ShardClient, data?: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get canceledAt(): Date | null {
    if (this.canceledAtUnix) {
      return new Date(this.canceledAtUnix);
    }
    return null;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get currentPeriodEnd(): Date {
    return new Date(this.currentPeriodEndUnix);
  }

  get currentPeriodStart(): Date {
    return new Date(this.currentPeriodStartUnix);
  }

  get isActive(): boolean {
    return this.status === SubscriptionStatusTypes.ACTIVE;
  }

  get user(): User | null {
    return this.client.users.get(this.userId) || null;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CANCELED_AT in data) {
      const value = data[DiscordKeys.CANCELED_AT];
      this.canceledAtUnix = (value) ? Date.parse(value) : 0;
    }
    if (DiscordKeys.COUNTRY in data) {
      (this as any)[DetritusKeys[DiscordKeys.COUNTRY]] = data[DiscordKeys.COUNTRY];
    }
    if (DiscordKeys.CURRENT_PERIOD_END in data) {
      const value = data[DiscordKeys.CURRENT_PERIOD_END];
      this.currentPeriodEndUnix = (value) ? Date.parse(value) : 0;
    }
    if (DiscordKeys.CURRENT_PERIOD_START in data) {
      const value = data[DiscordKeys.CURRENT_PERIOD_START];
      this.currentPeriodStartUnix = (value) ? Date.parse(value) : 0;
    }
    if (DiscordKeys.ENTITLEMENT_IDS in data) {
      (this as any)[DetritusKeys[DiscordKeys.ENTITLEMENT_IDS]] = data[DiscordKeys.ENTITLEMENT_IDS];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.RENEWAL_SKU_IDS in data) {
      (this as any)[DetritusKeys[DiscordKeys.RENEWAL_SKU_IDS]] = data[DiscordKeys.RENEWAL_SKU_IDS];
    }
    if (DiscordKeys.SKU_IDS in data) {
      (this as any)[DetritusKeys[DiscordKeys.SKU_IDS]] = data[DiscordKeys.SKU_IDS];
    }
    if (DiscordKeys.STATUS in data) {
      (this as any)[DetritusKeys[DiscordKeys.STATUS]] = data[DiscordKeys.STATUS];
    }
    if (DiscordKeys.USER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER_ID]] = data[DiscordKeys.USER_ID];
    }
  }
}
