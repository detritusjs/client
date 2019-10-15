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
  insert(value: GatewayRawEvents.RawPresence): Presence {
    const guildId = value.guild_id || LOCAL_GUILD_ID;
    for (let activity of value.activities) {
      Object.assign(activity, {guild_id: guildId});
    }

    let presence: Presence;
    if (this.enabled) {
      if (this.has(value.user.id)) {
        presence = <Presence> this.get(value.user.id);
        if (value.status === PresenceStatuses.OFFLINE) {
          presence._deleteGuildId(guildId);
          if (presence._shouldDelete) {
            this.delete(presence.user.id);
            presence.merge(value);
          }
        } else {
          presence.merge(value);
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

  clearGuildId(guildId: string): void {
    for (let [userId, presence] of this) {
      presence._deleteGuildId(guildId);
      if (presence._shouldDelete) {
        this.delete(userId);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Presences (${this.size.toLocaleString()} items)`;
  }
}
