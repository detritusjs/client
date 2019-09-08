import { ShardClient } from '../client';
import {
  MessageCacheTypes,
  MESSAGE_CACHE_TYPES,
} from '../constants';
import { Message } from '../structures';

import {
  BaseClientCollectionCache,
  BaseClientCollectionOptions,
} from './basecollection';


/**
 * @category Collection Options
 */
export interface MessagesOptions extends BaseClientCollectionOptions {
  expire?: number,
  limit?: number,
  type?: string,
};


const defaultsMessagesCache = Object.freeze({
  expire: 10 * 60 * 1000, // auto expire messages after 10 minutes
  limit: 1000,
});

/**
 * Messages Collection
 * @category Collections
 */
export class Messages extends BaseClientCollectionCache<string, Message> {
  type: string = MessageCacheTypes.CHANNEL;

  constructor(client: ShardClient, options: MessagesOptions = {}) {
    super(client, Object.assign({}, defaultsMessagesCache, options));

    Object.defineProperties(this, {
      expire: {configurable: true, writable: false},
      limit: {configurable: true, writable: false},
      type: {configurable: true, writable: false},
    });
    if (options.type !== undefined) {
      this.setType(options.type);
    }
  }

  setType(value: string): void {
    if (!MESSAGE_CACHE_TYPES.includes(value)) {
      throw new Error(`Invalid Cache Type, valid: ${JSON.stringify(MESSAGE_CACHE_TYPES)}`);
    }
    Object.defineProperty(this, 'type', {value});
  }

  insert(message: Message): void {
    if (!this.enabled) {
      return;
    }

    let cacheKey = message.channelId;
    switch (this.type) {
      case MessageCacheTypes.CHANNEL: {
        cacheKey = message.channelId;
      }; break;
      case MessageCacheTypes.GUILD: {
        if (message.guildId) {
          cacheKey = message.guildId;
        } else {
          cacheKey = message.channelId;
        }
      }; break;
      case MessageCacheTypes.USER: {
        cacheKey = message.author.id;
      }; break;
    }

    const cache = this.insertCache(cacheKey);
    cache.set(message.id, message);
  }

  get [Symbol.toStringTag](): string {
    return `Messages (${this.caches.size.toLocaleString()} caches, ${this.size.toLocaleString()} items)`;
  }
}
