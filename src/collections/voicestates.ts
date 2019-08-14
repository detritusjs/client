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
    const cache = this.insertCache(voiceState.serverId);
    if (this.enabled) {
      cache.set(voiceState.userId, voiceState);
    }
  }

  toString(): string {
    return `${this.size} VoiceStates`;
  }
}
