import {
  BaseClientCollection,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';

import { VoiceState } from '../structures/voicestate';

export interface VoiceStatesCache extends BaseCollection<string, VoiceState> {};
export interface VoiceStatesOptions extends BaseClientCollectionOptions {};

export class VoiceStates extends BaseClientCollection<string, VoiceStatesCache | VoiceState> {
  get size(): number {
    return this.reduce((size: number, cache: VoiceStatesCache) => size + cache.size, 0);
  }

  insert(voiceState: VoiceState): void {
    if (this.enabled) {
      let cache: VoiceStatesCache;
      if (super.has(voiceState.serverId)) {
        cache = <VoiceStatesCache> super.get(voiceState.serverId);
      } else {
        cache = new BaseCollection();
        super.set(voiceState.serverId, cache);
      }
      cache.set(voiceState.userId, voiceState);
    }
  }

  delete(serverId: string, userId?: string): boolean {
    if (this.enabled && super.has(serverId)) {
      if (userId) {
        const cache = <VoiceStatesCache> super.get(serverId);
        cache.delete(userId);
        if (!cache.size) {
          super.delete(serverId);
        }
      }
      return super.delete(serverId);
    }
    return false;
  }

  get(serverId: string, userId?: string): VoiceStatesCache | VoiceState | undefined {
    if (this.enabled && super.has(serverId)) {
      if (userId) {
        return (<VoiceStatesCache> super.get(serverId)).get(userId);
      }
      return super.get(serverId);
    }
  }

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
