import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

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
    if (user.isMe || this.enabled) {
      this.set(user.id, user);
    }
  }

  get [Symbol.toStringTag](): string {
    return `Users (${this.size.toLocaleString()} items)`;
  }
}
