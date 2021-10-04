import {
  BaseClientCollectionOptions,
  BaseClientGuildReferenceCache,
} from './basecollection';

import { DetritusKeys, DiscordKeys } from '../constants';
import { Sticker } from '../structures/sticker';


/**
 * @category Collection Options
 */
export interface StickersOptions extends BaseClientCollectionOptions {
  
};

/**
 * Stickers Reference Collection
 * @category Collections
 */
export class Stickers extends BaseClientGuildReferenceCache<string, Sticker> {
  key = DetritusKeys[DiscordKeys.STICKERS];

  insert(sticker: Sticker): void {
    if (this.enabled) {
      const guild = sticker.guild;
      if (guild) {
        guild.stickers.set(sticker.id, sticker);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Stickers (${this.size.toLocaleString()} items)`;
  }
}
