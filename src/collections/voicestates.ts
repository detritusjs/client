import {
  BaseClientCollection,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';

import { VoiceState } from '../structures/voicestate';


export interface VoiceStatesCache extends BaseCollection<string, VoiceState> {

};

/**
 * @category Collection Options
 */
export interface VoiceStatesOptions extends BaseClientCollectionOptions {

};

/**
 * VoiceState Collection
 * @category Collections
 */
export class VoiceStates extends BaseClientCollection<string, VoiceStatesCache, VoiceState> {
  get size(): number {
    return this.reduce((size: number, cache: VoiceStatesCache) => size + cache.size, 0);
  }

  insert(voiceState: VoiceState): void {
    const cacheId = voiceState.serverId;
    this.insertCache(cacheId);
    if (this.enabled) {
      const cache = <VoiceStatesCache> super.get(cacheId);
      cache.set(voiceState.userId, voiceState);
    }
  }

  insertCache(cacheId: string): void {
    if (!super.has(cacheId)) {
      super.set(cacheId, new BaseCollection());
    }
  }

  delete(serverId: string): boolean;
  delete(serverId: string, userId: string): boolean;
  delete(serverId: string, userId?: string): boolean {
    if (this.enabled && super.has(serverId)) {
      if (userId) {
        const cache = <VoiceStatesCache> super.get(serverId);
        cache.delete(userId);
      }
      return super.delete(serverId);
    }
    return false;
  }

  get(serverId: string): VoiceStatesCache | undefined;
  get(serverId: string, userId: string): VoiceState | undefined;
  get(serverId: string, userId?: string): VoiceStatesCache | VoiceState | undefined {
    if (this.enabled && super.has(serverId)) {
      if (userId) {
        return (<VoiceStatesCache> super.get(serverId)).get(userId);
      }
      return super.get(serverId);
    }
  }

  has(serverId: string): boolean;
  has(serverId: string, userId: string): boolean;
  has(serverId: string, userId?: string): boolean {
    if (this.enabled && super.has(serverId)) {
      if (userId) {
        return (<VoiceStatesCache> super.get(serverId)).has(userId);
      }
      return true;
    }
    return false;
  }

  toString(): string {
    return `${this.size} VoiceStates`;
  }
}
