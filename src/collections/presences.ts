import { ShardClient } from '../client';
import { GatewayRawEvents } from '../gateway/rawevents';
import { Presence } from '../structures';

import {
  BaseClientCollectionCache,
  BaseClientCollectionOptions,
} from './basecollection';


export const DEFAULT_PRESENCE_CACHE_KEY = '@me';

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
export class Presences extends BaseClientCollectionCache<string, Presence> {
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

  insert(value: GatewayRawEvents.RawPresence): Presence {
    let presence: Presence;
    if (this.enabled) {
      const cacheKey = value['guild_id'] || DEFAULT_PRESENCE_CACHE_KEY;
      const cache = this.insertCache(cacheKey);

      if (cache.has(value.user.id)) {
        presence = <Presence> cache.get(value.user.id);
        presence.merge(value);
      } else {
        presence = new Presence(this.client, value);
        cache.set(value.user.id, presence);
      }
    } else {
      presence = new Presence(this.client, value);
    }
    return presence;
  }

  toString(): string {
    return `${this.size} Presences`;
  }
}
