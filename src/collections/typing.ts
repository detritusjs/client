import {
  BaseClientCollectionCache,
  BaseClientCollectionOptions,
} from './basecollection';

import { Typing } from '../structures';


/**
 * @category Collection Options
 */
export interface TypingOptions extends BaseClientCollectionOptions {

};

/**
 * Typing Collection, a collection of users currently typing
 * @category Collections
 */
export class TypingCollection extends BaseClientCollectionCache<string, Typing> {
  insert(typing: Typing): void {
    if (this.enabled) {
      const cache = this.insertCache(typing.channelId);
      cache.set(typing.userId, typing);
    }
  }

  get [Symbol.toStringTag](): string {
    return `TypingCollection (${this.caches.size.toLocaleString()} channels, ${this.size.toLocaleString()} items)`;
  }
}
