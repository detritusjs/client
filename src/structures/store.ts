import { ShardClient } from '../client';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Application } from './application';


const keys = [
  'id',
  'sku',
  'summary',
  'thumbnail',
];

/**
 * Store Listing Structure
 * Used for Store Channels ([ChannelGuildStore])
 * @category Structure
 */
export class StoreListing extends BaseStructure {
  _defaultKeys = keys;

  id: string = '';
  sku!: Sku;
  summary: string = '';
  thumbnail!: StoreListingThumbnail;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'sku': {
          value = new Sku(this.client, value);
        }; break;
        case 'thumbnail': {
          value = new StoreListingThumbnail(this, value);
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}


const keysStoreListingThumbnail = [
  'height',
  'id',
  'mime_type',
  'size',
  'width',
];

/**
 * Store Listing Thumbnail Structure, used in [StoreListing]
 * @category Structure
 */
export class StoreListingThumbnail extends BaseStructure {
  _defaultKeys = keysStoreListingThumbnail;
  readonly storeListing: StoreListing;

  height: number = 0;
  id: string = '';
  mimeType: string = '';
  size: number = 0;
  width: number = 0;

  constructor(storeListing: StoreListing, data: BaseStructureData) {
    super(storeListing.client);
    this.storeListing = storeListing;
    this.merge(data);
    Object.defineProperty(this, 'storeListing', {enumerable: false, writable: false});
  }
}


const keysSku = [
  'access_type',
  'application',
  'application_id',
  'dependent_sku_id',
  'features',
  'flags',
  'id',
  'manifest_labels',
  'name',
  'premium',
  'release_date',
  'show_age_gate',
  'slug',
  'type',
];

const skipKeysSku = ['application'];

/**
 * Sku Structure, used in [Gift] and [StoreListing]
 * @category Structure
 */
export class Sku extends BaseStructure {
  _defaultKeys = keysSku;

  accessType: number = 0;
  application: Application | null = null;
  applicationId: string = '';
  dependentSkuId: null | string = null;
  features: Array<string> = [];
  flags: number = 0;
  id: string = '';
  manifestLabels: Array<any> | null = null;
  name: string = '';
  premium: null = null;
  releaseDate: null | string = null;
  showAgeGate: boolean = false;
  slug: string = '';
  type: number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  merge(data: BaseStructureData): void {
    if ('application' in data) {
      this.mergeValue('application', data.application);
    }
    return super.merge.call(this, data, skipKeysSku);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'application_id': {
          if (this.application === null) {
            if (this.client.applications.has(value)) {
              this.application = <Application> this.client.applications.get(value);
            }
          }
        }; break;
        case 'application': {
          let application: Application;
          if (this.client.applications.has(value.id)) {
            application = <Application> this.client.applications.get(value.id);
            application.merge(value);
          } else {
            application = new Application(this.client, value);
          }
          value = application;
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}
