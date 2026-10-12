import {
  BaseClientCollectionOptions,
  BaseClientGuildReferenceCache,
} from './basecollection';

import { DetritusKeys, DiscordKeys } from '../constants';
import { SoundboardSound } from '../structures/soundboardsound';


/**
 * @category Collection Options
 */
export interface SoundboardSoundsOptions extends BaseClientCollectionOptions {

};

/**
 * Guild Soundboard Sounds Reference Collection
 * @category Collections
 */
export class SoundboardSounds extends BaseClientGuildReferenceCache<string, SoundboardSound> {
  key = DetritusKeys[DiscordKeys.SOUNDBOARD_SOUNDS];

  insert(sound: SoundboardSound): void {
    if (this.enabled) {
      const guild = sound.guild;
      if (guild) {
        guild.soundboardSounds.set(sound.soundId, sound);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `SoundboardSounds (${this.size.toLocaleString()} items)`;
  }
}
