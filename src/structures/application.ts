import { Endpoints } from 'detritus-client-rest';

import { ShardClient } from '../client';
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

export interface ApplicationThirdPartySku {
  distributor: string,
  id: string,
  sku: string,
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
  thirdPartySkus?: Array<ApplicationThirdPartySku>;
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
        Endpoints.Routes.APPLICATION_STORE_LISTING_APPLICATION(this.primarySkuId, this.slug)
      );
    }
    return null;
  }

  get splashUrl(): null | string {
    return this.splashUrlFormat();
  }

  coverImageUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (!this.icon) {
      return null;
    }
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

  iconUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (!this.icon) {
      return null;
    }
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

  splashUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (!this.splash) {
      return null;
    }
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
}
