import {
  BaseClientCollectionOptions,
  BaseClientGuildReferenceCache,
} from './basecollection';

import { DetritusKeys, DiscordKeys } from '../constants';
import { Emoji } from '../structures/emoji';


/**
 * @category Collection Options
 */
export interface EmojisOptions extends BaseClientCollectionOptions {
  
};

/**
 * Emojis Reference Collection
 * @category Collections
 */
export class Emojis extends BaseClientGuildReferenceCache<string, Emoji> {
  key = DetritusKeys[DiscordKeys.EMOJIS];

  insert(emoji: Emoji): void {
    if (this.enabled) {
      const guild = emoji.guild;
      if (guild) {
        guild.emojis.set(emoji.id || emoji.name, emoji);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Emojis (${this.size.toLocaleString()} items)`;
  }
}
