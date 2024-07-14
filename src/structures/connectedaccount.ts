import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ConnectedAccountVisibilityTypes,
  DetritusKeys,
  DiscordKeys,
  PlatformTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Integration } from './integration';


const keysConnectedAccount = new BaseSet<string>([
  DiscordKeys.ACCESS_TOKEN,
  DiscordKeys.FRIEND_SYNC,
  DiscordKeys.ID,
  DiscordKeys.INTEGRATIONS,
  DiscordKeys.NAME,
  DiscordKeys.REVOKED,
  DiscordKeys.SHOW_ACTIVITY,
  DiscordKeys.TWO_WAY_LINK,
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
  integrations?: BaseCollection<string, Integration>;
  name: string = '';
  revoked?: boolean;
  showActivity?: boolean;
  twoWayLink?: boolean;
  type!: PlatformTypes;
  verified: boolean = false;
  visibility: ConnectedAccountVisibilityTypes = ConnectedAccountVisibilityTypes.EVERYONE;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get key(): string {
    return `${this.type}.${this.id}`;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ACCESS_TOKEN in data) {
      (this as any)[DetritusKeys[DiscordKeys.ACCESS_TOKEN]] = data[DiscordKeys.ACCESS_TOKEN];
    }
    if (DiscordKeys.FRIEND_SYNC in data) {
      (this as any)[DetritusKeys[DiscordKeys.FRIEND_SYNC]] = data[DiscordKeys.FRIEND_SYNC];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.INTEGRATIONS in data) {
      const value = data[DiscordKeys.INTEGRATIONS];
      if (value.length) {
        if (!this.integrations) {
          this.integrations = new BaseCollection<string, Integration>();
        }
        this.integrations.clear();
        for (let raw of value) {
          const integration = new Integration(this.client, raw);
          this.integrations.set(integration.id, integration);
        }
      } else {
        if (this.integrations) {
          this.integrations.clear();
          this.integrations = undefined;
        }
      }
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.REVOKED in data) {
      (this as any)[DetritusKeys[DiscordKeys.REVOKED]] = data[DiscordKeys.REVOKED];
    }
    if (DiscordKeys.SHOW_ACTIVITY in data) {
      (this as any)[DetritusKeys[DiscordKeys.SHOW_ACTIVITY]] = data[DiscordKeys.SHOW_ACTIVITY];
    }
    if (DiscordKeys.TWO_WAY_LINK in data) {
      (this as any)[DetritusKeys[DiscordKeys.TWO_WAY_LINK]] = data[DiscordKeys.TWO_WAY_LINK];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.VERIFIED in data) {
      (this as any)[DetritusKeys[DiscordKeys.VERIFIED]] = data[DiscordKeys.VERIFIED];
    }
    if (DiscordKeys.VISIBILITY in data) {
      (this as any)[DetritusKeys[DiscordKeys.VISIBILITY]] = data[DiscordKeys.VISIBILITY];
    }
  }
}
