import { SPOILER_ATTACHMENT_PREFIX } from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Message } from './message';


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


const keys = [
  'filename',
  'height',
  'id',
  'proxy_url',
  'size',
  'url',
  'width',
];

export class Attachment extends BaseStructure {
  _defaultKeys = keys;
  message: Message;

  filename: string = '';
  height: number = 0;
  id: string = '';
  proxyUrl: null | string = null;
  size: number = 0;
  url: null | string = null;
  width: number = 0;

  constructor(message: Message, data: BaseStructureData) {
    super(message.client);
    this.message = message;
    this.merge(data);
    Object.defineProperty(this, 'message', {enumerable: false, writable: false});
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

  toString(): string {
    return this.filename;
  }
}
