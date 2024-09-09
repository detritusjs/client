import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Emoji } from './emoji';
import { Guild } from './guild';
import { Message } from './message';


const keysReaction = new BaseSet<string>([
  DiscordKeys.BURST_COLORS,
  DiscordKeys.BURST_COUNT,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.COUNT,
  DiscordKeys.COUNT_DETAILS,
  DiscordKeys.EMOJI,
  DiscordKeys.GUILD_ID,
  DiscordKeys.IS_PARTIAL,
  DiscordKeys.MESSAGE_ID,
  DiscordKeys.ME,
  DiscordKeys.ME_BURST,
]);

/**
 * Reaction Structure, used in [Message]
 * we don't store the userIds since we only get them on reaction adds
 * @category Structure
 */
export class Reaction extends BaseStructure {
  readonly _keys = keysReaction;

  burstColors!: BaseSet<string>;
  burstCount: number = 0;
  channelId: string = '';
  count: number = 0;
  countDetails!: {burst: number, normal: number};
  emoji!: Emoji;
  guildId?: string;
  isPartial: boolean = false;
  messageId: string = '';
  me: boolean = false;
  meBurst: boolean = false;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
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

  deleteAll() {
    return this.client.rest.deleteReactionsEmoji(this.channelId, this.messageId, this.emoji.endpointFormat);
  }

  fetchUsers(options: RequestTypes.FetchReactions = {}) {
    return this.client.rest.fetchReactions(this.channelId, this.messageId, this.emoji.endpointFormat, options);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    // merge guild id first for emojis
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }

    if (DiscordKeys.BURST_COLORS in data) {
      (this as any)[DetritusKeys[DiscordKeys.BURST_COLORS]] = new BaseSet(data[DiscordKeys.BURST_COLORS]);
    }
    if (DiscordKeys.BURST_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.BURST_COUNT]] = data[DiscordKeys.BURST_COUNT];
    }
    if (DiscordKeys.CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_ID]] = data[DiscordKeys.CHANNEL_ID];
    }
    if (DiscordKeys.COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.COUNT]] = data[DiscordKeys.COUNT];
    }
    if (DiscordKeys.COUNT_DETAILS in data) {
      (this as any)[DetritusKeys[DiscordKeys.COUNT_DETAILS]] = data[DiscordKeys.COUNT_DETAILS];
    }
    if (DiscordKeys.EMOJI in data) {
      const value = data[DiscordKeys.EMOJI];

      const emojiId = value.id || value.name;
      const guildId = this.guildId || null;

      let emoji: Emoji;
      if (this.client.emojis.has(guildId, emojiId)) {
        emoji = this.client.emojis.get(guildId, emojiId) as Emoji;
      } else {
        emoji = new Emoji(this.client, value);
      }
      (this as any)[DetritusKeys[DiscordKeys.EMOJI]] = emoji;
    }
    if (DiscordKeys.IS_PARTIAL in data) {
      (this as any)[DetritusKeys[DiscordKeys.IS_PARTIAL]] = data[DiscordKeys.IS_PARTIAL];
    }
    if (DiscordKeys.MESSAGE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.MESSAGE_ID]] = data[DiscordKeys.MESSAGE_ID];
    }
    if (DiscordKeys.ME in data) {
      (this as any)[DetritusKeys[DiscordKeys.ME]] = data[DiscordKeys.ME];
    }
    if (DiscordKeys.ME_BURST in data) {
      (this as any)[DetritusKeys[DiscordKeys.ME_BURST]] = data[DiscordKeys.ME_BURST];
    }
  }
}
