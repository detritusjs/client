import { ShardClient } from '../client';
import { RelationshipTypes } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User } from './user';


const keysRelationship: ReadonlyArray<string> = [
  'id',
  'type',
  'user',
];

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

  get user(): undefined | User {
    return this.client.users.get(this.id);
  }

  mergeValue(key: string, value: any) {
    if (value !== undefined) {
      switch (key) {
        case 'user': {
          if (this.client.users.has(value.id)) {
            (<User> this.client.users.get(value.id)).merge(value);
          } else {
            this.client.users.insert(new User(this.client, value));
          }
        }; return;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}
