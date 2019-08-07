import { BaseCollection } from '../collections/basecollection';
import { ShardClient } from '../client';
import { MessageEmbedTypes } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysMessageEmbed: ReadonlyArray<string> = [
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
export class MessageEmbed extends BaseStructure {
  readonly _keys = keysMessageEmbed;
  author: MessageEmbedAuthor | null = null;
  color?: number;
  description: null | string = null;
  fields: BaseCollection<number, MessageEmbedField> | null = null;
  footer: MessageEmbedFooter | null = null;
  image: MessageEmbedImage | null = null;
  provider: MessageEmbedProvider | null = null;
  referenceId: null | string = null;
  thumbnail: MessageEmbedThumbnail | null = null;
  timestamp: null | Date = null;
  title: null | string = null;
  type: string = MessageEmbedTypes.RICH;
  url: null | string = null;
  video: MessageEmbedVideo | null = null;

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
        value = new MessageEmbedAuthor(this.client, value);
      }; break;
      case 'fields': {
        if (this.fields === null) {
          this.fields = new BaseCollection<number, MessageEmbedField>();
        }
        this.fields.clear();
        for (let i = 0; i < value.length; i++) {
          this.fields.set(i, value[i]);
        }
      }; return;
      case 'footer': {
        value = new MessageEmbedFooter(this.client, value);
      }; break;
      case 'provider': {
        value = new MessageEmbedProvider(this.client, value);
      }; break;
      case 'image': {
        value = new MessageEmbedImage(this.client, value);
      }; break;
      case 'thumbnail': {
        value = new MessageEmbedThumbnail(this.client, value);
      }; break;
      case 'video': {
        value = new MessageEmbedVideo(this.client, value);
      }; break;
    }
    return super.mergeValue.call(this, key, value);
  }
}


const keysMessageEmbedAuthor: ReadonlyArray<string> = [
  'icon_url',
  'name',
  'proxy_icon_url',
  'url',
];

/**
 * Embed Author Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedAuthor extends BaseStructure {
  readonly _keys = keysMessageEmbedAuthor;

  iconUrl: null | string = null;
  name:  null | string = null;
  proxyIconUrl: null | string = null;
  url: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysMessageEmbedField: ReadonlyArray<string> = [
  'inline',
  'name',
  'value',
];

/**
 * Embed Field Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedField extends BaseStructure {
  readonly _keys = keysMessageEmbedField;

  inline: boolean = false;
  name: string = '';
  value: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysMessageEmbedFooter: ReadonlyArray<string> = [
  'icon_url',
  'proxy_icon_url',
  'text',
];

/**
 * Embed Footer Structure, used for [ApplicationNews] and [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedFooter extends BaseStructure {
  readonly _keys = keysMessageEmbedFooter;

  iconUrl: null | string = null;
  proxyIconUrl: null | string = null;
  text: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysMessageEmbedImage = [
  'height',
  'proxy_url',
  'url',
  'width',
];

/**
 * Embed Image Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedImage extends BaseStructure {
  readonly _keys: ReadonlyArray<string> = keysMessageEmbedImage;

  height: number = 0;
  proxyUrl: null | string = null;
  url: string = '';
  width: null | number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysMessageEmbedProvider: ReadonlyArray<string> = [
  'name',
  'url',
];

/**
 * Embed Provider Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedProvider extends BaseStructure {
  readonly _keys = keysMessageEmbedProvider;

  name: null | string = null;
  url: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


/**
 * Embed Thumbnail Structure, used for [ApplicationNews] and [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedThumbnail extends MessageEmbedImage {

}


/**
 * Embed Video Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedVideo extends MessageEmbedImage {

}
