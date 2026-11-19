import { ShardClient } from '../client';
import { ApplicationCommandPermissions, Channel, Member } from '../structures';

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
 *
 * A guild's command permission overwrites (Server Settings > Integrations), keyed by guild id, then by command id
 * (or the application id for the app-wide overwrites)
 *
 * - Nothing fills it on its own, call `fill(guildId)` when a guild first needs them
 * - `APPLICATION_COMMAND_PERMISSIONS_UPDATE` only updates guilds that were already filled
 * - A new session (`READY`) clears it, leaving a guild (`GUILD_DELETE`) removes that guild
 * - `fill()` rejects for a guild that installed the bot without the `applications.commands` scope, and keeps rejecting
 *   until the guild reinstalls it, so back off instead of retrying on every command
 *
 * Discord only enforces these for slash commands used through the guild install. Prefix commands and user install
 * commands used in a guild aren't checked by Discord, use `isAllowed()` for those
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

  // guild id -> its running fetch, so callers that ask at the same time share one request
  protected fills!: Map<string, Promise<void>>;

  constructor(client: ShardClient, options: ApplicationCommandPermissionsOptions | boolean = {}) {
    super(client, options);
    Object.defineProperty(this, 'fills', {enumerable: false, value: new Map()});
  }

  /**
   * Fetches a guild's command permissions, unless they're already cached (or `force`)
   * Callers asking for the same guild at the same time share one request, a failed request caches nothing
   */
  fill(guildId: string, force: boolean = false): Promise<void> {
    if (!this.enabled || (this.has(guildId) && !force) || !this.client.applicationId) {
      return Promise.resolve();
    }
    let promise = this.fills.get(guildId);
    if (!promise) {
      promise = (async () => {
        try {
          // fetch before clearing, so `isAllowed` keeps the old permissions while we wait
          // and a failed fetch doesn't leave an empty (allow everything) cache that `has()` says is filled
          const permissions = await this.client.rest.fetchApplicationGuildCommandsPermissions(this.client.applicationId, guildId);
          const collection = this.insertCache(guildId);
          collection.clear();
          for (let [permissionId, permission] of permissions) {
            collection.set(permission.id, permission);
          }
        } finally {
          this.fills.delete(guildId);
        }
      })();
      this.fills.set(guildId, promise);
    }
    return promise;
  }

  /**
   * Whether the guild's command permissions let this member use a command in this channel
   * `commandIds` are the command's ids (a global command and its guild version can both have overwrites)
   * A command with its own overwrites ignores the app-wide ones (the entry keyed by the application's id), like Discord
   * Nothing cached for the guild (not filled, or no overwrites) counts as allowed
   */
  isAllowed(guildId: string, commandIds: string | Array<string>, channel: Channel, member: Member): boolean {
    const permissions = this.get(guildId);
    if (!permissions || !permissions.length) {
      return true;
    }
    const entries: Array<ApplicationCommandPermissions> = [];
    for (let commandId of (Array.isArray(commandIds) ? commandIds : [commandIds])) {
      const entry = permissions.get(commandId);
      if (entry) {
        entries.push(entry);
      }
    }
    if (!entries.length && this.client.applicationId) {
      const appWide = permissions.get(this.client.applicationId);
      if (appWide) {
        entries.push(appWide);
      }
    }
    return entries.every((entry) => entry.isAllowed(channel, member));
  }

  get [Symbol.toStringTag](): string {
    return `ApplicationCommandPermissions (${this.size.toLocaleString()} items)`;
  }
}
