import { Constants as SocketConstants } from 'detritus-client-socket';

const {
  GatewayPresenceStatuses: PresenceStatuses,
} = SocketConstants;


import { ShardClient } from '../client';
import { RawPresence } from '../gateway/types';
import { Presence } from '../structures';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';


export const DEFAULT_PRESENCE_CACHE_KEY = '@me';

export interface PresencesCache extends BaseCollection<string, Presence> {
  
}

/**
 * @category Collection Options
 */
export interface PresencesOptions extends BaseClientCollectionOptions {
  storeOffline?: boolean,
};

/**
 * Presences Collection
 * @category Collections
 */
export class Presences extends BaseClientCollection<string, PresencesCache | Presence> {
  [Symbol.iterator]: () => IterableIterator<[string, PresencesCache]>;

  storeOffline: boolean;

  constructor(client: ShardClient, options: PresencesOptions = {}) {
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
    return this.reduce((size: number, cache: PresencesCache) => size + cache.size, 0);
  }

  add(value: RawPresence): Presence {
    let presence: Presence;

    const cacheId = value['guild_id'] || DEFAULT_PRESENCE_CACHE_KEY;
    if (this.has(cacheId, value.user.id)) {
      presence = <Presence> this.get(cacheId, value.user.id);
      presence.merge(value);
    } else {
      presence = new Presence(this.client, value);
      const newPresence = this.insert(presence);
      if (newPresence !== null) {
        presence = newPresence;
      }
    }
    if (!this.storeOffline && presence.status === PresenceStatuses.OFFLINE) {
      this.delete(cacheId, presence.user.id);
    }
    return presence;
  }

  insert(presence: Presence): null | Presence {
    if (!this.enabled) {
      return null;
    }

    const cacheId = presence.cacheId;
    if (!this.storeOffline && presence.status === PresenceStatuses.OFFLINE) {
      this.delete(cacheId, presence.user.id);
      return presence;
    }

    let cache: PresencesCache;
    if (super.has(cacheId)) {
      cache = <PresencesCache> super.get(cacheId);
      if (cache.has(presence.user.id)) {
        const old = <Presence> cache.get(presence.user.id);
        old.merge(presence);
        presence = old;
      } else {
        cache.set(presence.user.id, presence);
      }
    } else {
      cache = new BaseCollection();
      super.set(cacheId, cache);
      cache.set(presence.user.id, presence);
    }
    return presence;
  }

  delete(
    cacheId?: null | string,
    userId?: null | string,
  ): boolean {
    if (this.enabled) {
      if (cacheId != null) {
        if (super.has(cacheId)) {
          if (userId != null) {
            const cache = <PresencesCache> super.get(cacheId);
            const deleted = cache.delete(userId);
            if (!cache.size) {
              super.delete(cacheId);
            }
            return deleted;
          } else {
            return super.delete(cacheId);
          }
        }
      } else if (userId != null) {
        for (let [cacheId, cache] of this) {
          if (cache.has(userId)) {
            cache.delete(userId);
            if (!cache.size) {
              super.delete(cacheId);
            }
          }
        }
      }
    }
    return false;
  }

  get(
    cacheId?: null | string,
    userId?: null | string,
  ): PresencesCache | Presence | undefined {
    if (this.enabled) {
      if (cacheId != null) {
        if (super.has(cacheId)) {
          const cache = <PresencesCache> super.get(cacheId);
          if (userId != null) {
            return cache.get(userId);
          } else {
            return cache;
          }
        }
      } else if (userId != null) {
        // grab first presence we find for this userId
        for (let [cacheId, cache] of this) {
          if (cache.has(userId)) {
            return cache.get(userId);
          }
        }
      }
    }
    return undefined;
  }

  has(
    cacheId?: null | string,
    userId?: null | string,
  ): boolean {
    if (this.enabled) {
      if (cacheId != null) {
        if (super.has(cacheId)) {
          if (userId != null) {
            const cache = <PresencesCache> super.get(cacheId);
            return cache.has(userId);
          }
          return true;
        }
      } else if (userId != null) {
        for (let [cacheId, cache] of this) {
          if (cache.has(userId)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  toString(): string {
    return `${this.size} Presences`;
  }
}
