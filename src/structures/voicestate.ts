import { RequestTypes } from 'detritus-client-rest';

import {
  ShardClient,
  VoiceConnectOptions,
} from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { Member } from './member';


const keysVoiceState = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.DEAF,
  DiscordKeys.GUILD_ID,
  DiscordKeys.MEMBER,
  DiscordKeys.MUTE,
  DiscordKeys.REQUEST_TO_SPEAK_TIMESTAMP,
  DiscordKeys.SELF_DEAF,
  DiscordKeys.SELF_MUTE,
  DiscordKeys.SELF_STREAM,
  DiscordKeys.SELF_VIDEO,
  DiscordKeys.SESSION_ID,
  DiscordKeys.SUPPRESS,
  DiscordKeys.USER_ID,
]);

const keysMergeVoiceState = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
]);

const keysSkipDifferenceVoiceState = new BaseSet<string>([
  DiscordKeys.MEMBER,
]);

/**
 * Voice State Structure
 * @category Structure
 */
export class VoiceState extends BaseStructure {
  readonly _keys = keysVoiceState;
  readonly _keysMerge = keysMergeVoiceState;
  readonly _keysSkipDifference = keysSkipDifferenceVoiceState;
  _isSpeaking: boolean = false;

  channelId?: null | string;
  deaf: boolean = false;
  guildId?: null | string;
  member: Member | null = null;
  mute: boolean = false;
  requestToSpeakTimestampUnix: number = 0;
  selfDeaf: boolean = false;
  selfMute: boolean = false;
  selfStream: boolean = false;
  selfVideo: boolean = false;
  sessionId: string = '';
  suppress: boolean = false;
  userId: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    Object.defineProperties(this, {
      _isSpeaking: {enumerable: false, writable: true},
    });
    this.merge(data);
  }

  get channel(): Channel | null {
    if (this.channelId) {
      return this.client.channels.get(this.channelId) || null;
    }
    return null;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get isAudience(): boolean {
    return this.suppress || !!this.requestToSpeakTimestampUnix;
  }

  get isSpeaker(): boolean {
    return !this.suppress && !this.requestToSpeakTimestampUnix;
  }

  get isSpeaking(): boolean {
    return this._isSpeaking;
  }

  get requestToSpeakTimestamp(): Date | null {
    if (this.requestToSpeakTimestampUnix) {
      return new Date(this.requestToSpeakTimestampUnix);
    }
    return null;
  }

  get serverId(): string {
    return this.guildId || this.channelId || '';
  }

  get streamKey(): string {
    if (this.guildId) {
      return `guild:${this.guildId}:${this.channelId}:${this.userId}`;
    }
    return '';
  }

  async fetchStreamPreview() {
    if (!this.guildId) {
      throw new Error('Stream Previews are unable in a DM call.');
    }
    if (!this.selfStream) {
      throw new Error('User is not streaming');
    }
    return this.client.rest.fetchStreamPreview(this.streamKey);
  }

  async edit(options: RequestTypes.EditGuildMember) {
    if (!this.guildId) {
      throw new Error('Cannot edit a user in a DM call.');
    }
    return this.client.rest.editGuildMember(this.guildId, this.userId, options);
  }

  joinVoice(options?: VoiceConnectOptions) {
    return this.client.voiceConnect(this.guildId, this.channelId, options);
  }

  move(channelId: string) {
    return this.edit({channelId});
  }

  setDeaf(deaf: boolean) {
    return this.edit({deaf});
  }

  setMute(mute: boolean) {
    return this.edit({mute});
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.MEMBER: {
          const guildId = this.guildId as string;
          value.guild_id = guildId;

          let member: Member;
          if (this.isClone) {
            member = new Member(this.client, value, this.isClone);
          } else {
            if (this.client.members.has(guildId, value.user.id)) {
              member = this.client.members.get(guildId, value.user.id) as Member;
              member.merge(value);
            } else {
              member = new Member(this.client, value);
              this.client.members.insert(member);
            }
          }
          value = member;
        }; break;
        case DiscordKeys.REQUEST_TO_SPEAK_TIMESTAMP: {
          this.requestToSpeakTimestampUnix = (value) ? (new Date(value).getTime()) : 0;
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}
