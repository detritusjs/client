import { Timers } from 'detritus-utils';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { ClientEvents, DiscordKeys, TYPING_TIMEOUT } from '../constants';
import { GatewayClientEvents } from '../gateway/clientevents';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { Member } from './member';
import { User } from './user';


const keysTyping = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.GUILD_ID,
  DiscordKeys.MEMBER,
  DiscordKeys.STARTED,
  DiscordKeys.STOPPED,
  DiscordKeys.TIMESTAMP,
  DiscordKeys.USER,
  DiscordKeys.USER_ID,
]);

const keysMergeTyping = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
]);

/**
 * Channel Typing Structure
 * used to tell you when someone starts typing in a channel
 * @category Structure
 */
export class Typing extends BaseStructure {
  readonly _keys = keysTyping;
  readonly _keysMerge = keysMergeTyping;
  readonly timeout = new Timers.Timeout();

  channelId: string = '';
  guildId?: string;
  member?: Member;
  started: number = 0;
  stopped: number = 0;
  timestamp: number = 0;
  userId: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);

    Object.defineProperty(this, 'timeout', {enumerable: false});
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) || null;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get shouldStopAt(): number {
    return this.timestamp + TYPING_TIMEOUT;
  }

  get user(): null | User {
    return this.client.users.get(this.userId) || null;
  }

  _stop(): void {
    if (!this.stopped) {
      this.stopped = Date.now();
      this.timeout.stop();

      const cache = this.client.typings.get(this.channelId);
      if (cache) {
        cache.delete(this.userId);
        if (!cache.length) {
          this.client.typings.delete(this.channelId);
        }
      }

      const payload: GatewayClientEvents.TypingStop = {typing: this};
      this.client.emit(ClientEvents.TYPING_STOP, payload);
    }
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.MEMBER: {
          let member: Member;
          if (this.guildId && this.client.members.has(this.guildId, value.user.id)) {
            member = <Member> this.client.members.get(this.guildId, value.user.id);
            member.merge(value);
          } else {
            value.guild_id = this.guildId;
            member = new Member(this.client, value);
            this.client.members.insert(member);
          }
          value = member;
        }; break;
        case DiscordKeys.TIMESTAMP: {
          value *= 1000;

          if (!this.started) {
            this.started = value;
          }

          this.timeout.start(TYPING_TIMEOUT, () => this._stop());
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}
