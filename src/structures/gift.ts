import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
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
  readonly _keys = keysGift;
  readonly _keysMerge = keysMergeGift;

  applicationId: string = '';
  code: string = '';
  expiresAt!: Date;
  maxUses: number = 0;
  redeemed: boolean = false;
  skuId: string = '';
  storeListing?: StoreListing;
  subscriptionPlan?: SubscriptionPlan;
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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.EXPIRES_AT: {
          value = new Date(value);
        }; break;
        case DiscordKeys.STORE_LISTING: {
          value = new StoreListing(this.client, value);
        }; break;
        case DiscordKeys.SUBSCRIPTION_PLAN: {
          value = new SubscriptionPlan(this.client, value, this.isClone);
          this.subscriptionPlanId = value.id;
        }; break;
        case DiscordKeys.USER: {
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
          value = user;
        }; break;
      }
      return super.mergeValue(key, value);
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
  readonly _keys = keysSubscriptionPlan;

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
}
