import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, RelationshipTypes } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User } from './user';


const keysRelationship = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.TYPE,
  DiscordKeys.USER,
]);

/**
 * Relationship Structure
 * Used to describe a relationship with a user
 * (only non-bots)
 * @category Structure
 */
export class Relationship extends BaseStructure {
  readonly _keys = keysRelationship;

  id: string = '';
  type: number = RelationshipTypes.NONE;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get isBlocked(): boolean {
    return this.type === RelationshipTypes.BLOCKED;
  }

  get isFriend(): boolean {
    return this.type === RelationshipTypes.FRIEND;
  }

  get isImplicit(): boolean {
    return this.type === RelationshipTypes.IMPLICIT;
  }

  get isNone(): boolean {
    return this.type === RelationshipTypes.NONE;
  }

  get isPendingIncoming(): boolean {
    return this.type === RelationshipTypes.PENDING_INCOMING;
  }

  get isPendingOutgoing(): boolean {
    return this.type === RelationshipTypes.PENDING_OUTGOING;
  }

  mergeValue(key: string, value: any) {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.USER: {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = <User> this.client.users.get(value.id);
            user.merge(value);
          } else {
            user = new User(this.client, value);
            this.client.users.insert(user);
          }
          value = user;
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
