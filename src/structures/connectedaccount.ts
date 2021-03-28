import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, PlatformTypes } from '../constants';

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

  accessToken?: string;
  friendSync?: boolean;
  id: string = '';
  integrations?: Array<any>;
  name: string = '';
  revoked?: boolean;
  showActivity?: boolean;
  type!: PlatformTypes;
  verified: boolean = false;
  visibility?: number;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get key(): string {
    return `${this.type}.${this.id}`;
  }
}
