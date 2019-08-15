import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Guild } from '../structures';


/**
 * @category Collection Options
 */
export interface GuildsOptions extends BaseClientCollectionOptions {
  
};

/**
 * Guilds Collection
 * @category Collections
 */
export class Guilds extends BaseClientCollection<string, Guild> {
  insert(guild: Guild): void {
    if (this.enabled) {
      this.set(guild.id, guild);
    }
  }

  get [Symbol.toStringTag](): string {
    return `Guilds (${this.size.toLocaleString()} items)`;
  }
}
