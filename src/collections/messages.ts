import { ShardClient } from '../client';
import { Message } from '../structures';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


/**
 * @category Collection Options
 */
export interface MessagesOptions extends BaseClientCollectionOptions {

};


const defaultsMessagesCache: MessagesOptions = Object.freeze({
  expire: 10 * 60 * 1000, // auto expire messages after 10 minutes
});

/**
 * Messages Collection
 * @category Collections
 */
export class Messages extends BaseClientCollection<string, Message> {
  constructor(client: ShardClient, options: MessagesOptions = {}) {
    super(client, Object.assign({}, defaultsMessagesCache, options));
  }

  insert(message: Message): void {
    if (this.enabled) {
      this.set(message.id, message);
    }
  }

  get [Symbol.toStringTag](): string {
    return `Messages (${this.size.toLocaleString()} items)`;
  }
}
