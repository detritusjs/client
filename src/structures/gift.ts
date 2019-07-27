import {
  Endpoints,
  Types as Options,
} from 'detritus-client-rest';

import { ShardClient } from '../client';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { StoreListing } from './store';
import { User } from './user';


const keys = [
  'application_id',
  'code',
  'expires_at',
  'max_uses',
  'redeemed',
  'sku_id',
  'store_listing',
  'subscription_plan',
  'subscription_plan_id',
  'user',
  'uses',
];

const skipKeys = ['subscription_plan'];

export class Gift extends BaseStructure {
  _defaultKeys = keys;

  applicationId: string = '';
  code: string = '';
  expiresAt!: Date;
  maxUses: number = 0;
  redeemed: boolean = false;
  skuId: string = '';
  storeListing: any;
  subscriptionPlan: any;
  subscriptionPlanId: string = '';
  uses: number = 0;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get longUrl(): string {
    return Endpoints.Gift.LONG(this.code);
  }

  get url(): string {
    return Endpoints.Gift.SHORT(this.code);
  }

  fetch(options: Options.FetchGiftCode) {
    return this.client.rest.fetchGiftCode(this.code, options);
  }

  redeem(options: Options.RedeemGiftCode) {
    return this.client.rest.redeemGiftCode(this.code, options);
  }

  merge(data: BaseStructureData): void {
    if ('subscription_plan' in data) {
      this.mergeValue('subscription_plan', data.subscription_plan);
    }
    return super.merge.call(this, data, skipKeys);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'expires_at': {
          value = new Date(value);
        }; break;
        case 'store_listing': {
          value = new StoreListing(this.client, value);
        }; break;
        case 'subscription_plan': {
          value = new SubscriptionPlan(this.client, value);
          this.subscriptionPlanId = value.id;
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


const keysSubscriptionPlan = [
  'currency',
  'id',
  'interval',
  'interval_count',
  'name',
  'price',
  'sku_id',
  'tax_inclusive',
];

export class SubscriptionPlan extends BaseStructure {
  _defaultKeys = keysSubscriptionPlan;
  currency: string = 'usd';
  id: string = '';
  interval: number = 0;
  intervalCount: number = 0;
  name: string = '';
  price: number = 0;
  skuId: string = '';
  taxInclusive: boolean = false;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}
