import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysVoiceRegion = new BaseSet<string>([
  DiscordKeys.CUSTOM,
  DiscordKeys.DEPRECATED,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.OPTIMAL,
  DiscordKeys.VIP,
]);

/**
 * Voice Region Structure
 * @category Structure
 */
export class VoiceRegion extends BaseStructure {
  readonly _keys = keysVoiceRegion;

  custom: boolean = false;
  deprecated: boolean = false;
  id: string = '';
  name: string = '';
  optimal: boolean = false;
  vip: boolean = false;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CUSTOM in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM]] = data[DiscordKeys.CUSTOM];
    }
    if (DiscordKeys.DEPRECATED in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEPRECATED]] = data[DiscordKeys.DEPRECATED];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.OPTIMAL in data) {
      (this as any)[DetritusKeys[DiscordKeys.OPTIMAL]] = data[DiscordKeys.OPTIMAL];
    }
    if (DiscordKeys.VIP in data) {
      (this as any)[DetritusKeys[DiscordKeys.VIP]] = data[DiscordKeys.VIP];
    }
  }

  toString(): string {
    return this.name;
  }
}
