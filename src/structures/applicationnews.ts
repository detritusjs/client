import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  MessageEmbedTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import {
  MessageEmbedFooter,
  MessageEmbedThumbnail,
} from './messageembed';


const keysApplicationNews = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.CATEGORY,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.FLAGS,
  DiscordKeys.FOOTER,
  DiscordKeys.GAME_ID,
  DiscordKeys.ID,
  DiscordKeys.THUMBNAIL,
  DiscordKeys.TIMESTAMP,
  DiscordKeys.TITLE,
  DiscordKeys.TYPE,
  DiscordKeys.URL,
]);

/**
 * Application News Structure
 * @category Structure
 */
export class ApplicationNews extends BaseStructure {
  readonly _keys = keysApplicationNews;

  applicationId: string = '';
  category: null = null;
  description: string = '';
  flags: number = 0;
  footer?: MessageEmbedFooter;
  gameId: string = '';
  id: string = '';
  thumbnail?: MessageEmbedThumbnail;
  timestamp!: Date;
  title: string = '';
  type: string = MessageEmbedTypes.APPLICATION_NEWS;
  url?: string;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.APPLICATION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = data[DiscordKeys.APPLICATION_ID];
      if (!(DiscordKeys.GAME_ID in data)) {
        // game_id is the application id
        (this as any)[DetritusKeys[DiscordKeys.GAME_ID]] = data[DiscordKeys.APPLICATION_ID];
      }
    }
    if (DiscordKeys.CATEGORY in data) {
      (this as any)[DetritusKeys[DiscordKeys.CATEGORY]] = data[DiscordKeys.CATEGORY];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
    }
    if (DiscordKeys.FOOTER in data) {
      const value = new MessageEmbedFooter(this.client, data[DiscordKeys.FOOTER]);
      (this as any)[DetritusKeys[DiscordKeys.FOOTER]] = value;
    }
    if (DiscordKeys.GAME_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GAME_ID]] = data[DiscordKeys.GAME_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.THUMBNAIL in data) {
      const value = new MessageEmbedThumbnail(this.client, data[DiscordKeys.THUMBNAIL]);
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
  }
}
