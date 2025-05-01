import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';

import { ComponentUnfurledMedia, ComponentUnfurledMediaData } from './unfurledmedia';


export interface ComponentThumbnailData {
  description?: string,
  id?: number,
  media?: ComponentUnfurledMedia | ComponentUnfurledMediaData,
  spoiler?: boolean,
  type?: number,
}


const keysComponentThumbnail = new BaseSet<string>([
  DiscordKeys.DESCRIPTION,
  DiscordKeys.ID,
  DiscordKeys.MEDIA,
  DiscordKeys.SPOILER,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Thumbnail Structure
 * @category Utils
 */
 export class ComponentThumbnail extends Structure {
  readonly _keys = keysComponentThumbnail;

  description?: string;
  id?: number;
  media = new ComponentUnfurledMedia();
  spoiler?: boolean;
  type = MessageComponentTypes.THUMBNAIL;

  constructor(data: ComponentThumbnailData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.THUMBNAIL;
  }

  setDescription(description: string): this {
    this.merge({description});
    return this;
  }

  setId(id: number): this {
    this.merge({id});
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
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
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
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}
