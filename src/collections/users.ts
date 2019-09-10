import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Presence } from '../structures/presence';
import { User } from '../structures/user';


/**
 * @category Collection Options
 */
export interface UsersOptions extends BaseClientCollectionOptions {

};

/**
 * Users Collection
 * @category Collections
 */
export class Users extends BaseClientCollection<string, User> {
  insert(user: User): void {
    if (user.isMe) {
      this.set(user.id, user);
    }

    if (this.enabled) {
      this.set(user.id, user);
    } else {
      if (this.client.presences.enabled && this.client.presences.has(user.id)) {
        const presence = <Presence> this.client.presences.get(user.id);
        presence.merge({user: user.toJSON()});
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Users (${this.size.toLocaleString()} items)`;
  }
}
