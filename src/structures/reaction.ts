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
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.MESSAGE_ID,
  DiscordKeys.ME,
]);

const keysMergeReaction = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
]);

/**
 * Reaction Structure, used in [Message]
 * we don't store the userIds since we only get them on reaction adds
 * @category Structure
 */
export class Reaction extends BaseStructure {
  readonly _keys = keysReaction;
  readonly _keysMerge = keysMergeReaction;

  channelId: string = '';
  count: number = 0;
  emoji!: Emoji;
  guildId?: string;
  isPartial: boolean = false;
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
    return this.client.messages.get(this.messageId) || null;
  }

  add() {
    return this.client.rest.createReaction(this.channelId, this.messageId, this.emoji.endpointFormat);
  }

  clear() {
    return this.client.rest.deleteReactions(this.channelId, this.messageId);
  }

  delete(userId: string = '@me') {
    return this.client.rest.deleteReaction(this.channelId, this.messageId, this.emoji.endpointFormat, userId);
  }

  fetchUsers(options: RequestTypes.FetchReactions = {}) {
    return this.client.rest.fetchReactions(this.channelId, this.messageId, this.emoji.endpointFormat, options);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.EMOJI: {
          const emojiId = value.id || value.name;

          let emoji: Emoji;
          if (this.client.emojis.has(this.guildId || null, emojiId)) {
            emoji = <Emoji> this.client.emojis.get(this.guildId || null, emojiId);
          } else {
            emoji = new Emoji(this.client, value);
          }
          value = emoji;
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
