import {
  BaseClientCollectionOptions,
  BaseClientGuildReferenceCache,
} from './basecollection';

import { DetritusKeys, DiscordKeys } from '../constants';
import { Role } from '../structures/role';


/**
 * @category Collection Options
 */
export interface RolesOptions extends BaseClientCollectionOptions {
  
};

/**
 * Roles Reference Collection
 * @category Collections
 */
export class Roles extends BaseClientGuildReferenceCache<string, Role> {
  key = DetritusKeys[DiscordKeys.ROLES];

  insert(role: Role): void {
    if (this.enabled) {
      const guild = role.guild;
      if (guild) {
        guild.roles.set(role.id, role);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Roles (${this.size.toLocaleString()} items)`;
  }
}
