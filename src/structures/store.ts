import { Endpoints } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';
import {
  addQuery,
  getFormatFromHash,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Application } from './application';


const keysStore = new BaseSet<string>([
  DiscordKeys.ASSETS,
  DiscordKeys.BOX_ART,
  DiscordKeys.CAROUSEL_ITEMS,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.ENTITLEMENT_BRANCH_ID,
  DiscordKeys.HEADER_BACKGROUND,
  DiscordKeys.HEADER_LOGO_DARK_THEME,
  DiscordKeys.HEADER_LOGO_LIGHT_THEME,
  DiscordKeys.HERO_BACKGROUND,
  DiscordKeys.HERO_VIDEO,
  DiscordKeys.ID,
  DiscordKeys.PREVIEW_VIDEO,
  DiscordKeys.SKU,
  DiscordKeys.SUMMARY,
  DiscordKeys.TAGLINE,
  DiscordKeys.THUMBNAIL,
]);

/**
 * Store Listing Structure
 * Used for Store Channels ([ChannelGuildStore])
 * @category Structure
 */
export class StoreListing extends BaseStructure {
  readonly _keys = keysStore;

  assets = new BaseCollection<string, StoreListingAsset>();
  boxArt?: StoreListingAsset;
  carouselItems?: Array<{asset_id?: string, youtube_video_id?: string}>;
  description?: string;
  entitlementBranchId?: string;
  headerBackground?: StoreListingAsset;
  headerLogoDarkTheme?: StoreListingAsset;
  heroBackground?: StoreListingAsset;
  heroVideo?: StoreListingAsset;
  id: string = '';
  previewVideo?: StoreListingAsset;
  sku!: Sku;
  summary: string = '';
  tagline?: string;
  thumbnail!: StoreListingAsset;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get url(): string {
    return this.sku.url;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.ASSETS: {
          this.assets.clear();
          for (let raw of value) {
            this.assets.set(raw.id, new StoreListingAsset(this, raw));
          }
        }; return;
        case DiscordKeys.SKU: {
          value = new Sku(this.client, value);
        }; break;
        case DiscordKeys.BOX_ART:
        case DiscordKeys.HEADER_BACKGROUND:
        case DiscordKeys.HEADER_LOGO_DARK_THEME:
        case DiscordKeys.HEADER_LOGO_LIGHT_THEME:
        case DiscordKeys.HERO_BACKGROUND:
        case DiscordKeys.HERO_VIDEO:
        case DiscordKeys.PREVIEW_VIDEO:
        case DiscordKeys.THUMBNAIL: {
          value = new StoreListingAsset(this, value);
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysStoreListingAsset = new BaseSet<string>([
  DiscordKeys.HEIGHT,
  DiscordKeys.ID,
  DiscordKeys.MIME_TYPE,
  DiscordKeys.SIZE,
  DiscordKeys.WIDTH,
]);

/**
 * Store Listing Asset Structure, used in [StoreListing]
 * @category Structure
 */
export class StoreListingAsset extends BaseStructure {
  readonly _keys = keysStoreListingAsset;
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


const keysSku = new BaseSet<string>([
  DiscordKeys.ACCESS_TYPE,
  DiscordKeys.APPLICATION,
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.CONTENT_RATING,
  DiscordKeys.CONTENT_RATING_AGENCY,
  DiscordKeys.DEPENDENT_SKU_ID,
  DiscordKeys.FEATURES,
  DiscordKeys.FLAGS,
  DiscordKeys.GENRES,
  DiscordKeys.ID,
  DiscordKeys.LEGAL_NOTICE,
  DiscordKeys.LOCALES,
  DiscordKeys.MANIFEST_LABELS,
  DiscordKeys.NAME,
  DiscordKeys.PREMIUM,
  DiscordKeys.PRICE,
  DiscordKeys.RELEASE_DATE,
  DiscordKeys.SHOW_AGE_GATE,
  DiscordKeys.SLUG,
  DiscordKeys.SYSTEM_REQUIREMENTS,
  DiscordKeys.TYPE,
]);

/**
 * Sku Structure, used in [Gift] and [StoreListing]
 * @category Structure
 */
export class Sku extends BaseStructure {
  readonly _keys = keysSku;

  accessType: number = 0;
  application?: Application;
  applicationId: string = '';
  contentRating?: {descriptors: Array<number>, rating: number};
  contentRatingAgency: number = 0;
  dependentSkuId: null | string = null;
  features?: Array<number>;
  flags: number = 0;
  genres?: Array<number>;
  id: string = '';
  legalNotice: string = '';
  locales?: Array<string>;
  manifestLabels?: Array<any> | null;
  name: string = '';
  premium?: null;
  price?: {amount: number, currency: string};
  releaseDate?: null | string;
  showAgeGate: boolean = false;
  systemRequirements?: {[key: string]: {recommended: any, minimum: any}};
  slug: string = '';
  type: number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get url(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.APPLICATION_STORE_LISTING_SKU(this.id, this.slug);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.APPLICATION_ID: {
          if (!this.application) {
            if (this.client.applications.has(value)) {
              this.application = <Application> this.client.applications.get(value);
            }
          }
        }; break;
        case DiscordKeys.APPLICATION: {
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
      return super.mergeValue(key, value);
    }
  }
}


export const keysStoreApplicationAsset = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.FILENAME,
  DiscordKeys.HEIGHT,
  DiscordKeys.ID,
  DiscordKeys.MIME_TYPE,
  DiscordKeys.SIZE,
  DiscordKeys.WIDTH,
]);

export class StoreApplicationAsset extends BaseStructure {
  readonly _keys = keysStoreApplicationAsset;

  applicationId: string = '';
  filename: string = '';
  height: number = 0;
  id: string = '';
  mimeType: string = '';
  size: number = 0;
  width: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get url(): string {
    return this.urlFormat();
  }

  urlFormat(format?: null | string, query?: UrlQuery): string {
    format = getFormatFromHash(
      this.id,
      format,
      this.client.imageFormat,
    );
    if (this.mimeType.startsWith('video/')) {
      format = 'mp4';
    }
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.APP_ASSET_STORE(this.applicationId, this.id, format),
      query,
    );
  }

  async delete() {
    return this.client.rest.deleteStoreApplicationAsset(this.applicationId, this.id);
  }
}
