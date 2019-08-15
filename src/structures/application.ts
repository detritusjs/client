import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { Distributors, DistributorNames, DistributorUrls } from '../constants';
import {
  addQuery,
  getFormatFromHash,
  Snowflake,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


export const SpecialThirdPartySkus: {[key: string]: string} = Object.freeze({
  'Call of Duty Black Ops 4': 'call-of-duty',
  'Call of Duty Modern Warfare': 'call-of-duty-mw',
});


export interface ApplicationDeveloper {
  id: string,
  name: string,
}

export interface ApplicationExecutable {
  arguments?: string,
  name: string,
  os: string,
}

export interface ApplicationPublisher {
  id: string,
  name: string,
}

const keysApplication: ReadonlyArray<string> = [
  'aliases',
  'bot_public',
  'bot_require_code_grant',
  'cover_image',
  'description',
  'developers',
  'executables',
  'icon',
  'id',
  'guild_id',
  'name',
  'overlay',
  'overlay_compatibility_hook',
  'primary_sku_id',
  'publishers',
  'slug',
  'splash',
  'summary',
  'third_party_skus',
  'verify_key',
  'youtube_trailer_video_id',
];

/**
 * Application Structure, used for channels, guilds, presences, etc..
 * @category Structure
 */
export class Application extends BaseStructure {
  readonly _keys = keysApplication;
  aliases?: Array<string>;
  botPublic?: boolean;
  botRequireCodeGrant?: boolean;
  coverImage: null | string = null;
  description: string = '';
  developers?: Array<ApplicationDeveloper>;
  executables?: Array<ApplicationExecutable>;
  icon: null | string = null;
  id: string = '';
  guildId?: string;
  name: string = '';
  overlay?: boolean;
  overlayCompatibilityHook?: boolean;
  primarySkuId?: string;
  publishers?: Array<ApplicationPublisher>;
  slug: null | string = null;
  splash: null | string = null;
  summary: string = '';
  thirdPartySkus?: BaseCollection<string, ApplicationThirdPartySku>;
  verifyKey: string = '';
  youtubeTrailerVideoId?: string;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get coverImageUrl(): null | string {
    return this.coverImageUrlFormat();
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get jumpLink(): null | string {
    return this.platformDiscordUrl;
  }

  get iconUrl(): null | string {
    return this.iconUrlFormat();
  }

  get isOnDiscord(): boolean {
    return !!this.primarySkuId;
  }

  get platformDiscordUrl(): null | string {
    if (this.primarySkuId) {
      return (
        Endpoints.Routes.URL +
        Endpoints.Routes.APPLICATION_STORE_LISTING_SKU(this.primarySkuId, this.slug)
      );
    }
    return null;
  }

  get splashUrl(): null | string {
    return this.splashUrlFormat();
  }

  coverImageUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (this.coverImage) {
      const hash = this.coverImage;
      format = getFormatFromHash(
        hash,
        format,
        this.client.imageFormat,
      );
      return addQuery(
        Endpoints.CDN.URL + Endpoints.CDN.APP_ICON(this.id, hash, format),
        query,
      );
    }
    return null;
  }

  iconUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (this.icon) {
      const hash = this.icon;
      format = getFormatFromHash(
        hash,
        format,
        this.client.imageFormat,
      );
      return addQuery(
        Endpoints.CDN.URL + Endpoints.CDN.APP_ICON(this.id, hash, format),
        query,
      );
    }
    return null;
  }

  async createAsset(options: RequestTypes.CreateOauth2ApplicationAsset) {
    return this.client.rest.createOauth2ApplicationAsset(this.id, options);
  }

  async createStoreAsset(options: RequestTypes.CreateStoreApplicationAsset) {
    return this.client.rest.createStoreApplicationAsset(this.id, options);
  }

  async deleteAsset(assetId: string) {
    return this.client.rest.deleteOauth2ApplicationAsset(this.id, assetId);
  }

  async deleteStoreAsset(assetId: string) {
    return this.client.rest.deleteStoreApplicationAsset(this.id, assetId);
  }

  async fetchAssets() {
    return this.client.rest.fetchOauth2ApplicationAssets(this.id);
  }

  async fetchNews() {
    return this.client.rest.fetchApplicationNews(this.id);
  }

  async fetchStoreAssets() {
    return this.client.rest.fetchStoreApplicationAssets(this.id);
  }

  async joinGuild(options: RequestTypes.JoinGuild) {
    if (!this.guildId) {
      throw new Error('Application doesn\'t have a guildId to join');
    }
    return this.client.rest.joinGuild(this.guildId, options);
  }

  splashUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (this.splash) {
      const hash = this.splash;
      format = getFormatFromHash(
        hash,
        format,
        this.client.imageFormat,
      );
      return addQuery(
        Endpoints.CDN.URL + Endpoints.CDN.APP_ICON(this.id, hash, format),
        query,
      );
    }
    return null;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'third_party_skus': {
          if (this.thirdPartySkus) {
            this.thirdPartySkus.clear();
          } else {
            this.thirdPartySkus = new BaseCollection<string, ApplicationThirdPartySku>();
          }

          for (let raw of value) {
            const thirdPartySku = new ApplicationThirdPartySku(this, raw);
            this.thirdPartySkus.set(thirdPartySku.key, thirdPartySku);
          }
        }; return;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}


const keysApplicationThirdPartySku: ReadonlyArray<string> = [
  'distributor',
  'id',
  'sku',
];

export class ApplicationThirdPartySku extends BaseStructure {
  readonly _keys = keysApplicationThirdPartySku;
  application: Application;

  distributor: string = '';
  id: null | string = null;
  sku: null | string = null; // deprecated

  constructor(application: Application, data: BaseStructureData) {
    super(application.client);
    this.application = application;
    Object.defineProperty(this, 'application', {enumerable: false, writable: false});
    this.merge(data);
  }

  get key(): string {
    return `${this.distributor}.${this.id || ''}`;
  }

  get name(): string {
    if (this.distributor in DistributorNames) {
      return DistributorNames[this.distributor];
    }
    return this.distributor;
  }

  get url(): null | string {
    if (this.distributor in DistributorUrls) {
      const url = DistributorUrls[this.distributor];
      switch (this.distributor) {
        case Distributors.BATTLENET: {
          // use name
          let skuId: string;
          if (this.application.name in SpecialThirdPartySkus) {
            skuId = SpecialThirdPartySkus[this.application.name];
          } else {
            skuId = this.application.name.replace(/ /g, '-').toLowerCase();
          }
          return url(skuId);
        };
        case Distributors.DISCORD: {
          const skuId = <string> this.id;
          return url(skuId, this.application.slug);
        };
        case Distributors.EPIC: {
          const skuId = (<string> this.id).toLowerCase();
          return url(skuId);
        };
        case Distributors.GOG: {
          const skuId = this.application.name.replace(/ /g, '_').toLowerCase();
          return url(skuId);
        };
        case Distributors.ORIGIN: {
          let skuId: string;
          if (this.application.aliases && this.application.aliases.length) {
            skuId = this.application.aliases[0];
          } else {
            skuId = this.application.name;
          }
          return url(skuId);
        };
        case Distributors.STEAM: {
          const skuId = <string> this.id;
          return url(skuId);
        };
        case Distributors.TWITCH: {
          // they shut down lol
        }; break;
        case Distributors.UPLAY: {
          const skuId = this.application.name;
          return url(skuId);
        };
      }
    }
    return null;
  }
}
