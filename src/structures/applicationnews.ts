import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import {
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
  gameId: string = this.applicationId;
  id: string = '';
  thumbnail?: MessageEmbedThumbnail;
  timestamp!: Date;
  title: string = '';
  type: string = MessageEmbedTypes.APPLICATION_NEWS;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.FOOTER: {
        value = new MessageEmbedFooter(this.client, value);
      }; break;
      case DiscordKeys.THUMBNAIL: {
        value = new MessageEmbedThumbnail(this.client, value);
      }; break;
      case DiscordKeys.TIMESTAMP: {
        value = new Date(value);
      }; break;
    }
    super.mergeValue(key, value);
  }
}
