import { ShardClient } from '../client';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keys = [
  'custom',
  'deprecated',
  'id',
  'name',
  'optimal',
  'vip',
];

export class VoiceRegion extends BaseStructure {
  _defaultKeys = keys;
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
