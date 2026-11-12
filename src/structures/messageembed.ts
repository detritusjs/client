import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  MEDIA_ATTACHMENT_URL_PREFIX,
  DetritusKeys,
  DiscordKeys,
  MessageComponentTypes,
  MessageEmbedFlags,
  MessageEmbedPollResultFields,
  MessageEmbedTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
} from './basestructure';
import { ComponentContainer, ComponentUnknown } from './components';


export interface MessageEmbedPollResult {
  questionText: string,
  totalVotes: number,
  victorAnswerId: null | number,
  victorAnswerText: null | string,
  victorAnswerVotes: number,
  victorEmoji: null | {animated: boolean, id: null | string, name: null | string},
}

const keysMessageEmbed = new BaseSet<string>([
  DiscordKeys.AUDIO,
  DiscordKeys.AUTHOR,
  DiscordKeys.COLOR,
  DiscordKeys.COMPONENTS,
  DiscordKeys.CONTENT_SCAN_VERSION,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.FIELDS,
  DiscordKeys.FLAGS,
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
  static { setStructureKeys(this, '_keys', keysMessageEmbed); }

  declare audio?: MessageEmbedAudio;
  declare author?: MessageEmbedAuthor;
  declare color?: number;
  // only on `components` type embeds (link previews built from components), holds a single container
  declare components?: BaseCollection<number, ComponentContainer | ComponentUnknown>;
  // which version of discord's content scanner the `flags` came from
  declare contentScanVersion?: number;
  declare description?: string;
  declare fields?: BaseCollection<number, MessageEmbedField>;
  declare flags?: number;
  declare footer?: MessageEmbedFooter;
  declare image?: MessageEmbedImage;
  declare provider?: MessageEmbedProvider;
  declare referenceId?: string;
  declare thumbnail?: MessageEmbedThumbnail;
  declare timestamp?: Date;
  declare title?: string;
  type: MessageEmbedTypes = MessageEmbedTypes.RICH;
  declare url?: string;
  declare video?: MessageEmbedVideo;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  // content scanning can finish after the message is sent, these might only show up in a later message update
  get containsExplicitContent(): boolean {
    return this.hasFlag(MessageEmbedFlags.CONTAINS_EXPLICIT_MEDIA);
  }

  get containsGoreContent(): boolean {
    return this.hasFlag(MessageEmbedFlags.CONTAINS_GORE_CONTENT);
  }

  get containsSelfHarmContent(): boolean {
    return this.hasFlag(MessageEmbedFlags.CONTAINS_SELF_HARM_CONTENT);
  }

  get hasAttachment(): boolean {
    return !!(
      (this.audio && this.audio.hasAttachment) ||
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

  get isAudio(): boolean {
    return this.type === MessageEmbedTypes.AUDIO;
  }

  get isAutoModerationMessage(): boolean {
    return this.type === MessageEmbedTypes.AUTO_MODERATION_MESSAGE;
  }

  get isAutoModerationNotification(): boolean {
    return this.type === MessageEmbedTypes.AUTO_MODERATION_NOTIFICATION;
  }

  get isComponents(): boolean {
    return this.type === MessageEmbedTypes.COMPONENTS;
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

  get isPollResult(): boolean {
    return this.type === MessageEmbedTypes.POLL_RESULT;
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

  /**
   * The finished poll's outcome on `poll_result` embeds, discord sends it as named `fields` with string values
   * `null` when this isn't a poll result embed
   */
  get pollResult(): MessageEmbedPollResult | null {
    if (!this.isPollResult || !this.fields) {
      return null;
    }
    const answerId = this.getFieldValue(MessageEmbedPollResultFields.VICTOR_ANSWER_ID);
    const emojiId = this.getFieldValue(MessageEmbedPollResultFields.VICTOR_ANSWER_EMOJI_ID);
    const emojiName = this.getFieldValue(MessageEmbedPollResultFields.VICTOR_ANSWER_EMOJI_NAME);
    return {
      questionText: this.getFieldValue(MessageEmbedPollResultFields.POLL_QUESTION_TEXT) || '',
      totalVotes: parseInt(this.getFieldValue(MessageEmbedPollResultFields.TOTAL_VOTES) || '0', 10) || 0,
      // no victor fields are sent when nobody voted or it was a tie
      victorAnswerId: (answerId !== undefined) ? parseInt(answerId, 10) : null,
      victorAnswerText: this.getFieldValue(MessageEmbedPollResultFields.VICTOR_ANSWER_TEXT) || null,
      victorAnswerVotes: parseInt(this.getFieldValue(MessageEmbedPollResultFields.VICTOR_ANSWER_VOTES) || '0', 10) || 0,
      victorEmoji: (emojiId !== undefined || emojiName !== undefined) ? {
        animated: this.getFieldValue(MessageEmbedPollResultFields.VICTOR_ANSWER_EMOJI_ANIMATED) === 'true',
        id: emojiId || null,
        name: emojiName || null,
      } : null,
    };
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

  /**
   * The value of the first field with this name
   * system embeds (automod alerts, poll results) store their data in fields, see the `MessageEmbed*Fields` enums for the names
   */
  getFieldValue(name: string): string | undefined {
    if (this.fields) {
      for (let field of this.fields.values()) {
        if (field.name === name) {
          return field.value;
        }
      }
    }
    return undefined;
  }

  hasFlag(flag: number): boolean {
    return ((this.flags || 0) & flag) === flag;
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

    if (DiscordKeys.AUDIO in data) {
      const value = new MessageEmbedAudio(this.client, data[DiscordKeys.AUDIO], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.AUDIO]] = value;
    }
    if (DiscordKeys.AUTHOR in data) {
      const value = new MessageEmbedAuthor(this.client, data[DiscordKeys.AUTHOR], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.AUTHOR]] = value;
    }
    if (DiscordKeys.COLOR in data) {
      (this as any)[DetritusKeys[DiscordKeys.COLOR]] = data[DiscordKeys.COLOR];
    }
    if (DiscordKeys.COMPONENTS in data) {
      const value = data[DiscordKeys.COMPONENTS];
      if (value && value.length) {
        if (!this.components) {
          this.components = new BaseCollection<number, ComponentContainer | ComponentUnknown>();
        }
        this.components.clear();
        for (let i = 0; i < value.length; i++) {
          const raw = value[i];
          if (raw.type === MessageComponentTypes.CONTAINER) {
            this.components.set(i, new ComponentContainer(this.client, raw, this._clone));
          } else {
            this.components.set(i, new ComponentUnknown(this.client, raw, this._clone));
          }
        }
      } else {
        this.components = undefined;
      }
    }
    if (DiscordKeys.CONTENT_SCAN_VERSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT_SCAN_VERSION]] = data[DiscordKeys.CONTENT_SCAN_VERSION];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
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
  static { setStructureKeys(this, '_keys', keysMessageEmbedAuthor); }

  declare iconUrl?: string;
  declare name?: string;
  declare proxyIconUrl?: string;
  declare url?: string;

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
  static { setStructureKeys(this, '_keys', keysMessageEmbedField); }

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
  static { setStructureKeys(this, '_keys', keysMessageEmbedFooter); }

  declare iconUrl?: string;
  declare proxyIconUrl?: string;
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


const keysMessageEmbedMedia = new BaseSet<string>([
  DiscordKeys.CONTENT_TYPE,
  DiscordKeys.FLAGS,
  DiscordKeys.PROXY_URL,
  DiscordKeys.URL,
]);

/**
 * Embed Media Structure, the base for the audio, image, thumbnail, and video of [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedMedia extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysMessageEmbedMedia); }

  declare contentType?: string;
  declare flags?: number;
  declare proxyUrl?: string;
  url: string = '';

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

    if (DiscordKeys.CONTENT_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT_TYPE]] = data[DiscordKeys.CONTENT_TYPE];
    }
    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
    }
    if (DiscordKeys.PROXY_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PROXY_URL]] = data[DiscordKeys.PROXY_URL];
    }
    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
  }
}


const keysMessageEmbedImage = new BaseSet<string>([
  ...keysMessageEmbedMedia,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.HEIGHT,
  DiscordKeys.PLACEHOLDER,
  DiscordKeys.PLACEHOLDER_VERSION,
  DiscordKeys.WIDTH,
].sort());

/**
 * Embed Image Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedImage extends MessageEmbedMedia {
  static { setStructureKeys(this, '_keys', keysMessageEmbedImage); }

  declare description?: string;
  height: number = 0;
  declare placeholder?: string;
  declare placeholderVersion?: number;
  width: number = 0;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    // merge after our own field defaults are set, or they'd overwrite what the parent constructor merged
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
    super.merge(data);

    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.HEIGHT in data) {
      (this as any)[DetritusKeys[DiscordKeys.HEIGHT]] = data[DiscordKeys.HEIGHT];
    }
    if (DiscordKeys.PLACEHOLDER in data) {
      (this as any)[DetritusKeys[DiscordKeys.PLACEHOLDER]] = data[DiscordKeys.PLACEHOLDER];
    }
    if (DiscordKeys.PLACEHOLDER_VERSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.PLACEHOLDER_VERSION]] = data[DiscordKeys.PLACEHOLDER_VERSION];
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
  static { setStructureKeys(this, '_keys', keysMessageEmbedProvider); }

  declare name?: string;
  declare url?: string;

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


const keysMessageEmbedAudio = new BaseSet<string>([
  ...keysMessageEmbedMedia,
  DiscordKeys.DESCRIPTION,
].sort());

/**
 * Embed Audio Structure, used for [MessageEmbed] Structures
 * @category Structure
 */
export class MessageEmbedAudio extends MessageEmbedMedia {
  static { setStructureKeys(this, '_keys', keysMessageEmbedAudio); }

  declare description?: string;

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
    super.merge(data);

    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
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
