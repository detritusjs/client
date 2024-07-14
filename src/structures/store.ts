import { Endpoints } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, SkuTypes } from '../constants';
import {
  addQuery,
  getFormatFromHash,
  getQueryForImage,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Application } from './application';
import { Sku } from './sku';


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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
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
  readonly _uncloneable = true;
  readonly _keys = keysStoreListingAsset;
  readonly storeListing: StoreListing;

  height: number = 0;
  id: string = '';
  mimeType: string = '';
  size: number = 0;
  width: number = 0;

  constructor(storeListing: StoreListing, data: BaseStructureData) {
    super(storeListing.client, undefined, storeListing._clone);
    this.storeListing = storeListing;
    this.merge(data);
    Object.defineProperty(this, 'storeListing', {enumerable: false, writable: false});
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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get url(): string {
    return this.urlFormat();
  }

  urlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): string {
    const hash = this.id;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    if (this.mimeType.startsWith('video/')) {
      format = 'mp4';
    }
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.APP_ASSET_STORE(this.applicationId, hash, format),
      query,
    );
  }

  async delete() {
    return this.client.rest.deleteStoreApplicationAsset(this.applicationId, this.id);
  }
}
