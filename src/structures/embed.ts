import { BaseCollection } from '../collections/basecollection';
import { ShardClient } from '../client';
import {
  MessageEmbedTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysEmbed: ReadonlyArray<string> = [
  'author',
  'color',
  'description',
  'fields',
  'footer',
  'image',
  'provider',
  'reference_id',
  'thumbnail',
  'timestamp',
  'title',
  'type',
  'url',
  'video',
];

/**
 * Embed Structure, used for [Message] Structures
 * @category Structure
 */
export class Embed extends BaseStructure {
  readonly _keys = keysEmbed;
  author: EmbedAuthor | null = null;
  color: number = 0;
  description: null | string = null;
  fields: BaseCollection<number, EmbedField> | null = null;
  footer: EmbedFooter | null = null;
  image: EmbedImage | null = null;
  provider: EmbedProvider | null = null;
  referenceId: null | string = null;
  thumbnail: EmbedThumbnail | null = null;
  timestamp: null | Date = null;
  title: null | string = null;
  type: string = MessageEmbedTypes.RICH;
  url: null | string = null;
  video: EmbedVideo | null = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get isApplicationNews(): boolean {
    return this.type === MessageEmbedTypes.APPLICATION_NEWS;
  }

  get isArticle(): boolean {
    return this.type === MessageEmbedTypes.ARTICLE;
  }

  get isGifV(): boolean {
    return this.type === MessageEmbedTypes.GIFV;
  }

  get isImage(): boolean {
    return this.type === MessageEmbedTypes.IMAGE;
  }

  get isLink(): boolean {
    return this.type === MessageEmbedTypes.LINK;
  }

  get isRich(): boolean {
    return this.type === MessageEmbedTypes.RICH;
  }

  get isTweet(): boolean {
    return this.type === MessageEmbedTypes.TWEET;
  }

  get isVideo(): boolean {
    return this.type === MessageEmbedTypes.VIDEO;
  }

  async fetchApplicationNews() {
    if (!this.isApplicationNews) {
      throw new Error('Embed isn\'t of Application News Type');
    }
    if (this.referenceId === null) {
      throw new Error('Embed is missing Application News Id');
    }
    return this.client.rest.fetchApplicationNewsId(<string> this.referenceId);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case 'author': {
        value = new EmbedAuthor(this.client, value);
      }; break;
      case 'fields': {
        if (this.fields === null) {
          this.fields = new BaseCollection<number, EmbedField>();
        }
        this.fields.clear();
        for (let i = 0; i < value.length; i++) {
          this.fields.set(i, value[i]);
        }
      }; return;
      case 'footer': {
        value = new EmbedFooter(this.client, value);
      }; break;
      case 'provider': {
        value = new EmbedProvider(this.client, value);
      }; break;
      case 'image': {
        value = new EmbedImage(this.client, value);
      }; break;
      case 'thumbnail': {
        value = new EmbedThumbnail(this.client, value);
      }; break;
      case 'video': {
        value = new EmbedVideo(this.client, value);
      }; break;
    }
    return super.mergeValue.call(this, key, value);
  }
}


const keysEmbedAuthor: ReadonlyArray<string> = [
  'icon_url',
  'name',
  'proxy_icon_url',
  'url',
];

/**
 * Embed Author Structure, used for [Embed] Structures
 * @category Structure
 */
export class EmbedAuthor extends BaseStructure {
  readonly _keys = keysEmbedAuthor;

  iconUrl: null | string = null;
  name:  null | string = null;
  proxyIconUrl: null | string = null;
  url: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysEmbedField: ReadonlyArray<string> = [
  'inline',
  'name',
  'value',
];

/**
 * Embed Field Structure, used for [Embed] Structures
 * @category Structure
 */
export class EmbedField extends BaseStructure {
  readonly _keys = keysEmbedField;

  inline: boolean = false;
  name: string = '';
  value: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysEmbedFooter: ReadonlyArray<string> = [
  'icon_url',
  'proxy_icon_url',
  'text',
];

/**
 * Embed Footer Structure, used for [ApplicationNews] and [Embed] Structures
 * @category Structure
 */
export class EmbedFooter extends BaseStructure {
  readonly _keys = keysEmbedFooter;

  iconUrl: null | string = null;
  proxyIconUrl: null | string = null;
  text: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysEmbedImage = [
  'height',
  'proxy_url',
  'url',
  'width',
];

/**
 * Embed Image Structure, used for [Embed] Structures
 * @category Structure
 */
export class EmbedImage extends BaseStructure {
  readonly _keys: ReadonlyArray<string> = keysEmbedImage;

  height: number = 0;
  proxyUrl: null | string = null;
  url: string = '';
  width: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysEmbedProvider: ReadonlyArray<string> = [
  'name',
  'url',
];

/**
 * Embed Provider Structure, used for [Embed] Structures
 * @category Structure
 */
export class EmbedProvider extends BaseStructure {
  readonly _keys = keysEmbedProvider;

  name: null | string = null;
  url: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


/**
 * Embed Thumbnail Structure, used for [ApplicationNews] and [Embed] Structures
 * @category Structure
 */
export class EmbedThumbnail extends EmbedImage {

}


/**
 * Embed Video Structure, used for [Embed] Structures
 * @category Structure
 */
export class EmbedVideo extends EmbedImage {

}
