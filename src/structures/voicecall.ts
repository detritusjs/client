import {
  ShardClient,
  VoiceConnectOptions,
} from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { VoiceConnection } from '../media/voiceconnection';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User } from './user';
import { VoiceState } from './voicestate';


const keysVoiceCall = new BaseSet<string>([
  'channel_id',
  'message_id',
  'region',
  'ringing',
  'unavailable',
]);

const keysMergeVoiceCall = new BaseSet<string>([
  'voice_states',
]);

/**
 * VoiceCall Structure
 * a DM Channel's call
 * (non-bots only)
 * @category Structure
 */
export class VoiceCall extends BaseStructure {
  readonly _keys = keysVoiceCall;
  readonly _keysMerge = keysMergeVoiceCall;

  readonly ringing = new BaseCollection<string, null | User>();

  channelId: string = '';
  messageId: string = '';
  region: string = '';
  unavailable: boolean = false;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get amBeingRinged(): boolean {
    if (this.client.user) {
      return this.isRinging(this.client.user.id);
    }
    return false;
  }

  get joined(): boolean {
    return this.client.voiceConnections.has(this.channelId);
  }

  get voiceConnection(): undefined | VoiceConnection {
    return this.client.voiceConnections.get(this.channelId);
  }

  get voiceStates(): BaseCollection<string, VoiceState> {
    if (this.client.voiceStates.has(this.channelId)) {
      return <BaseCollection<string, VoiceState>> this.client.voiceStates.get(this.channelId);
    }
    return new BaseCollection();
  }

  isRinging(userId: string) {
    return this.ringing.has(userId);
  }

  kill(): void {
    if (this.joined) {
      const connection = <VoiceConnection> this.client.voiceConnections.get(this.channelId);
      connection.kill();
    }
  }

  join(options: VoiceConnectOptions) {
    return this.client.voiceConnect(undefined, this.channelId, options);
  }

  startRinging(recipients?: Array<string>) {
    return this.client.rest.startChannelCallRinging(this.channelId, {recipients});
  }

  stopRinging(recipients?: Array<string>) {
    return this.client.rest.stopChannelCallRinging(this.channelId, {recipients});
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'ringing': {
          this.ringing.clear();
          for (let userId of value.ringing) {
            if (this.client.users.has(userId)) {
              this.ringing.set(userId, <User> this.client.users.get(userId));
            } else {
              this.ringing.set(userId, null);
            }
          }
        }; return;
        case 'voice_states': {
          if (this.client.voiceStates.enabled) {
            const cache = this.client.voiceStates.insertCache(this.channelId);
            cache.clear();

            for (let raw of value) {
              if (this.client.voiceStates.has(this.channelId, raw.user_id)) {
                (<VoiceState> this.client.voiceStates.get(this.channelId, raw.user_id)).merge(raw);
              } else {
                this.client.voiceStates.insert(new VoiceState(this.client, raw));
              }
            }
          }
        }; return;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}
