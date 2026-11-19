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
  clear(): void {
    const typings: Array<Typing> = [];
    for (let [channelId, cache] of this.caches) {
      for (let [userId, typing] of cache) {
        typings.push(typing);
      }
    }
    super.clear();
    // no TYPING_STOP comes for these, their timers would fire for typings that are gone
    for (let typing of typings) {
      typing._stop(false);
    }
  }

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
