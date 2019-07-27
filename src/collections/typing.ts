import {
  BaseClientCollection,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';

import { Typing } from '../structures';


export interface TypingCache extends BaseCollection<string, Typing> {
  
};

/**
 * @category Collection Options
 */
export interface TypingOptions extends BaseClientCollectionOptions {

};

/**
 * Typing Collection, a collection of users currently typing
 * @category Collections
 */
export class TypingCollection extends BaseClientCollection<string, TypingCache | Typing> {
  [Symbol.iterator]: () => IterableIterator<[string, TypingCache]>;

  insert(typing: Typing): void {
    if (this.enabled) {
      let cache: TypingCache;
      if (this.has(typing.channelId)) {
        cache = <TypingCache> this.get(typing.channelId);
      } else {
        cache = new BaseCollection();
        this.set(typing.channelId, cache);
      }
      cache.set(typing.userId, typing);
    }
  }

  delete(channelId: string, userId?: string): boolean {
    if (this.enabled && super.has(channelId)) {
      if (userId !== undefined) {
        const cache = <TypingCache> super.get(channelId);
        cache.delete(userId);
        if (!cache.size) {
          return super.delete(channelId);
        }
      } else {
        return super.delete(channelId);
      }
    }
    return false;
  }

  get(channelId: string, userId?: string): Typing | TypingCache | undefined {
    if (this.enabled && super.has(channelId)) {
      const cache = <TypingCache> super.get(channelId);
      if (userId) {
        return cache.get(userId);
      }
      return cache;
    }
  }

  has(channelId: string, userId?: string): boolean {
    if (this.enabled && super.has(channelId)) {
      if (userId) {
        return (<TypingCache> super.get(channelId)).has(userId);
      }
      return true;
    }
    return false;
  }

  toString(): string {
    return `${this.size} Users Typing`;
  }
}
