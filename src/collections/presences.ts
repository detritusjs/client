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
          presence.guildIds.delete(guildId);
          if (presence.guildIds.length) {
            if (presence._activities) {
              for (let [activityId, activity] of presence._activities) {
                activity.guildIds.delete(guildId);
                if (!activity.guildIds.length) {
                  presence._activities.delete(activityId);
                }
              }
              if (!presence._activities.length) {
                presence._activities = undefined;
              }
            }
          } else {
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
      if (presence.guildIds.delete(guildId)) {
        if (presence.guildIds.length) {
          if (presence._activities) {
            for (let [activityId, activity] of presence._activities) {
              activity.guildIds.delete(guildId);
              if (!activity.guildIds.length) {
                presence._activities.delete(activityId);
              }
            }
            if (!presence._activities.length) {
              presence._activities = undefined;
            }
          }
        } else {
          this.delete(presence.user.id);
        }
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Presences (${this.size.toLocaleString()} items)`;
  }
}
