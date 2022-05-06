import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, SPOILER_ATTACHMENT_PREFIX } from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


export const EmbeddableRegexes = Object.freeze({
  audio: /mp3|ogg|wav|flac/i,
  image: /png|jpe?g|webp|gif/i,
  video: /mp4|webm|mov/i,
});

export const MimeClassTypes: Array<{
  classType: string,
  regex: RegExp,
  type: string,
}> = [
  {
    type: 'name',
    classType: 'acrobat',
    regex: /\.pdf$/i,
  },
  {
    type: 'name',
    classType: 'ae',
    regex: /\.ae/i,
  },
  {
    type: 'name',
    classType: 'ai',
    regex: /\.ai$/i,
  },
  {
    type: 'name',
    classType: 'archive',
    regex: /\.(?:rar|zip|7z|tar|tar\.gz)$/i,
  },
  {
    type: 'name',
    classType: 'audio',
    regex: /\.(?:mp3|ogg|wav|flac)$/i,
  },
  {
    type: 'name',
    classType: 'code',
    regex: /\.(?:c\+\+|cpp|cc|c|h|hpp|mm|m|json|js|rb|rake|py|asm|fs|pyc|dtd|cgi|bat|rss|java|graphml|idb|lua|o|gml|prl|sls|conf|cmake|make|sln|vbe|cxx|wbf|vbs|r|wml|php|bash|applescript|fcgi|yaml|ex|exs|sh|ml|actionscript)$/i,
  },
  {
    type: 'name',
    classType: 'document',
    regex: /\.(?:txt|rtf|doc|docx|md|pages|ppt|pptx|pptm|key|log)$/i,
  },
  {
    type: 'mime',
    classType: 'image',
    regex: /^image\//,
  },
  {
    type: 'mime',
    classType: 'photoshop',
    regex: /^image\/vnd.adobe.photoshop/,
  },
  {
    type: 'name',
    classType: 'sketch',
    regex: /\.sketch$/i,
  },
  {
    type: 'name',
    classType: 'spreadsheet',
    regex: /\.(?:xls|xlsx|numbers|csv)$/i,
  },
  {
    type: 'mime',
    classType: 'video',
    regex: /^video\//,
  },
  {
    type: 'name',
    classType: 'webcode',
    regex: /\.(?:html|xhtml|htm|js|xml|xls|xsd|css|styl)$/i,
  },
];


const keysAttachment = new BaseSet<string>([
  DiscordKeys.CONTENT_TYPE,
  DiscordKeys.EPHEMERAL,
  DiscordKeys.FILENAME,
  DiscordKeys.HEIGHT,
  DiscordKeys.ID,
  DiscordKeys.PROXY_URL,
  DiscordKeys.SIZE,
  DiscordKeys.URL,
  DiscordKeys.WIDTH,
]);

/**
 * Attachment Structure, used in [Message] or [Interaction] objects
 * @category Structure
 */
export class Attachment extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysAttachment;

  contentType?: string;
  ephemeral: boolean = false;
  filename: string = '';
  height: number = 0;
  id: string = '';
  proxyUrl?: string;
  size: number = 0;
  url?: string;
  width: number = 0;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get classType(): string {
    const mimetype = this.mimetype;
    const found = MimeClassTypes.find((search) => {
      switch (search.type) {
        case 'mime': {
          return search.regex.exec(mimetype);
        };
        case 'name': {
          return search.regex.exec(this.filename);
        };
      }
    });
    return (found) ? found.classType : 'unknown';
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get extension(): string {
    const filename = (this.filename).split('.');
    if (filename.length) {
      return <string> filename.pop();
    }
    return '';
  }

  get hasSpoiler(): boolean {
    return this.filename.startsWith(SPOILER_ATTACHMENT_PREFIX);
  }

  get isAudio(): boolean {
    return !!EmbeddableRegexes.audio.exec(this.extension);
  }

  get isImage(): boolean {
    return !!EmbeddableRegexes.image.exec(this.extension);
  }

  get isVideo(): boolean {
    return !!EmbeddableRegexes.video.exec(this.extension);
  }

  get isEmbeddable(): boolean {
    return this.isAudio || this.isImage || this.isVideo;
  }

  get mimetype(): string {
    return '';
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CONTENT_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT_TYPE]] = data[DiscordKeys.CONTENT_TYPE];
    }
    if (DiscordKeys.EPHEMERAL in data) {
      (this as any)[DetritusKeys[DiscordKeys.EPHEMERAL]] = data[DiscordKeys.EPHEMERAL];
    }
    if (DiscordKeys.FILENAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.FILENAME]] = data[DiscordKeys.FILENAME];
    }
    if (DiscordKeys.HEIGHT in data) {
      (this as any)[DetritusKeys[DiscordKeys.HEIGHT]] = data[DiscordKeys.HEIGHT];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.PROXY_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PROXY_URL]] = data[DiscordKeys.PROXY_URL];
    }
    if (DiscordKeys.SIZE in data) {
      (this as any)[DetritusKeys[DiscordKeys.SIZE]] = data[DiscordKeys.SIZE];
    }
    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
    if (DiscordKeys.WIDTH in data) {
      (this as any)[DetritusKeys[DiscordKeys.WIDTH]] = data[DiscordKeys.WIDTH];
    }
  }

  toString(): string {
    return this.filename;
  }
}
