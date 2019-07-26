import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Guild } from '../structures';


export interface GuildsOptions extends BaseClientCollectionOptions {};

export class Guilds extends BaseClientCollection<string, Guild> {
  insert(guild: Guild): void {
    if (this.enabled) {
      this.set(guild.id, guild);
    }
  }

  toString(): string {
    return `${this.size} Guilds`;
  }
}
