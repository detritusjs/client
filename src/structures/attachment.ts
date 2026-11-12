import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageAttachmentFlags, SPOILER_ATTACHMENT_PREFIX } from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
  setStructureUncloneable,
} from './basestructure';


// anchored, these are matched against the whole extension (otherwise `gifts` would be an image)
export const EmbeddableRegexes = Object.freeze({
  audio: /^(?:mp3|ogg|wav|flac)$/i,
  image: /^(?:png|jpe?g|webp|gif)$/i,
  video: /^(?:mp4|webm|mov)$/i,
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
    // before `image` since it's an `image/` mimetype too
    type: 'mime',
    classType: 'photoshop',
    regex: /^image\/vnd.adobe.photoshop/,
  },
  {
    type: 'mime',
    classType: 'image',
    regex: /^image\//,
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


/**
 * Unix ms of when a signed attachment url expires, 0 if it isn't signed
 */
export function getAttachmentUrlExpiry(url: string): number {
  if (!url) {
    return 0;
  }
  try {
    const expires = new URL(url).searchParams.get('ex');
    const seconds = (expires) ? parseInt(expires, 16) : NaN;
    return (Number.isFinite(seconds)) ? seconds * 1000 : 0;
  } catch(error) {
    return 0;
  }
}


const keysAttachment = new BaseSet<string>([
  DiscordKeys.APPLICATION,
  DiscordKeys.CLIP_CREATED_AT,
  DiscordKeys.CLIP_PARTICIPANTS,
  DiscordKeys.CONTENT_SCAN_VERSION,
  DiscordKeys.CONTENT_TYPE,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.DURATION_SECS,
  DiscordKeys.EPHEMERAL,
  DiscordKeys.FILENAME,
  DiscordKeys.FLAGS,
  DiscordKeys.HEIGHT,
  DiscordKeys.ID,
  DiscordKeys.ORIGINAL_CONTENT_TYPE,
  DiscordKeys.PLACEHOLDER,
  DiscordKeys.PLACEHOLDER_VERSION,
  DiscordKeys.PROXY_URL,
  DiscordKeys.SIZE,
  DiscordKeys.TITLE,
  DiscordKeys.URL,
  DiscordKeys.WAVEFORM,
  DiscordKeys.WIDTH,
]);

/**
 * Attachment Structure, used in [Message] or [Interaction] objects
 * @category Structure
 */
export class Attachment extends BaseStructure {
  static { setStructureUncloneable(this); }
  static { setStructureKeys(this, '_keys', keysAttachment); }

  // partial application, only on clips
  declare application?: any;
  // only on clips, iso8601 timestamp
  declare clipCreatedAt?: string;
  // only on clips, raw users
  declare clipParticipants?: Array<any>;
  // which version of discord's content scanner checked this file
  declare contentScanVersion?: number;
  declare contentType?: string;
  declare description?: string;
  declare durationSecs?: number;
  ephemeral: boolean = false;
  filename: string = '';
  flags: number = 0;
  height: number = 0;
  id: string = '';
  // the uploaded file's type, when discord converted it (`contentType` is then the converted one)
  declare originalContentType?: string;
  declare placeholder?: string;
  declare placeholderVersion?: number;
  proxyUrl: string = '';
  size: number = 0;
  // the original filename, before discord sanitized it
  declare title?: string;
  url: string = '';
  declare waveform?: string;
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

  /**
   * When the signed cdn url stops working, from its `ex` query parameter (hex unix seconds)
   */
  get expiresAt(): Date | null {
    const unix = this.expiresAtUnix;
    return (unix) ? new Date(unix) : null;
  }

  get expiresAtUnix(): number {
    return getAttachmentUrlExpiry(this.url) || getAttachmentUrlExpiry(this.proxyUrl);
  }

  get isExpired(): boolean {
    const unix = this.expiresAtUnix;
    return !!unix && unix <= Date.now();
  }

  get extension(): string {
    // no '.' means no extension, not the whole filename
    const index = this.filename.lastIndexOf('.');
    return (index === -1) ? '' : this.filename.slice(index + 1);
  }

  get containsExplicitMedia(): boolean {
    return this.hasFlag(MessageAttachmentFlags.CONTAINS_EXPLICIT_MEDIA);
  }

  get containsGoreContent(): boolean {
    return this.hasFlag(MessageAttachmentFlags.CONTAINS_GORE_CONTENT);
  }

  get containsSelfHarmContent(): boolean {
    return this.hasFlag(MessageAttachmentFlags.CONTAINS_SELF_HARM_CONTENT);
  }

  get hasSpoiler(): boolean {
    if ((this.flags & MessageAttachmentFlags.IS_SPOILER) === MessageAttachmentFlags.IS_SPOILER) {
      return true;
    }
    return this.filename.startsWith(SPOILER_ATTACHMENT_PREFIX);
  }

  get hasTimelineComments(): boolean {
    return this.hasFlag(MessageAttachmentFlags.HAS_TIMELINE_COMMENTS);
  }

  get isAnimated(): boolean {
    return this.hasFlag(MessageAttachmentFlags.IS_ANIMATED);
  }

  get isClip(): boolean {
    return this.hasFlag(MessageAttachmentFlags.IS_CLIP);
  }

  get isRemix(): boolean {
    return this.hasFlag(MessageAttachmentFlags.IS_REMIX);
  }

  get isThumbnail(): boolean {
    return this.hasFlag(MessageAttachmentFlags.IS_THUMBNAIL);
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
    return this.contentType || '';
  }

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CONTENT_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT_TYPE]] = data[DiscordKeys.CONTENT_TYPE];
    }
    if (DiscordKeys.CONTENT_SCAN_VERSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT_SCAN_VERSION]] = data[DiscordKeys.CONTENT_SCAN_VERSION];
    }
    if (DiscordKeys.ORIGINAL_CONTENT_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.ORIGINAL_CONTENT_TYPE]] = data[DiscordKeys.ORIGINAL_CONTENT_TYPE];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.APPLICATION in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION]] = data[DiscordKeys.APPLICATION];
    }
    if (DiscordKeys.CLIP_CREATED_AT in data) {
      (this as any)[DetritusKeys[DiscordKeys.CLIP_CREATED_AT]] = data[DiscordKeys.CLIP_CREATED_AT];
    }
    if (DiscordKeys.CLIP_PARTICIPANTS in data) {
      (this as any)[DetritusKeys[DiscordKeys.CLIP_PARTICIPANTS]] = data[DiscordKeys.CLIP_PARTICIPANTS];
    }
    if (DiscordKeys.DURATION_SECS in data) {
      (this as any)[DetritusKeys[DiscordKeys.DURATION_SECS]] = data[DiscordKeys.DURATION_SECS];
    }
    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
    }
    if (DiscordKeys.PLACEHOLDER in data) {
      (this as any)[DetritusKeys[DiscordKeys.PLACEHOLDER]] = data[DiscordKeys.PLACEHOLDER];
    }
    if (DiscordKeys.PLACEHOLDER_VERSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.PLACEHOLDER_VERSION]] = data[DiscordKeys.PLACEHOLDER_VERSION];
    }
    if (DiscordKeys.TITLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TITLE]] = data[DiscordKeys.TITLE];
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
    if (DiscordKeys.WAVEFORM in data) {
      (this as any)[DetritusKeys[DiscordKeys.WAVEFORM]] = data[DiscordKeys.WAVEFORM];
    }
    if (DiscordKeys.WIDTH in data) {
      (this as any)[DetritusKeys[DiscordKeys.WIDTH]] = data[DiscordKeys.WIDTH];
    }
  }

  toString(): string {
    return this.filename;
  }
}
