import { ShardClient } from '../client';
import {
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


const keysApplicationNews: ReadonlyArray<string> = [
  'application_id',
  'category',
  'description',
  'flags',
  'footer',
  'game_id',
  'id',
  'thumbnail',
  'timestamp',
  'title',
  'type',
  'url',
];

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

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case 'footer': {
        value = new MessageEmbedFooter(this.client, value);
      }; break;
      case 'thumbnail': {
        value = new MessageEmbedThumbnail(this.client, value);
      }; break;
      case 'timestamp': {
        value = new Date(value);
      }; break;
    }
    super.mergeValue.call(this, key, value);
  }
}
