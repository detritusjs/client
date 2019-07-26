import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Emoji } from '../structures/emoji';


export interface EmojisOptions extends BaseClientCollectionOptions {};

export class Emojis extends BaseClientCollection<string, Emoji> {
  insert(emoji: Emoji): void {
    if (this.enabled) {
      this.set(emoji.id || emoji.name, emoji);
    }
  }

  toString(): string {
    return `${this.size} Emojis`;
  }
}
