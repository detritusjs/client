import { ShardClient } from '../client';
import { ApplicationCommandPermissions } from '../structures';

import {
  BaseClientCollectionCache,
  BaseClientCollectionOptions,
  BaseCollection,
} from './basecollection';


/**
 * @category Collection Options
 */
export interface ApplicationCommandPermissionsOptions extends BaseClientCollectionOptions {

};

/**
 * Application Command Permissions Collection
 * @category Collections
 */
export class ApplicationCommandPermissionsCache extends BaseClientCollectionCache<string, ApplicationCommandPermissions> {
  insert(permission: ApplicationCommandPermissions): void {
    if (this.enabled) {
      if (permission.permissions.length) {
        this.set(permission.guildId, permission.id, permission);
      } else {
        this.delete(permission.guildId, permission.id);
      }
    }
  }

  async fill(guildId: string, force: boolean = false): Promise<void> {
    if (this.enabled && (!this.has(guildId) || force) && this.client.applicationId) {
      // fetch before clearing, so `isAllowed` keeps the old permissions while we wait
      // and a failed fetch doesn't leave an empty (allow everything) cache that `has()` says is filled
      const permissions = await this.client.rest.fetchApplicationGuildCommandsPermissions(this.client.applicationId, guildId);
      const collection = this.insertCache(guildId);
      collection.clear();
      for (let [permissionId, permission] of permissions) {
        collection.set(permission.id, permission);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `ApplicationCommandPermissions (${this.size.toLocaleString()} items)`;
  }
}
