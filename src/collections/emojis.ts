import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Emoji } from '../structures/emoji';


/**
 * @category Collection Options
 */
export interface EmojisOptions extends BaseClientCollectionOptions {
  
};

/**
 * Emojis Collection
 * @category Collections
 */
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
