import { ShardClient } from '../client';
import { GatewayRawEvents } from '../gateway/rawevents';
import { Presence } from '../structures';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


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
export class Presences extends BaseClientCollection<string, Presence> {
  storeOffline: boolean = false;

  constructor(client: ShardClient, options: PresencesOptions = {}) {
    super(client, options);
    this.storeOffline = !!options.storeOffline;
    Object.defineProperties(this, {
      storeOffline: {configurable: true, writable: false},
    });
  }

  setStoreOffline(value: boolean): void {
    Object.defineProperty(this, 'storeOffline', {value});
  }

  insert(value: GatewayRawEvents.RawPresence): Presence {
    for (let activity of value.activities) {
      Object.assign(activity, {guild_id: value.guild_id});
    }

    let presence: Presence;
    if (this.enabled) {
      if (this.has(value.user.id)) {
        presence = <Presence> this.get(value.user.id);
        presence.merge(value);
      } else {
        presence = new Presence(this.client, value);
        this.set(presence.user.id, presence);
      }

      if (presence.isOffline) {
        if (!this.storeOffline) {
          this.delete(presence.user.id);
        }
      }
    } else {
      presence = new Presence(this.client, value);
    }
    return presence;
  }

  clearGuildId(guildId: string): void {
    for (let [userId, presence] of this) {
      if (presence.guildIds.has(guildId)) {
        presence.guildIds.delete(guildId);
        if (!presence.guildIds.length) {
          this.delete(presence.user.id);
        }
        for (let [activityId, activity] of presence.activities) {
          activity.guildIds.delete(guildId);
          if (!activity.guildIds.length) {
            presence.activities.delete(guildId);
          }
        }
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Presences (${this.size.toLocaleString()} items)`;
  }
}
