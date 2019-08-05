import {
  BaseClientCollection,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';

import { ShardClient } from '../client';
import { Member } from '../structures';


export interface MembersCache extends BaseCollection<string, Member> {

};

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
export class Members extends BaseClientCollection<string, MembersCache, Member> {
  storeOffline: boolean;

  constructor(client: ShardClient, options: MembersOptions = {}) {
    super(client, options);
    this.storeOffline = !!options.storeOffline;
    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      storeOffline: {configurable: true, writable: false},
    });
  }

  setStoreOffline(value: boolean): void {
    Object.defineProperty(this, 'storeOffline', {value});
  }

  get size(): number {
    return this.reduce((size: number, cache: MembersCache) => size + cache.size, 0);
  }

  insert(member: Member): void {
    const cacheId = member.guildId;
    this.insertCache(cacheId);

    if (!member.isMe) {
      if (!this.enabled) {
        return;
      }
      if (!this.storeOffline && member.isOffline) {
        return;
      }
    }
    const cache = <MembersCache> super.get(cacheId);
    cache.set(member.id, member);
  }

  insertCache(cacheId: string): void {
    if (!super.has(cacheId)) {
      super.set(cacheId, new BaseCollection());
    }
  }

  delete(guildId: string, userId?: string): boolean {
    if (super.has(guildId)) {
      if (userId !== undefined) {
        const cache = <MembersCache> super.get(guildId);
        cache.delete(userId);
      } else {
        return super.delete(guildId);
      }
    }
    return false;
  }

  get(guildId: string): MembersCache | undefined;
  get(guildId: string, userId: string): Member | undefined;
  get(guildId: string, userId?: string): Member | MembersCache | undefined {
    if (super.has(guildId)) {
      const cache = <MembersCache> super.get(guildId);
      if (userId) {
        return cache.get(userId);
      }
      return cache;
    }
  }

  has(guildId: string): boolean;
  has(guildId: string, userId: string): boolean;
  has(guildId: string, userId?: string): boolean {
    if (super.has(guildId)) {
      if (userId) {
        return (<MembersCache> super.get(guildId)).has(userId);
      }
      return true;
    }
    return false;
  }

  toString(): string {
    return `${this.size} Members`;
  }
}
