import {
  ShardClient,
  VoiceConnectOptions,
} from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';
import { VoiceConnection } from '../media/voiceconnection';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { User } from './user';
import { VoiceState } from './voicestate';


const keysVoiceCall = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.MESSAGE_ID,
  DiscordKeys.REGION,
  DiscordKeys.RINGING,
  DiscordKeys.UNAVAILABLE,
  DiscordKeys.VOICE_STATES,
]);

const keysMergeVoiceCall = new BaseSet<string>([
  DiscordKeys.VOICE_STATES,
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

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get amBeingRinged(): boolean {
    if (this.client.user) {
      return this.isRinging(this.client.user.id);
    }
    return false;
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) || null;
  }

  get joined(): boolean {
    return this.client.voiceConnections.has(this.channelId);
  }

  get voiceConnection(): null | VoiceConnection {
    return this.client.voiceConnections.get(this.channelId) || null;
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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.VOICE_STATES in data) {
      // cannot clone the voice states since it's not stored on the object
      if (this.client.voiceStates.enabled && !this.isClone) {
        const cache = this.client.voiceStates.insertCache(this.channelId);
        cache.clear();

        for (let raw of data[DiscordKeys.VOICE_STATES]) {
          if (this.client.voiceStates.has(this.channelId, raw.user_id)) {
            (this.client.voiceStates.get(this.channelId, raw.user_id) as VoiceState).merge(raw);
          } else {
            this.client.voiceStates.insert(new VoiceState(this.client, raw));
          }
        }
      }
    }
    if (DiscordKeys.CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_ID]] = data[DiscordKeys.CHANNEL_ID];
    }
    if (DiscordKeys.MESSAGE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.MESSAGE_ID]] = data[DiscordKeys.MESSAGE_ID];
    }
    if (DiscordKeys.REGION in data) {
      (this as any)[DetritusKeys[DiscordKeys.REGION]] = data[DiscordKeys.REGION];
    }
    if (DiscordKeys.RINGING in data) {
      this.ringing.clear();
      for (let userId of data[DiscordKeys.RINGING]) {
        if (this.client.users.has(userId)) {
          this.ringing.set(userId, this.client.users.get(userId) as User);
        } else {
          this.ringing.set(userId, null);
        }
      }
    }
    if (DiscordKeys.UNAVAILABLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.UNAVAILABLE]] = data[DiscordKeys.UNAVAILABLE];
    }
  }
}
