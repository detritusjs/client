import {
  BaseClientCollectionOptions,
  BaseClientGuildReferenceCache,
} from './basecollection';

import { DetritusKeys, DiscordKeys } from '../constants';
import { GuildScheduledEvent } from '../structures/guildscheduledevent';


/**
 * @category Collection Options
 */
export interface GuildScheduledEventsOptions extends BaseClientCollectionOptions {
  
};

/**
 * Guild Scheduled Events Reference Collection
 * @category Collections
 */
export class GuildScheduledEvents extends BaseClientGuildReferenceCache<string, GuildScheduledEvent> {
  key = DetritusKeys[DiscordKeys.GUILD_SCHEDULED_EVENTS];

  insert(event: GuildScheduledEvent): void {
    if (this.enabled) {
      const guild = event.guild;
      if (guild) {
        guild.guildScheduledEvents.set(event.id, event);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Guild Scheduled Events (${this.size.toLocaleString()} items)`;
  }
}
