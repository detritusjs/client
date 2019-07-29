import { ShardClient } from '../client';
import {
  MessageEmbedTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import {
  EmbedFooter,
  EmbedThumbnail,
} from './embed';


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
  footer: EmbedFooter | null = null;
  gameId: string = this.applicationId;
  id: string = '';
  thumbnail: EmbedThumbnail | null = null;
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
        value = new EmbedFooter(this.client, value);
      }; break;
      case 'thumbnail': {
        value = new EmbedThumbnail(this.client, value);
      }; break;
      case 'timestamp': {
        value = new Date(value);
      }; break;
    }
    super.mergeValue.call(this, key, value);
  }
}
