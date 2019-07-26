import { Client as ShardClient } from '../client';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keys = [
  'friend_sync',
  'id',
  'integrations',
  'name',
  'revoked',
  'show_activity',
  'type',
  'verified',
  'visibility',
];

export class ConnectedAccount extends BaseStructure {
  _defaultKeys = keys;

  friendSync?: boolean;
  id: string = '';
  integrations?: Array<any>;
  name: string = '';
  revoked?: boolean;
  showActivity?: boolean;
  type: string = '';
  verified: boolean = false;
  visibility?: number;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }
}
