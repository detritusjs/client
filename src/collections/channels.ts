import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Channel } from '../structures/channel';


export interface ChannelsOptions extends BaseClientCollectionOptions {};

export class Channels extends BaseClientCollection<string, Channel> {
  insert(channel: Channel): void {
    if (this.enabled) {
      this.set(channel.id, channel);
    }
  }

  toString(): string {
    return `${this.size} Channels`;
  }
}
