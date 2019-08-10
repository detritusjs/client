import { ShardClient } from '../client';
import {
  MessageCacheTypes,
  MESSAGE_CACHE_TYPES,
} from '../constants';
import { Message } from '../structures';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';


export const DEFAULT_MESSAGES_CACHE_KEY = '@me';

export interface MessageCacheItem {
  expire: null | ReturnType<typeof setTimeout>,
  data: Message,
}

export interface MessagesCache extends BaseCollection<string, MessageCacheItem> {
  
};

/**
 * @category Collection Options
 */
export interface MessagesOptions extends BaseClientCollectionOptions {
  expire?: number,
  limit?: number,
  type?: string,
};

/**
 * Messages Collection
 * @category Collections
 */
export class Messages extends BaseClientCollection<string, MessagesCache, Message> {
  expire: number = 10 * 60 * 1000; // auto expire messages after 10 minutes
  limit: number = 1000;
  type: string = MessageCacheTypes.CHANNEL;

  constructor(client: ShardClient, options: MessagesOptions = {}) {
    super(client, options);

    this.expire = (options.expire !== undefined) ? options.expire : this.expire;
    this.limit = (options.limit !== undefined) ? options.limit : this.limit;
    Object.defineProperties(this, {
      expire: {configurable: true, writable: false},
      limit: {configurable: true, writable: false},
      type: {configurable: true, writable: false},
    });
    if (options.type !== undefined) {
      this.setType(options.type);
    }
  }

  setExpire(value: number): void {
    Object.defineProperty(this, 'expire', {value});
  }

  setLimit(value: number): void {
    Object.defineProperty(this, 'limit', {value});
  }

  setType(value: string): void {
    if (!MESSAGE_CACHE_TYPES.includes(value)) {
      throw new Error(`Invalid Cache Type, valid: ${JSON.stringify(MESSAGE_CACHE_TYPES)}`);
    }
    Object.defineProperty(this, 'type', {value});
  }

  get size(): number {
    return this.reduce((size: number, cache: MessagesCache) => {
      return size + cache.size;
    }, 0);
  }

  insert(message: Message): void {
    if (!this.enabled) {
      return;
    }

    let cache: MessagesCache;
    let cacheId = DEFAULT_MESSAGES_CACHE_KEY;
    switch (this.type) {
      case MessageCacheTypes.CHANNEL: {
        cacheId = message.channelId;
      }; break;
      case MessageCacheTypes.GUILD: {
        if (message.guildId === null) {
          cacheId = message.channelId;
        } else {
          cacheId = message.guildId;
        }
      }; break;
    }

    if (this.has(null, cacheId)) {
      cache = <MessagesCache> super.get(cacheId);
    } else {
      cache = new BaseCollection();
      super.set(cacheId, cache);
    }

    if (this.limit && this.limit <= cache.size) {
      const value = <MessageCacheItem> cache.first();
      if (value.expire !== null) {
        clearTimeout(<number> <unknown> value.expire);
        value.expire = null;
      }
      cache.delete(value.data.id);
    }

    let expire: null | ReturnType<typeof setTimeout> = null;
    if (this.expire) {
      expire = setTimeout(() => {
        cache.delete(message.id);
        if (!cache.size) {
          super.delete(cacheId);
        }
      }, this.expire);
    }
    cache.set(message.id, {
      data: message,
      expire,
    });
  }

  delete(messageId: string): boolean;
  delete(messageId: string, cacheId: string): boolean;
  delete(messageId: null | undefined, cacheId: string): boolean;
  delete(
    messageId?: null | string,
    cacheId?: null | string,
  ): boolean {
    if (this.enabled) {
      if (messageId != null) {
        if (this.type === MessageCacheTypes.GLOBAL) {
          cacheId = DEFAULT_MESSAGES_CACHE_KEY;
        }
        if (cacheId == null) {
          // search entire collection for it
          for (let [key, value] of this) {
            const cache = <MessagesCache> value;
            if (cache.has(messageId)) {
              const item = <MessageCacheItem> cache.get(messageId);
              if (item.expire !== null) {
                clearTimeout(<number> <unknown> item.expire);
                item.expire = null;
              }
              cache.delete(messageId);
              if (!cache.size) {
                super.delete(key);
              }
              return true;
            }
          }
        } else {
          // delete message from cache, if cache empty, delete from collection
          if (super.has(cacheId)) {
            const cache = <MessagesCache> super.get(cacheId);
            if (cache.has(messageId)) {
              const item = <MessageCacheItem> cache.get(messageId);
              if (item.expire !== null) {
                clearTimeout(<number> <unknown> item.expire);
                item.expire = null;
              }
              cache.delete(messageId);
              if (!cache.size) {
                super.delete(cacheId);
              }
              return true;
            }
          }
          return false;
        }
      } else if (cacheId != null) {
        // delete entire cache from collection
        if (super.has(cacheId)) {
          const cache = <MessagesCache> super.get(cacheId);
          for (let [key, value] of cache) {
            if (value.expire !== null) {
              clearTimeout(<number> <unknown> value.expire);
              value.expire = null;
            }
            cache.delete(key);
          }
        }
        return super.delete(cacheId);
      }
    }
    return false;
  }

  get(messageId: string): Message | undefined;
  get(messageId: string, cacheId: string): Message | undefined;
  get(messageId: null | undefined, cacheId: string): MessagesCache | undefined;
  get(
    messageId?: null | string,
    cacheId?: null | string,
  ): MessagesCache | Message | undefined {
    if (this.enabled) {
      if (messageId != null) {
        if (this.type === MessageCacheTypes.GLOBAL) {
          cacheId = DEFAULT_MESSAGES_CACHE_KEY;
        }
        if (cacheId == null) {
          // search entire collection for it
          for (let [key, value] of this) {
            const cache = <MessagesCache> value;
            if (cache.has(messageId)) {
              return (<MessageCacheItem> cache.get(messageId)).data;
            }
          }
        } else {
          if (super.has(cacheId)) {
            const cache = <MessagesCache> super.get(cacheId);
            if (cache.has(messageId)) {
              const { data } = <MessageCacheItem> cache.get(messageId);
              return data;
            }
          }
        }
      } else if (cacheId != null) {
        return super.get(cacheId);
      }
    }
  }

  has(messageId: string): boolean;
  has(messageId: string, cacheId: string): boolean;
  has(messageId: null | undefined, cacheId: string): boolean;
  has(
    messageId?: null | string,
    cacheId?: null | string,
  ): boolean {
    if (this.enabled) {
      if (messageId != null) {
        if (this.type === MessageCacheTypes.GLOBAL) {
          cacheId = DEFAULT_MESSAGES_CACHE_KEY;
        }
        if (cacheId == null) {
          // search entire collection for it
          for (let [key, value] of this) {
            const cache = <MessagesCache> value;
            if (cache.has(messageId)) {
              return true;
            }
          }
        } else {
          if (super.has(cacheId)) {
            const cache = <MessagesCache> super.get(cacheId);
            return cache.has(messageId);
          }
          return false;
        }
      } else if (cacheId != null) {
        return super.has(cacheId);
      }
    }
    return false;
  }

  clear(shardId?: number): void {
    for (let [cacheId, cache] of this) {
      this.delete(null, cacheId);
    }
    return super.clear();
  }

  toString(): string {
    return `${this.size} Messages`;
  }
}
