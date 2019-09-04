import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Emoji } from './emoji';
import { Guild } from './guild';
import { Message } from './message';


const keysReaction = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.COUNT,
  DiscordKeys.EMOJI,
  DiscordKeys.GUILD_ID,
  DiscordKeys.MESSAGE_ID,
  DiscordKeys.ME,
]);

/**
 * Reaction Structure, used in [Message]
 * we don't store the userIds since we only get them on reaction adds
 * @category Structure
 */
export class Reaction extends BaseStructure {
  readonly _keys = keysReaction;

  channelId: string = '';
  count: number = 0;
  emoji!: Emoji;
  guildId?: string;
  messageId: string = '';
  me: boolean = false;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get canClear(): boolean {
    const channel = this.channel;
    return !!(channel && channel.canManageMessages);
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

  get message(): Message | null {
    return (<Message | undefined> this.client.messages.get(this.messageId)) || null;
  }

  clear() {
    return this.client.rest.deleteReactions(this.channelId, this.messageId);
  }

  delete(userId: string = '@me') {
    return this.client.rest.deleteReaction(this.channelId, this.messageId, this.emoji.endpointFormat, userId);
  }

  fetchUsers(
    options: RequestTypes.FetchReactions,
  ) {
    return this.client.rest.fetchReactions(this.channelId, this.messageId, this.emoji.endpointFormat, options);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.EMOJI: {
          let emoji: Emoji;
          if (value.id && this.client.emojis.has(value.id)) {
            emoji = <Emoji> this.client.emojis.get(value.id);
          } else {
            emoji = new Emoji(this.client, value);
          }
          value = emoji;
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}
