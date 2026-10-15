import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
} from './basestructure';
import { StoreListing } from './store';
import { User } from './user';


const keysGift = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.CODE,
  DiscordKeys.EXPIRES_AT,
  DiscordKeys.MAX_USES,
  DiscordKeys.REDEEMED,
  DiscordKeys.SKU_ID,
  DiscordKeys.STORE_LISTING,
  DiscordKeys.SUBSCRIPTION_PLAN,
  DiscordKeys.SUBSCRIPTION_PLAN_ID,
  DiscordKeys.USER,
  DiscordKeys.USES,
]);

const keysMergeGift = new BaseSet<string>([
  DiscordKeys.SUBSCRIPTION_PLAN,
]);

/**
 * Discord Nitro Gift Structure
 * @category Structure
 */
export class Gift extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysGift); }
  static { setStructureKeys(this, '_keysMerge', keysMergeGift); }

  applicationId: string = '';
  code: string = '';
  // null when the gift never expires
  expiresAt: Date | null = null;
  maxUses: number = 0;
  redeemed: boolean = false;
  skuId: string = '';
  declare storeListing?: StoreListing;
  declare subscriptionPlan?: SubscriptionPlan;
  subscriptionPlanId: string = '';
  uses: number = 0;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get longUrl(): string {
    return Endpoints.Gift.LONG(this.code);
  }

  get url(): string {
    return Endpoints.Gift.SHORT(this.code);
  }

  fetch(options: RequestTypes.FetchGiftCode) {
    return this.client.rest.fetchGiftCode(this.code, options);
  }

  redeem(options: RequestTypes.RedeemGiftCode) {
    return this.client.rest.redeemGiftCode(this.code, options);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.SUBSCRIPTION_PLAN in data) {
      const value = new SubscriptionPlan(this.client, data[DiscordKeys.SUBSCRIPTION_PLAN], this.isClone);
      this.subscriptionPlanId = value.id;
      (this as any)[DetritusKeys[DiscordKeys.SUBSCRIPTION_PLAN]] = value;
    }
    if (DiscordKeys.APPLICATION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = data[DiscordKeys.APPLICATION_ID];
    }
    if (DiscordKeys.CODE in data) {
      (this as any)[DetritusKeys[DiscordKeys.CODE]] = data[DiscordKeys.CODE];
    }
    if (DiscordKeys.EXPIRES_AT in data) {
      // `new Date(null)` would be 1970, making a gift with no expiry look expired
      const value = (data[DiscordKeys.EXPIRES_AT]) ? new Date(data[DiscordKeys.EXPIRES_AT]) : null;
      (this as any)[DetritusKeys[DiscordKeys.EXPIRES_AT]] = value;
    }
    if (DiscordKeys.MAX_USES in data) {
      (this as any)[DetritusKeys[DiscordKeys.MAX_USES]] = data[DiscordKeys.MAX_USES];
    }
    if (DiscordKeys.REDEEMED in data) {
      (this as any)[DetritusKeys[DiscordKeys.REDEEMED]] = data[DiscordKeys.REDEEMED];
    }
    if (DiscordKeys.SKU_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.SKU_ID]] = data[DiscordKeys.SKU_ID];
    }
    if (DiscordKeys.STORE_LISTING in data) {
      const value = new StoreListing(this.client, data[DiscordKeys.STORE_LISTING]);
      (this as any)[DetritusKeys[DiscordKeys.STORE_LISTING]] = value;
    }
    if (DiscordKeys.SUBSCRIPTION_PLAN_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.SUBSCRIPTION_PLAN_ID]] = data[DiscordKeys.SUBSCRIPTION_PLAN_ID];
    }
    if (DiscordKeys.USER in data) {
      const value = data[DiscordKeys.USER];

      let user: User;
      if (this.isClone) {
        user = new User(this.client, value);
      } else {
        if (this.client.users.has(value.id)) {
          user = this.client.users.get(value.id) as User
          user.merge(value);
        } else {
          user = new User(this.client, value);
        }
      }
      (this as any)[DetritusKeys[DiscordKeys.USER]] = user;
    }
    if (DiscordKeys.USES in data) {
      (this as any)[DetritusKeys[DiscordKeys.USES]] = data[DiscordKeys.USES];
    }
  }
}


const keysSubscriptionPlan = new BaseSet<string>([
  DiscordKeys.CURRENCY,
  DiscordKeys.ID,
  DiscordKeys.INTERVAL,
  DiscordKeys.INTERVAL_COUNT,
  DiscordKeys.NAME,
  DiscordKeys.PRICE,
  DiscordKeys.SKU_ID,
  DiscordKeys.TAX_INCLUSIVE,
]);

/**
 * Subscription Plan, used in [[Gift]]
 * @category Structure
 */
export class SubscriptionPlan extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysSubscriptionPlan); }

  currency: string = 'usd';
  id: string = '';
  interval: number = 0;
  intervalCount: number = 0;
  name: string = '';
  price: number = 0;
  skuId: string = '';
  taxInclusive: boolean = false;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CURRENCY in data) {
      (this as any)[DetritusKeys[DiscordKeys.CURRENCY]] = data[DiscordKeys.CURRENCY];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.INTERVAL in data) {
      (this as any)[DetritusKeys[DiscordKeys.INTERVAL]] = data[DiscordKeys.INTERVAL];
    }
    if (DiscordKeys.INTERVAL_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.INTERVAL_COUNT]] = data[DiscordKeys.INTERVAL_COUNT];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.PRICE in data) {
      (this as any)[DetritusKeys[DiscordKeys.PRICE]] = data[DiscordKeys.PRICE];
    }
    if (DiscordKeys.SKU_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.SKU_ID]] = data[DiscordKeys.SKU_ID];
    }
    if (DiscordKeys.TAX_INCLUSIVE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TAX_INCLUSIVE]] = data[DiscordKeys.TAX_INCLUSIVE];
    }
  }
}
