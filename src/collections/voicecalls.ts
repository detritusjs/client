import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { VoiceCall } from '../structures/voicecall';


export interface VoiceCallsOptions extends BaseClientCollectionOptions {};

export class VoiceCalls extends BaseClientCollection<string, VoiceCall> {
  defaultKey = 'channelId';

  insert(call: VoiceCall): void {
    if (this.enabled) {
      this.set(call.channelId, call);
    }
  }

  toString(): string {
    return `${this.size} VoiceCalls`;
  }
}
