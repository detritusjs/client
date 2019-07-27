import { ShardClient } from '../client';
import { TYPING_TIMEOUT } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { User } from './user';


const keys = [
  'channel_id',
  'guild_id',
  'member',
  'timestamp',
  'user',
  'user_id',
];

const skipKeys = ['guild_id'];

/**
 * Channel Typing Structure
 * used to tell you when someone starts typing in a channel
 * @category Structure
 */
export class Typing extends BaseStructure {
  _defaultKeys = keys;
  _expiring: null | ReturnType<typeof setTimeout> = null;

  channelId: string = '';
  guildId: null | string = null;
  member: Member | null = null;
  timestamp: number = 0;
  userId: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);

    Object.defineProperty(this, '_expiring', {enumerable: false});
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) || null;
  }

  get guild(): Guild | null {
    if (this.guildId !== null) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get startedTypingAt(): number {
    return this.timestamp;
  }

  get stoppedTypingAt(): number {
    return this.timestamp + TYPING_TIMEOUT;
  }

  get user(): undefined | User {
    return this.client.users.get(this.userId);
  }

  merge(data: BaseStructureData): void {
    if (data.guild_id !== undefined) {
      this.mergeValue('guild_id', data.guild_id);
    }
    super.merge.call(this, data, skipKeys);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'member': {
          let member: Member;
          if (this.guildId !== null && this.client.members.has(this.guildId, value.user.id)) {
            member = <Member> this.client.members.get(this.guildId, value.user.id);
            member.merge(value);
          } else {
            value.guild_id = this.guildId;
            member = new Member(this.client, value);
            this.client.members.insert(member);
          }
          value = member;
        }; break;
        case 'timestamp': {
          if (this._expiring !== null) {
            clearTimeout(<number> <unknown> this._expiring);
            this._expiring = null;
          }
          this._expiring = setTimeout(() => {
            this.client.typing.delete(this.channelId, this.userId);
            this._expiring = null;
          }, TYPING_TIMEOUT);
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}
