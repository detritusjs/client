import {
  BaseClientCollectionCache,
  BaseClientCollectionOptions,
} from './basecollection';

import { VoiceState } from '../structures/voicestate';


/**
 * @category Collection Options
 */
export interface VoiceStatesOptions extends BaseClientCollectionOptions {

};

/**
 * VoiceState Collection
 * @category Collections
 */
export class VoiceStates extends BaseClientCollectionCache<string, VoiceState> {
  insert(voiceState: VoiceState): void {
    if (this.enabled) {
      const cache = this.insertCache(voiceState.serverId);
      cache.set(voiceState.userId, voiceState);
    }
  }

  delete(serverId: string): boolean;
  delete(serverId: string | null | undefined, userId: string): boolean;
  delete(serverId?: string | null, userId?: string | null): boolean {
    const deleted = (super.delete as Function).call(this, serverId, userId);
    if (userId) {
      // drop a server's cache once everyone left, otherwise every dm call leaves an empty one behind
      // (the guild/channel/call `voiceStates` getters fall back to an empty collection)
      if (serverId) {
        const cache = this.caches.get(serverId);
        if (cache && !cache.length) {
          this.caches.delete(serverId);
        }
      } else {
        for (let [cacheKey, cache] of this.caches) {
          if (!cache.length) {
            this.caches.delete(cacheKey);
          }
        }
      }
    }
    return deleted;
  }

  get [Symbol.toStringTag](): string {
    return `VoiceStates (${this.caches.size.toLocaleString()} caches, ${this.size.toLocaleString()} items)`;
  }
}
