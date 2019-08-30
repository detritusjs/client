import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysVoiceRegion = new BaseSet<string>([
  'custom',
  'deprecated',
  'id',
  'name',
  'optimal',
  'vip',
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

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  toString(): string {
    return this.name;
  }
}
