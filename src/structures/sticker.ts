import { Endpoints } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, StickerExtensions, StickerFormats, StickerTypes } from '../constants';
import { addQuery, getQueryForImage, Snowflake, UrlQuery } from '../utils';

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
      case StickerFormats.GIF: return StickerExtensions.GIF;
      default: {
        throw new Error(`Unexpected format type: ${this.formatType}`);
      };
    }
  }

  assetUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): string {
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    if (!format) {
      format = this.format;
    }
    if (this.formatType === StickerFormats.GIF) {
      return addQuery(Endpoints.Urls.MEDIA.slice(0, -1) + Endpoints.CDN.STICKER(this.id, this.format), query);
    }
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.STICKER(this.id, this.format), query);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.FORMAT_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.FORMAT_TYPE]] = data[DiscordKeys.FORMAT_TYPE];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
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
  DiscordKeys.TYPE,
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
  type: StickerTypes = StickerTypes.GUILD;
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

  async delete() {
    if (!this.guildId) {
      throw new Error('Can\'t delete a global sticker!');
    }
    return this.client.rest.deleteGuildSticker(this.guildId, this.id);
  }

  async edit() {
    if (!this.guildId) {
      throw new Error('Can\'t edit a global sticker!');
    }
    return this.client.rest.editGuildSticker(this.guildId, this.id);
  }

  async fetch() {
    if (!this.guildId) {
      throw new Error('Can\'t edit a global sticker!');
    }
    return this.client.rest.fetchGuildSticker(this.guildId, this.id);
  }

  merge(data?: BaseStructureData): void {
    super.merge(data);
    if (!data) {
      return;
    }

    if (DiscordKeys.ASSET in data) {
      (this as any)[DetritusKeys[DiscordKeys.ASSET]] = data[DiscordKeys.ASSET];
    }
    if (DiscordKeys.AVAILABLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.AVAILABLE]] = data[DiscordKeys.AVAILABLE];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.PACK_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.PACK_ID]] = data[DiscordKeys.PACK_ID];
    }
    if (DiscordKeys.PREVIEW_ASSET in data) {
      (this as any)[DetritusKeys[DiscordKeys.PREVIEW_ASSET]] = data[DiscordKeys.PREVIEW_ASSET];
    }
    if (DiscordKeys.SORT_VALUE in data) {
      (this as any)[DetritusKeys[DiscordKeys.SORT_VALUE]] = data[DiscordKeys.SORT_VALUE];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.TAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.TAGS]] = data[DiscordKeys.TAGS];
    }
    if (DiscordKeys.USER in data) {
      const value = data[DiscordKeys.USER];

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
      (this as any)[DetritusKeys[DiscordKeys.USER]] = user;
    }
  }
}
