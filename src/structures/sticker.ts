import { Endpoints } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, StickerExtensions, StickerFormats } from '../constants';
import { addQuery, getFormatFromHash, Snowflake, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysSticker = new BaseSet<string>([
  DiscordKeys.ASSET,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.FORMAT_TYPE,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.PACK_ID,
  DiscordKeys.PREVIEW_ASSET,
  DiscordKeys.TAGS,
]);

/**
 * Sticker Structure
 * @category Structure
 */
export class Sticker extends BaseStructure {
  readonly _keys = keysSticker;

  asset: string = '';
  description: string = '';
  formatType: StickerFormats = StickerFormats.UNKNOWN;
  id: string = '';
  name: string = '';
  packId: string = '';
  previewAsset: null | string = null;
  tags: null | string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get assetUrl(): string {
    return this.assetUrlFormat();
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get format(): StickerExtensions {
    switch (this.formatType) {
      case StickerFormats.PNG: return StickerExtensions.PNG;
      case StickerFormats.APNG: return StickerExtensions.APNG;
      case StickerFormats.LOTTIE: return StickerExtensions.LOTTIE;
      default: {
        throw new Error(`Unexpected format type: ${this.formatType}`);
      };
    }
  }

  assetUrlFormat(format?: null | string, query?: UrlQuery): string {
    const hash = this.asset;
    if (!format) {
      format = this.format;
    }
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.STICKER(this.id, hash, this.format), query);
  }

  toString(): string {
    return this.name;
  }
}
