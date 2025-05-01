import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';

import { ComponentUnfurledMedia, ComponentUnfurledMediaData } from './unfurledmedia';


export interface ComponentMediaGalleryData {
  id?: number,
  items?: Array<ComponentMediaGalleryItem | ComponentMediaGalleryItemData>,
  type?: number,
}


const keysComponentMediaGallery = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.ITEMS,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Media Gallery Structure
 * @category Utils
 */
 export class ComponentMediaGallery extends Structure {
  readonly _keys = keysComponentMediaGallery;

  id?: number;
  items: Array<ComponentMediaGalleryItem> = [];
  type = MessageComponentTypes.MEDIA_GALLERY;

  constructor(data: ComponentMediaGalleryData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.MEDIA_GALLERY;
  }

  addItem(data: ComponentMediaGalleryItem | ComponentMediaGalleryItemData): this {
    if (data instanceof ComponentMediaGalleryItem) {
      this.items.push(data);
    } else {
      this.items.push(new ComponentMediaGalleryItem(data));
    }
    return this;
  }

  clear() {
    this.items.length = 0;
  }

  setId(id: number): this {
    this.merge({id});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.ITEMS in data) {
      const value = data[DiscordKeys.ITEMS];
      this.clear();
      for (let raw of value) {
        this.addItem(raw);
      }
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}


export interface ComponentMediaGalleryItemData {
  description?: number,
  media?: ComponentUnfurledMedia | ComponentUnfurledMediaData,
  spoiler?: boolean,
}


const keysComponentMediaGalleryItem = new BaseSet<string>([
  DiscordKeys.DESCRIPTION,
  DiscordKeys.MEDIA,
  DiscordKeys.SPOILER,
]);

/**
 * Utils Component Media Gallery Item Structure
 * @category Utils
 */
 export class ComponentMediaGalleryItem extends Structure {
  readonly _keys = keysComponentMediaGalleryItem;

  description?: string;
  media = new ComponentUnfurledMedia();
  spoiler?: boolean;

  constructor(data: ComponentMediaGalleryItemData = {}) {
    super();
    this.merge(data);
  }

  setDescription(description: string): this {
    this.merge({description});
    return this;
  }

  setMedia(media: ComponentUnfurledMedia | ComponentUnfurledMediaData): this {
    this.merge({media});
    return this;
  }

  setSpoiler(spoiler: boolean): this {
    this.merge({spoiler});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.MEDIA in data) {
      const value = data[DiscordKeys.MEDIA];
      if (value instanceof ComponentUnfurledMedia) {
        this.media = value;
      } else {
        this.media.merge(value);
      }
    }
    if (DiscordKeys.SPOILER in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPOILER]] = data[DiscordKeys.SPOILER];
    }
  }
}
