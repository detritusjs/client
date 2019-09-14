import {
  BaseClientCollectionCache,
  BaseClientCollectionOptions,
} from './basecollection';

import { Member } from '../structures';


/**
 * @category Collection Options
 */
export interface MembersOptions extends BaseClientCollectionOptions {

};

/**
 * Members Collection
 * @category Collections
 */
export class Members extends BaseClientCollectionCache<string, Member> {
  insert(member: Member): void {
    const cache = this.insertCache(member.guildId);
    if (member.isMe) {
      cache.set(member.id, member);
    } else {
      if (this.enabled) {
        cache.set(member.id, member);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Members (${this.caches.size.toLocaleString()} guilds, ${this.size.toLocaleString()} items)`;
  }
}
