import { ShardClient } from '../client';
import { LOCAL_GUILD_ID, PresenceStatuses } from '../constants';
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

};

/**
 * Presences Collection
 * @category Collections
 */
export class Presences extends BaseClientCollection<string, Presence> {
  // guild id -> user ids with a cached presence in it, can have stale ids so `clearGuildId()` checks the presence itself
  readonly _guildUserIds = new Map<string, Set<string>>();

  constructor(client: ShardClient, options: PresencesOptions | boolean = {}) {
    super(client, options);
    Object.defineProperty(this, '_guildUserIds', {enumerable: false});
  }

  insert(value: GatewayRawEvents.RawPresence): Presence {
    const guildId = value.guild_id || LOCAL_GUILD_ID;
    for (let activity of value.activities) {
      (activity as any).guild_id = guildId;
    }

    let presence: Presence;
    if (this.enabled) {
      if (this.has(value.user.id)) {
        presence = <Presence> this.get(value.user.id);
        if (value.status === PresenceStatuses.OFFLINE) {
          presence._deleteGuildId(guildId);
          this._unindexGuildId(guildId, value.user.id);
          if (presence._shouldDelete) {
            this.delete(presence.user.id);
            presence.merge(value);
          } else {
            // offline is user-wide, keep it for its other guilds (`merge()` re-adds this one, so drop it again)
            presence.merge(value);
            presence._deleteGuildId(guildId);
          }
        } else {
          presence.merge(value);
          this._indexGuildId(guildId, value.user.id);
        }
      } else {
        presence = new Presence(this.client, value);
        if (!presence.isOffline) {
          this.set(presence.user.id, presence);
        }
      }
    } else {
      presence = new Presence(this.client, value);
    }
    return presence;
  }

  // every removal (delete, expiring, the limit evicting) goes through `delete()`, every add through `set()`
  set(key: string, value: Presence): this {
    const old = this.cache.get(key);
    super.set(key, value);
    if (old && old !== value) {
      this._unindex(key, old);
    }
    if (this.cache.get(key) === value) {
      const guildIds = value._guildIds;
      if (typeof(guildIds) === 'string') {
        if (guildIds) {
          this._indexGuildId(guildIds, key);
        }
      } else {
        for (let guildId of guildIds) {
          this._indexGuildId(guildId, key);
        }
      }
    }
    return this;
  }

  delete(key: string): boolean {
    const presence = this.cache.get(key);
    const deleted = super.delete(key);
    if (presence) {
      this._unindex(key, presence);
    }
    return deleted;
  }

  clear(): void {
    super.clear();
    this._guildUserIds.clear();
  }

  _indexGuildId(guildId: string, userId: string): void {
    let userIds = this._guildUserIds.get(guildId);
    if (!userIds) {
      this._guildUserIds.set(guildId, userIds = new Set<string>());
    }
    userIds.add(userId);
  }

  _unindexGuildId(guildId: string, userId: string): void {
    const userIds = this._guildUserIds.get(guildId);
    if (userIds) {
      userIds.delete(userId);
      if (!userIds.size) {
        this._guildUserIds.delete(guildId);
      }
    }
  }

  _unindex(key: string, presence: Presence): void {
    const guildIds = presence._guildIds;
    if (typeof(guildIds) === 'string') {
      if (guildIds) {
        this._unindexGuildId(guildIds, key);
      }
    } else {
      for (let guildId of guildIds) {
        this._unindexGuildId(guildId, key);
      }
    }
  }

  /**
   * Removes the guild from every cached presence, deleting the presences left without one
   */
  clearGuildId(guildId: string): void {
    const userIds = this._guildUserIds.get(guildId);
    if (!userIds) {
      return;
    }
    // dropped first, so the deletes below don't change the set we're going through
    this._guildUserIds.delete(guildId);
    for (let userId of userIds) {
      const presence = this.cache.get(userId);
      if (presence && presence._hasGuildId(guildId)) {
        presence._deleteGuildId(guildId);
        if (presence._shouldDelete) {
          this.delete(userId);
        }
      }
    }
  }

  /**
   * Removes a guild from a user's cached presence (like when they leave it), deleting the presence once it has no guild left
   */
  deleteGuildId(userId: string, guildId: string): boolean {
    const presence = this.cache.get(userId);
    if (presence) {
      presence._deleteGuildId(guildId);
      this._unindexGuildId(guildId, userId);
      if (presence._shouldDelete) {
        return this.delete(userId);
      }
    }
    return false;
  }

  get [Symbol.toStringTag](): string {
    return `Presences (${this.size.toLocaleString()} items)`;
  }
}
