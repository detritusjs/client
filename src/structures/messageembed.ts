import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { MEDIA_ATTACHMENT_URL_PREFIX, DetritusKeys, DiscordKeys, MessageEmbedTypes } from '../constants';

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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get hasAttachment(): boolean {
    return !!(
      (this.image && this.image.hasAttachment) ||
      (this.thumbnail && this.thumbnail.hasAttachment) ||
      (this.video && this.video.hasAttachment)
    );
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

  get length(): number {
    return this.size;
  }

  get size(): number {
    let size = 0;
    if (this.author) {
      size += (this.author.name || '').length;
    }
    if (this.title) {
      size += (this.title || '').length;
    }
    if (this.description) {
      size += (this.description || '').length;
    }
    if (this.fields) {
      size += this.fields.reduce((s, field) => s + (field.name || '').length + (field.value || '').length, 0);
    }
    if (this.footer) {
      size += (this.footer.text || '').length;
    }
    return size;
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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.AUTHOR in data) {
      const value = new MessageEmbedAuthor(this.client, data[DiscordKeys.AUTHOR], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.AUTHOR]] = value;
    }
    if (DiscordKeys.COLOR in data) {
      (this as any)[DetritusKeys[DiscordKeys.COLOR]] = data[DiscordKeys.COLOR];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.FIELDS in data) {
      const value = data[DiscordKeys.FIELDS];
      if (!this.fields) {
        this.fields = new BaseCollection<number, MessageEmbedField>();
      }
      this.fields.clear();
      for (let i = 0; i < value.length; i++) {
        this.fields.set(i, new MessageEmbedField(this.client, value[i], this._clone));
      }
    }
    if (DiscordKeys.FOOTER in data) {
      const value = new MessageEmbedFooter(this.client, data[DiscordKeys.FOOTER], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.FOOTER]] = value;
    }
    if (DiscordKeys.IMAGE in data) {
      const value = new MessageEmbedImage(this.client, data[DiscordKeys.IMAGE], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.IMAGE]] = value;
    }
    if (DiscordKeys.PROVIDER in data) {
      const value = new MessageEmbedProvider(this.client, data[DiscordKeys.PROVIDER], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.PROVIDER]] = value;
    }
    if (DiscordKeys.REFERENCE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.REFERENCE_ID]] = data[DiscordKeys.REFERENCE_ID];
    }
    if (DiscordKeys.THUMBNAIL in data) {
      const value = new MessageEmbedThumbnail(this.client, data[DiscordKeys.THUMBNAIL], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.THUMBNAIL]] = value;
    }
    if (DiscordKeys.TIMESTAMP in data) {
      const value = new Date(data[DiscordKeys.TIMESTAMP]);
      (this as any)[DetritusKeys[DiscordKeys.TIMESTAMP]] = value;
    }
    if (DiscordKeys.TITLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TITLE]] = data[DiscordKeys.TITLE];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
    if (DiscordKeys.VIDEO in data) {
      const value = new MessageEmbedVideo(this.client, data[DiscordKeys.VIDEO], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.VIDEO]] = value;
    }
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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ICON_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.ICON_URL]] = data[DiscordKeys.ICON_URL];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.PROXY_ICON_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PROXY_ICON_URL]] = data[DiscordKeys.PROXY_ICON_URL];
    }
    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.INLINE in data) {
      (this as any)[DetritusKeys[DiscordKeys.INLINE]] = data[DiscordKeys.INLINE];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.VALUE in data) {
      (this as any)[DetritusKeys[DiscordKeys.VALUE]] = data[DiscordKeys.VALUE];
    }
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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ICON_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.ICON_URL]] = data[DiscordKeys.ICON_URL];
    }
    if (DiscordKeys.PROXY_ICON_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PROXY_ICON_URL]] = data[DiscordKeys.PROXY_ICON_URL];
    }
    if (DiscordKeys.TEXT in data) {
      (this as any)[DetritusKeys[DiscordKeys.TEXT]] = data[DiscordKeys.TEXT];
    }
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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get hasAttachment(): boolean {
    return !!(this.proxyUrl && this.proxyUrl.startsWith(MEDIA_ATTACHMENT_URL_PREFIX));
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.HEIGHT in data) {
      (this as any)[DetritusKeys[DiscordKeys.HEIGHT]] = data[DiscordKeys.HEIGHT];
    }
    if (DiscordKeys.PROXY_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PROXY_URL]] = data[DiscordKeys.PROXY_URL];
    }
    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
    if (DiscordKeys.WIDTH in data) {
      (this as any)[DetritusKeys[DiscordKeys.WIDTH]] = data[DiscordKeys.WIDTH];
    }
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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
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
