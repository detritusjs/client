import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { User } from '../structures/user';


export interface UsersOptions extends BaseClientCollectionOptions {};

export class Users extends BaseClientCollection<string, User> {
  insert(user: User): void {
    if (this.enabled) {
      this.set(user.id, user);
    }
  }

  toString(): string {
    return `${this.size} Users`;
  }
}
