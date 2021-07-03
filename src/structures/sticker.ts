import { Endpoints } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, StickerExtensions, StickerFormats } from '../constants';
import { addQuery, getFormatFromHash, Snowflake, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';

import { Guild } from './guild';
import { Member } from './member';
import { User } from './user';


const keysStickerItem = new BaseSet<string>([
  DiscordKeys.FORMAT_TYPE,
  DiscordKeys.ID,
  DiscordKeys.NAME,
]);

/**
 * Sticker Item Structure
 * @category Structure
 */
export class StickerItem extends BaseStructure {
  readonly _keys = keysStickerItem;

  formatType: StickerFormats = StickerFormats.UNKNOWN;
  id: string = '';
  name: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
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
    if (!format) {
      format = this.format;
    }
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.STICKER(this.id, this.format), query);
  }

  toString(): string {
    return this.name;
  }
}


const keysSticker = new BaseSet<string>([
  DiscordKeys.ASSET,
  DiscordKeys.AVAILABLE,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.FORMAT_TYPE,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.PACK_ID,
  DiscordKeys.PREVIEW_ASSET,
  DiscordKeys.SORT_VALUE,
  DiscordKeys.TAGS,
  DiscordKeys.USER,
]);

/**
 * Sticker Structure
 * @category Structure
 */
export class Sticker extends StickerItem {
  readonly _keys = keysSticker;

  asset: string = '';
  available?: boolean;
  description: string = '';
  formatType: StickerFormats = StickerFormats.UNKNOWN;
  guildId?: string;
  id: string = '';
  name: string = '';
  packId?: string;
  previewAsset: null | string = null;
  sortValue?: number;
  tags: null | string = '';
  user?: User;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get member(): Member | null {
    if (this.guildId && this.user) {
      return this.client.members.get(this.guildId, this.user.id) || null;
    }
    return null;
  }

  delete() {
    if (!this.guildId) {
      throw new Error('Can\'t delete a global sticker!');
    }
    return this.client.rest.deleteGuildSticker(this.guildId, this.id);
  }

  edit() {
    if (!this.guildId) {
      throw new Error('Can\'t edit a global sticker!');
    }
    return this.client.rest.editGuildSticker(this.guildId, this.id);
  }

  fetch() {
    if (!this.guildId) {
      throw new Error('Can\'t edit a global sticker!');
    }
    return this.client.rest.fetchGuildSticker(this.guildId, this.id);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.USER: {
          let user: User;
          if (this.isClone) {
            user = new User(this.client, value, this.isClone);
          } else {
            if (this.client.users.has(value.id)) {
              user = this.client.users.get(value.id)!;
              user.merge(value);
            } else {
              user = new User(this.client, value);
              this.client.users.insert(user);
            }
          }
          value = user;
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
