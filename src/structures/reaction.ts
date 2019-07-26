import { Types as Options } from 'detritus-client-rest';

import { Client as ShardClient } from '../client';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Emoji } from './emoji';
import { Guild } from './guild';
import { Message } from './message';


const keys = [
  'channel_id',
  'count',
  'emoji',
  'guild_id',
  'message_id',
  'me',
];

export class Reaction extends BaseStructure {
  _defaultKeys = keys;
  channelId: string = '';
  count: number = 0;
  emoji!: Emoji;
  guildId: null | string = null;
  messageId: string = '';
  me: boolean = false;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
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

  get message(): Message | null {
    return (<Message | undefined> this.client.messages.get(this.messageId)) || null;
  }

  delete(userId: string = '@me') {
    return this.client.rest.deleteReaction(this.channelId, this.messageId, this.emoji.endpointFormat, userId);
  }

  fetchUsers(
    options: Options.FetchReactions,
  ) {
    return this.client.rest.fetchReactions(this.channelId, this.messageId, this.emoji.endpointFormat, options);
  }

  mergeValue(key: string, value: any): void {
    if (value === undefined) {
      return;
    }
    switch (key) {
      case 'emoji': {
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
