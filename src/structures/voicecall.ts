import {
  Client as ShardClient,
  VoiceConnectOptions,
} from '../client';
import { BaseCollection } from '../collections/basecollection';
import { VoiceStatesCache } from '../collections/voicestates';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User } from './user';
import { VoiceConnection } from './voiceconnection';
import { VoiceState } from './voicestate';


export class VoiceCall extends BaseStructure {
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
    if (this.client.user !== null) {
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

  get voiceStates(): undefined | VoiceStatesCache {
    return <undefined | VoiceStatesCache> this.client.voiceStates.get(this.channelId);
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

  merge(data: BaseStructureData): void {
    if (data.voice_states) {
      this.mergeValue('voice_states', data.voice_states);
      data.voice_states = undefined;
    }
    super.merge.call(this, data);
  }

  mergeValue(key: string, value: any): void {
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
          if (this.client.voiceStates.has(this.channelId)) {
            (<VoiceStatesCache> this.client.voiceStates.get(this.channelId)).clear();
          }
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
  }
}
