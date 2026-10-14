import { Endpoints } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, SkuTypes } from '../constants';
import {
  addQuery,
  getFormatFromHash,
  getQueryForImage,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
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
  static { setStructureKeys(this, '_keys', keysStore); }

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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ASSETS in data) {
      this.assets.clear();
      for (let raw of data[DiscordKeys.ASSETS]) {
        this.assets.set(raw.id, new StoreListingAsset(this, raw));
      }
    }
    if (DiscordKeys.BOX_ART in data) {
      const value = new StoreListingAsset(this, data[DiscordKeys.BOX_ART]);
      (this as any)[DetritusKeys[DiscordKeys.BOX_ART]] = value;
    }
    if (DiscordKeys.CAROUSEL_ITEMS in data) {
      (this as any)[DetritusKeys[DiscordKeys.CAROUSEL_ITEMS]] = data[DiscordKeys.CAROUSEL_ITEMS];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.ENTITLEMENT_BRANCH_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ENTITLEMENT_BRANCH_ID]] = data[DiscordKeys.ENTITLEMENT_BRANCH_ID];
    }
    if (DiscordKeys.HEADER_BACKGROUND in data) {
      const value = new StoreListingAsset(this, data[DiscordKeys.HEADER_BACKGROUND]);
      (this as any)[DetritusKeys[DiscordKeys.HEADER_BACKGROUND]] = value;
    }
    if (DiscordKeys.HEADER_LOGO_DARK_THEME in data) {
      const value = new StoreListingAsset(this, data[DiscordKeys.HEADER_LOGO_DARK_THEME]);
      (this as any)[DetritusKeys[DiscordKeys.HEADER_LOGO_DARK_THEME]] = value;
    }
    if (DiscordKeys.HEADER_LOGO_LIGHT_THEME in data) {
      const value = new StoreListingAsset(this, data[DiscordKeys.HEADER_LOGO_LIGHT_THEME]);
      (this as any)[DetritusKeys[DiscordKeys.HEADER_LOGO_LIGHT_THEME]] = value;
    }
    if (DiscordKeys.HERO_BACKGROUND in data) {
      const value = new StoreListingAsset(this, data[DiscordKeys.HERO_BACKGROUND]);
      (this as any)[DetritusKeys[DiscordKeys.HERO_BACKGROUND]] = value;
    }
    if (DiscordKeys.HERO_VIDEO in data) {
      const value = new StoreListingAsset(this, data[DiscordKeys.HERO_VIDEO]);
      (this as any)[DetritusKeys[DiscordKeys.HERO_VIDEO]] = value;
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.PREVIEW_VIDEO in data) {
      const value = new StoreListingAsset(this, data[DiscordKeys.PREVIEW_VIDEO]);
      (this as any)[DetritusKeys[DiscordKeys.PREVIEW_VIDEO]] = value;
    }
    if (DiscordKeys.SKU in data) {
      const value = new Sku(this.client, data[DiscordKeys.SKU]);
      (this as any)[DetritusKeys[DiscordKeys.SKU]] = value;
    }
    if (DiscordKeys.SUMMARY in data) {
      (this as any)[DetritusKeys[DiscordKeys.SUMMARY]] = data[DiscordKeys.SUMMARY];
    }
    if (DiscordKeys.TAGLINE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TAGLINE]] = data[DiscordKeys.TAGLINE];
    }
    if (DiscordKeys.THUMBNAIL in data) {
      const value = new StoreListingAsset(this, data[DiscordKeys.THUMBNAIL]);
      (this as any)[DetritusKeys[DiscordKeys.THUMBNAIL]] = value;
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
  static { setStructureKeys(this, '_keys', keysStoreListingAsset); }
  declare readonly storeListing: StoreListing;

  height: number = 0;
  id: string = '';
  mimeType: string = '';
  size: number = 0;
  width: number = 0;

  constructor(storeListing: StoreListing, data: BaseStructureData) {
    super(storeListing.client, undefined, storeListing._clone);
    Object.defineProperty(this, 'storeListing', {configurable: true, enumerable: false, writable: false, value: storeListing});
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.HEIGHT in data) {
      (this as any)[DetritusKeys[DiscordKeys.HEIGHT]] = data[DiscordKeys.HEIGHT];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.MIME_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.MIME_TYPE]] = data[DiscordKeys.MIME_TYPE];
    }
    if (DiscordKeys.SIZE in data) {
      (this as any)[DetritusKeys[DiscordKeys.SIZE]] = data[DiscordKeys.SIZE];
    }
    if (DiscordKeys.WIDTH in data) {
      (this as any)[DetritusKeys[DiscordKeys.WIDTH]] = data[DiscordKeys.WIDTH];
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
  static { setStructureKeys(this, '_keys', keysStoreApplicationAsset); }

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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.APPLICATION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = data[DiscordKeys.APPLICATION_ID];
    }
    if (DiscordKeys.FILENAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.FILENAME]] = data[DiscordKeys.FILENAME];
    }
    if (DiscordKeys.HEIGHT in data) {
      (this as any)[DetritusKeys[DiscordKeys.HEIGHT]] = data[DiscordKeys.HEIGHT];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.MIME_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.MIME_TYPE]] = data[DiscordKeys.MIME_TYPE];
    }
    if (DiscordKeys.SIZE in data) {
      (this as any)[DetritusKeys[DiscordKeys.SIZE]] = data[DiscordKeys.SIZE];
    }
    if (DiscordKeys.WIDTH in data) {
      (this as any)[DetritusKeys[DiscordKeys.WIDTH]] = data[DiscordKeys.WIDTH];
    }
  }
}
