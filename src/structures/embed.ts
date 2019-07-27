import { BaseCollection } from '../collections/basecollection';
import { ShardClient } from '../client';
import {
  MessageEmbedTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keys = [
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

export class Embed extends BaseStructure {
  _defaultKeys = keys;
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


const keysEmbedAuthor = [
  'icon_url',
  'name',
  'proxy_icon_url',
  'url',
];

export class EmbedAuthor extends BaseStructure {
  _defaultKeys = keysEmbedAuthor;
  iconUrl: null | string = null;
  name:  null | string = null;
  proxyIconUrl: null | string = null;
  url: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysEmbedField = [
  'inline',
  'name',
  'value',
];

export class EmbedField extends BaseStructure {
  _defaultKeys = keysEmbedField;
  inline: boolean = false;
  name: string = '';
  value: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysEmbedFooter = [
  'icon_url',
  'proxy_icon_url',
  'text',
];

export class EmbedFooter extends BaseStructure {
  _defaultKeys = keysEmbedFooter;
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

export class EmbedImage extends BaseStructure {
  _defaultKeys = keysEmbedImage;
  height: number = 0;
  proxyUrl: null | string = null;
  url: string = '';
  width: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysEmbedProvider = [
  'name',
  'url',
];

export class EmbedProvider extends BaseStructure {
  _defaultKeys = keysEmbedProvider;
  name: null | string = null;
  url: null | string = null;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


export class EmbedThumbnail extends EmbedImage {

}


export class EmbedVideo extends EmbedImage {

}
