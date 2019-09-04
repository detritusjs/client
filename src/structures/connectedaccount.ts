import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysConnectedAccount = new BaseSet<string>([
  DiscordKeys.FRIEND_SYNC,
  DiscordKeys.ID,
  DiscordKeys.INTEGRATIONS,
  DiscordKeys.NAME,
  DiscordKeys.REVOKED,
  DiscordKeys.SHOW_ACTIVITY,
  DiscordKeys.TYPE,
  DiscordKeys.VERIFIED,
  DiscordKeys.VISIBILITY,
]);

/**
 * Connected Account
 * If from a user profile, it'll be partial
 * @category Structure
 */
export class ConnectedAccount extends BaseStructure {
  readonly _keys = keysConnectedAccount;

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
