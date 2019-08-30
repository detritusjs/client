import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { MessageEmbedTypes } from '../constants';
import { GatewayRawEvents } from '../gateway/rawevents';
import { BaseStructureData, Structure } from '../structures/basestructure';


const keysEmbed = new BaseSet<string>([
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
]);

/**
 * Utils Embed Structure
 * @category Utils
 */
export class Embed extends Structure {
  readonly _keys = keysEmbed;

  author?: EmbedAuthor;
  color?: number;
  description?: string;
  fields?: BaseCollection<number, EmbedField>;
  footer?: EmbedFooter;
  image?: EmbedImage;
  provider?: EmbedProvider;
  referenceId?: string;
  thumbnail?: EmbedThumbnail;
  timestamp?: Date;
  title?: string;
  type: string = MessageEmbedTypes.RICH;
  url?: string;
  video?: EmbedVideo;

  constructor(data: GatewayRawEvents.RawMessageEmbed = {}) {
    super();
    this.merge(data);
  }

  get length(): number {
    return this.size;
  }

  get size(): number {
    let size = 0;
    if (this.title) {
      size += this.title.length;
    }
    if (this.description) {
      size += this.description.length;
    }
    if (this.fields) {
      size += this.fields.reduce((s, field) => s + field.name.length + field.value.length, 0);
    }
    if (this.footer) {
      size += this.footer.text.length;
    }
    return size;
  }

  addField(name: string, value: string, inline?: boolean): Embed {
    if (!this.fields) {
      this.fields = new BaseCollection<number, EmbedField>();
    }
    const field = new EmbedField({inline, name, value});
    this.fields.set(this.fields.length, field);
    return this;
  }

  setAuthor(
    name?: null | string,
    iconUrl?: null | string,
    url?: null | string,
  ): Embed {
    this.merge({
      author: {
        icon_url: iconUrl,
        name,
        url,
      },
    });
    return this;
  }

  setColor(color: number): Embed {
    this.merge({color});
    return this;
  }

  setDescription(description: null | string): Embed {
    this.merge({description});
    return this;
  }

  setFooter(
    text: string,
    iconUrl?: null | string,
  ): Embed {
    this.merge({
      footer: {
        icon_url: iconUrl,
        text,
      },
    });
    return this;
  }

  setImage(url: string): Embed {
    this.merge({
      image: {url},
    });
    return this;
  }

  setThumbnail(url: string): Embed {
    this.merge({
      thumbnail: {url},
    });
    return this;
  }

  setTimestamp(timestamp: Date | number | string = Date.now()): Embed {
    if (typeof(timestamp) === 'number') {
      timestamp = new Date(timestamp)
    }
    if (timestamp instanceof Date) {
      timestamp = String(timestamp);
    }
    this.merge({timestamp});
    return this;
  }

  setTitle(title: string): Embed {
    this.merge({title});
    return this;
  }

  setUrl(url: string): Embed {
    this.merge({url});
    return this;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case 'author': {
        let author: EmbedAuthor;
        if (this.author) {
          author = this.author;
          author.merge(value);
        } else {
          author = new EmbedAuthor(value);
        }
        value = author;
      }; break;
      case 'fields': {
        if (!this.fields) {
          this.fields = new BaseCollection<number,EmbedField>();
        }
        this.fields.clear();
        for (let i = 0; i < value.length; i++) {
          this.fields.set(i, value[i]);
        }
      }; return;
      case 'footer': {
        let footer: EmbedFooter;
        if (this.footer) {
          footer = this.footer;
          footer.merge(value);
        } else {
          footer = new EmbedFooter(value);
        }
        value = footer;
      }; break;
      case 'provider': {
        let provider: EmbedProvider;
        if (this.provider) {
          provider = this.provider;
          provider.merge(value);
        } else {
          provider = new EmbedProvider(value);
        }
        value = provider;
      }; break;
      case 'image': {
        let image: EmbedImage;
        if (this.image) {
          image = this.image;
          image.merge(value);
        } else {
          image = new EmbedImage(value);
        }
        value = image;
      }; break;
      case 'timestamp': {
        value = new Date(value);
      }; break;
      case 'thumbnail': {
        let thumbnail: EmbedThumbnail;
        if (this.thumbnail) {
          thumbnail = this.thumbnail;
          thumbnail.merge(value);
        } else {
          thumbnail = new EmbedThumbnail(value);
        }
        value = thumbnail;
      }; break;
      case 'video': {
        let video: EmbedVideo;
        if (this.video) {
          video = this.video;
          video.merge(value);
        } else {
          video = new EmbedVideo(value);
        }
        value = video;
      }; break;
    }
    return super.mergeValue.call(this, key, value);
  }
}


const keysEmbedAuthor = new BaseSet<string>([
  'icon_url',
  'name',
  'proxy_icon_url',
  'url',
]);

/**
 * Utils Embed Author Structure, used for [Embed] Structures
 * @category Utils
 */
export class EmbedAuthor extends Structure {
  readonly _keys = keysEmbedAuthor;

  iconUrl?: string;
  name?: string;
  proxyIconUrl?: string;
  url?: string;

  constructor(data: BaseStructureData) {
    super();
    this.merge(data);
  }
}


const keysEmbedField = new BaseSet<string>([
  'inline',
  'name',
  'value',
]);

/**
 * Utils Embed Field Structure, used for [Embed] Structures
 * @category Utils
 */
export class EmbedField extends Structure {
  readonly _keys = keysEmbedField;

  inline?: boolean;
  name: string = '';
  value: string = '';

  constructor(data: BaseStructureData) {
    super();
    this.merge(data);
  }
}


const keysEmbedFooter = new BaseSet<string>([
  'icon_url',
  'proxy_icon_url',
  'text',
]);

/**
 * Utils Embed Footer Structure, used for [Embed] Structures
 * @category Utils
 */
export class EmbedFooter extends Structure {
  readonly _keys = keysEmbedFooter;

  iconUrl?: string;
  proxyIconUrl?: string;
  text: string = '';

  constructor(data: BaseStructureData) {
    super();
    this.merge(data);
  }
}


const keysEmbedImage = new BaseSet<string>([
  'height',
  'proxy_url',
  'url',
  'width',
]);

/**
 * Utils Embed Image Structure, used for [Embed] Structures
 * @category Utils
 */
export class EmbedImage extends Structure {
  readonly _keys = keysEmbedImage;

  height?: number;
  proxyUrl?: string;
  url: string = '';
  width?: number;

  constructor(data: BaseStructureData) {
    super();
    this.merge(data);
  }
}


const keysEmbedProvider = new BaseSet<string>([
  'name',
  'url',
]);

/**
 * Utils Provider Structure, used for [Embed] Structures
 * @category Utils
 */
export class EmbedProvider extends Structure {
  readonly _keys = keysEmbedProvider;

  name?: string;
  url?: string;

  constructor(data: BaseStructureData) {
    super();
    this.merge(data);
  }
}


/**
 * Utils Embed Thumbnail Structure, used for [Embed] Structures
 * @category Utils
 */
export class EmbedThumbnail extends EmbedImage {

}


/**
 * Utils Embed Video Structure, used for [Embed] Structures
 * @category Utils
 */
export class EmbedVideo extends EmbedImage {

}
