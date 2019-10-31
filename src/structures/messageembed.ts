import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, MessageEmbedTypes } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysMessageEmbed = new BaseSet<string>([
  DiscordKeys.AUTHOR,
  DiscordKeys.COLOR,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.FIELDS,
  DiscordKeys.FOOTER,
  DiscordKeys.IMAGE,
  DiscordKeys.PROVIDER,
  DiscordKeys.REFERENCE_ID,
  DiscordKeys.THUMBNAIL,
  DiscordKeys.TIMESTAMP,
  DiscordKeys.TITLE,
  DiscordKeys.TYPE,
  DiscordKeys.URL,
  DiscordKeys.VIDEO,
]);

/**
 * Embed Structure, used for [Message] Structures
 * @category Structure
 */
export class MessageEmbed extends BaseStructure {
  readonly _keys = keysMessageEmbed;

  author?: MessageEmbedAuthor;
  color?: number;
  description?: string;
  fields?: BaseCollection<number, MessageEmbedField>;
  footer?: MessageEmbedFooter;
  image?: MessageEmbedImage;
  provider?: MessageEmbedProvider;
  referenceId?: string;
  thumbnail?: MessageEmbedThumbnail;
  timestamp?: Date;
  title?: string;
  type: MessageEmbedTypes = MessageEmbedTypes.RICH;
  url?: string;
  video?: MessageEmbedVideo;

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
    if (!this.referenceId) {
      throw new Error('Embed is missing Application News Id');
    }
    return this.client.rest.fetchApplicationNewsId(<string> this.referenceId);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.AUTHOR: {
        value = new MessageEmbedAuthor(this.client, value);
      }; break;
      case DiscordKeys.FIELDS: {
        if (!this.fields) {
          this.fields = new BaseCollection<number, MessageEmbedField>();
        }
        this.fields.clear();
        for (let i = 0; i < value.length; i++) {
          this.fields.set(i, value[i]);
        }
      }; return;
      case DiscordKeys.FOOTER: {
        value = new MessageEmbedFooter(this.client, value);
      }; break;
      case DiscordKeys.PROVIDER: {
        value = new MessageEmbedProvider(this.client, value);
      }; break;
      case DiscordKeys.IMAGE: {
        value = new MessageEmbedImage(this.client, value);
      }; break;
      case DiscordKeys.TIMESTAMP: {
        value = new Date(value);
      }; break;
      case DiscordKeys.THUMBNAIL: {
        value = new MessageEmbedThumbnail(this.client, value);
      }; break;
      case DiscordKeys.VIDEO: {
        value = new MessageEmbedVideo(this.client, value);
      }; break;
    }
    return super.mergeValue(key, value);
  }
}


const keysMessageEmbedAuthor = new BaseSet<string>([
  DiscordKeys.ICON_URL,
  DiscordKeys.NAME,
  DiscordKeys.PROXY_ICON_URL,
  DiscordKeys.URL,
]);

/**
 * Embed Author Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedAuthor extends BaseStructure {
  readonly _keys = keysMessageEmbedAuthor;

  iconUrl?: string;
  name?: string;
  proxyIconUrl?: string;
  url?: string;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysMessageEmbedField = new BaseSet<string>([
  DiscordKeys.INLINE,
  DiscordKeys.NAME,
  DiscordKeys.VALUE,
]);

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


const keysMessageEmbedFooter = new BaseSet<string>([
  DiscordKeys.ICON_URL,
  DiscordKeys.PROXY_ICON_URL,
  DiscordKeys.TEXT,
]);

/**
 * Embed Footer Structure, used for [ApplicationNews] and [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedFooter extends BaseStructure {
  readonly _keys = keysMessageEmbedFooter;

  iconUrl?: string;
  proxyIconUrl?: string;
  text: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysMessageEmbedImage = new BaseSet<string>([
  DiscordKeys.HEIGHT,
  DiscordKeys.PROXY_URL,
  DiscordKeys.URL,
  DiscordKeys.WIDTH,
]);

/**
 * Embed Image Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedImage extends BaseStructure {
  readonly _keys = keysMessageEmbedImage;

  height: number = 0;
  proxyUrl?: string;
  url: string = '';
  width: number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}


const keysMessageEmbedProvider = new BaseSet<string>([
  DiscordKeys.NAME,
  DiscordKeys.URL,
]);

/**
 * Embed Provider Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedProvider extends BaseStructure {
  readonly _keys = keysMessageEmbedProvider;

  name?: string;
  url?: string;

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
