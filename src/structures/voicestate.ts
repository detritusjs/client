import { RequestTypes } from 'detritus-client-rest';

import {
  ShardClient,
  VoiceConnectOptions,
} from '../client';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { Member } from './member';


const keysVoiceState: ReadonlyArray<string> = [
  'channel_id',
  'deaf',
  'guild_id',
  'member',
  'mute',
  'self_deaf',
  'self_mute',
  'self_stream',
  'self_video',
  'session_id',
  'suppress',
  'user_id',
];

const keysMergeVoiceState: ReadonlyArray<string> = [
  'guild_id',
];

/**
 * Voice State Structure
 * @category Structure
 */
export class VoiceState extends BaseStructure {
  readonly _keys = keysVoiceState;
  readonly _keysMerge = keysMergeVoiceState;

  channelId: null | string = null;
  deaf: boolean = false;
  guildId: null | string = null;
  member!: Member;
  selfDeaf: boolean = false;
  selfMute: boolean = false;
  selfStream: boolean = false;
  selfVideo: boolean = false;
  sessionId: string = '';
  suppress: boolean = false;
  userId: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get channel(): Channel | null {
    if (this.channelId !== null) {
      return this.client.channels.get(this.channelId) || null;
    }
    return null;
  }

  get guild(): Guild | null {
    if (this.guildId !== null) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get serverId(): string {
    return this.guildId || this.channelId || '';
  }

  async edit(options: RequestTypes.EditGuildMember) {
    if (this.guildId === null) {
      throw new Error('Cannot edit a user in a DM call.');
    }
    return this.client.rest.editGuildMember(this.guildId, this.userId, options);
  }

  joinVoice(options: VoiceConnectOptions) {
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

  difference(key: string, value: any): [boolean, any] {
    let differences: any;
    switch (key) {
      case 'member': break;
      default: {
        return super.difference.call(this, key, value);
      };
    }
    if (differences) {
      return [true, differences];
    }
    return [false, null];
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'member': {
          let member: Member;
          const guildId: string = this.guildId || value.guild_id;
          if (this.client.members.has(guildId, value.user.id)) {
            member = <Member> this.client.members.get(guildId, value.user.id);
            member.merge(value);
          } else {
            value.guild_id = guildId;
            member = new Member(this.client, value);
            this.client.members.insert(member);
          }
          value = member;
        }; break;
      }
      super.mergeValue.call(this, key, value);
    }
  }
}
