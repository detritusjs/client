import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { VoiceCall } from '../structures/voicecall';


/**
 * @category Collection Options
 */
export interface VoiceCallsOptions extends BaseClientCollectionOptions {

};


/**
 * VoiceCalls Collection, DM VoiceCalls
 * (Bots cannot fill this)
 * @category Collections
 */
export class VoiceCalls extends BaseClientCollection<string, VoiceCall> {
  defaultKey = 'channelId';

  insert(call: VoiceCall): void {
    if (this.enabled) {
      this.set(call.channelId, call);
    }
  }

  get [Symbol.toStringTag](): string {
    return `VoiceCalls (${this.size.toLocaleString()} items)`;
  }
}
