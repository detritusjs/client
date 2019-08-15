import {
  BaseClientCollectionCache,
  BaseClientCollectionOptions,
} from './basecollection';

import { ShardClient } from '../client';
import { Member } from '../structures';


/**
 * @category Collection Options
 */
export interface MembersOptions extends BaseClientCollectionOptions {
  storeOffline?: boolean,
};

/**
 * Members Collection
 * @category Collections
 */
export class Members extends BaseClientCollectionCache<string, Member> {
  // default behavior since presence updates dont give us the member object if we've received it before
  storeOffline: boolean = true;

  constructor(client: ShardClient, options: MembersOptions = {}) {
    super(client, options);
    this.storeOffline = !!(options.storeOffline || options.storeOffline === undefined);
    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      storeOffline: {configurable: true, writable: false},
    });
  }

  setStoreOffline(value: boolean): void {
    Object.defineProperty(this, 'storeOffline', {value});
  }

  insert(member: Member): void {
    const cache = this.insertCache(member.guildId);
    if (member.isMe) {
      cache.set(member.id, member);
    } else {
      if (this.enabled) {
        if (this.storeOffline) {
          cache.set(member.id, member);
        } else {
          if (!member.isOffline) {
            cache.set(member.id, member);
          }
        }
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Members (${this.caches.size.toLocaleString()} guilds, ${this.size.toLocaleString()} items)`;
  }
}
