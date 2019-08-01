import {
  BaseClientCollection,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';

import { Member } from '../structures';


export interface MembersCache extends BaseCollection<string, Member> {

};

/**
 * @category Collection Options
 */
export interface MembersOptions extends BaseClientCollectionOptions {

};

/**
 * Members Collection
 * @category Collections
 */
export class Members extends BaseClientCollection<string, MembersCache, Member> {
  get size(): number {
    return this.reduce((size: number, cache: MembersCache) => size + cache.size, 0);
  }

  insert(member: Member): void {
    if (this.enabled || member.isMe) {
      let cache: MembersCache;
      if (super.has(member.guildId)) {
        cache = <MembersCache> super.get(member.guildId);
      } else {
        cache = new BaseCollection();
        super.set(member.guildId, cache);
      }
      cache.set(member.id, member);
    }
  }

  delete(guildId: string, userId?: string): boolean {
    if (super.has(guildId)) {
      if (userId !== undefined) {
        const cache = <MembersCache> super.get(guildId);
        cache.delete(userId);
        if (!cache.size) {
          return super.delete(guildId);
        }
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
