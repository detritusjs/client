import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, RelationshipTypes } from '../constants';

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
  type: RelationshipTypes = RelationshipTypes.NONE;
  user!: User;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.USER in data) {
      const value = data[DiscordKeys.USER];

      let user: User;
      if (this.isClone) {
        user = new User(this.client, value, this.isClone);
      } else {
        if (this.client.users.has(value.id)) {
          user = this.client.users.get(value.id) as User;
          user.merge(value);
        } else {
          user = new User(this.client, value);
          this.client.users.insert(user);
        }
      }
      (this as any)[DetritusKeys[DiscordKeys.USER]] = user;
    }
  }
}
