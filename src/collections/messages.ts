import { ShardClient } from '../client';
import { Message } from '../structures';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';


/**
 * @category Collection Options
 */
export interface MessagesOptions extends BaseClientCollectionOptions {

};


function addToIndex(index: Map<string, Set<string>>, id: string, messageId: string): void {
  let ids = index.get(id);
  if (!ids) {
    index.set(id, ids = new Set<string>());
  }
  ids.add(messageId);
}

function removeFromIndex(index: Map<string, Set<string>>, id: string, messageId: string): void {
  const ids = index.get(id);
  if (ids) {
    ids.delete(messageId);
    if (!ids.size) {
      index.delete(id);
    }
  }
}


const defaultsMessagesCache: MessagesOptions = Object.freeze({
  expire: 10 * 60 * 1000, // auto expire messages after 10 minutes
});

/**
 * Messages Collection
 * @category Collections
 */
export class Messages extends BaseClientCollection<string, Message> {
  // channel/guild id -> ids of its cached messages, so deleting a channel or guild doesn't go through every message
  readonly _channelMessageIds = new Map<string, Set<string>>();
  readonly _guildMessageIds = new Map<string, Set<string>>();

  constructor(client: ShardClient, options: MessagesOptions | boolean = {}) {
    if (typeof(options) === 'boolean') {
      options = {enabled: options};
    }
    super(client, Object.assign({}, defaultsMessagesCache, options));
    Object.defineProperties(this, {
      _channelMessageIds: {enumerable: false},
      _guildMessageIds: {enumerable: false},
    });
  }

  insert(message: Message): void {
    if (this.enabled) {
      this.set(message.id, message);
    }
  }

  // every removal (delete, expiring, the limit evicting) goes through `delete()`, every add through `set()`
  set(key: string, value: Message): this {
    const old = this.cache.get(key);
    super.set(key, value);
    if (old && old !== value) {
      this._unindex(key, old);
    }
    if (this.cache.get(key) === value) {
      addToIndex(this._channelMessageIds, value.channelId, key);
      if (value.guildId) {
        addToIndex(this._guildMessageIds, value.guildId, key);
      }
    }
    return this;
  }

  delete(key: string): boolean {
    const message = this.cache.get(key);
    const deleted = super.delete(key);
    if (message) {
      this._unindex(key, message);
    }
    return deleted;
  }

  clear(): void {
    super.clear();
    this._channelMessageIds.clear();
    this._guildMessageIds.clear();
  }

  _unindex(key: string, message: Message): void {
    removeFromIndex(this._channelMessageIds, message.channelId, key);
    if (message.guildId) {
      removeFromIndex(this._guildMessageIds, message.guildId, key);
    }
  }

  /**
   * The cached messages of a channel, oldest first
   */
  getChannelMessages(channelId: string): BaseCollection<string, Message> {
    const collection = new BaseCollection<string, Message>();
    const ids = this._channelMessageIds.get(channelId);
    if (ids) {
      for (let messageId of ids) {
        const message = this.cache.get(messageId);
        if (message) {
          collection.set(messageId, message);
        }
      }
    }
    return collection;
  }

  /**
   * Removes every cached message in a channel, returns them
   */
  deleteChannel(channelId: string): Array<Message> {
    return this._deleteIds(this._channelMessageIds.get(channelId));
  }

  /**
   * Removes every cached message in a guild (any of its channels or threads), returns them
   */
  deleteGuild(guildId: string): Array<Message> {
    return this._deleteIds(this._guildMessageIds.get(guildId));
  }

  _deleteIds(messageIds?: Set<string>): Array<Message> {
    const messages: Array<Message> = [];
    if (messageIds) {
      // copy, deleting removes the ids from this set
      for (let messageId of Array.from(messageIds)) {
        const message = this.cache.get(messageId);
        if (message) {
          messages.push(message);
          this.delete(messageId);
        }
      }
    }
    return messages;
  }

  get [Symbol.toStringTag](): string {
    return `Messages (${this.size.toLocaleString()} items)`;
  }
}
