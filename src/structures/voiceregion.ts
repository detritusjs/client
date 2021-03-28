import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';

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

  toString(): string {
    return this.name;
  }
}
