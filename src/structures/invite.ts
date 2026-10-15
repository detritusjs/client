import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, InviteFlags, InviteTargetTypes, InviteTypes } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
} from './basestructure';
import {
  Channel,
  createChannelFromData,
} from './channel';
import { GuildPartial } from './guild';
import { GuildScheduledEvent } from './guildscheduledevent';
import { User } from './user';


const keysInvite = new BaseSet<string>([
  DiscordKeys.APPROXIMATE_MEMBER_COUNT,
  DiscordKeys.APPROXIMATE_PRESENCE_COUNT,
  DiscordKeys.CHANNEL,
  DiscordKeys.CODE,
  DiscordKeys.CREATED_AT,
  DiscordKeys.EXPIRES_AT,
  DiscordKeys.FLAGS,
  DiscordKeys.GUILD,
  DiscordKeys.GUILD_SCHEDULED_EVENT,
  DiscordKeys.INVITER,
  DiscordKeys.MAX_AGE,
  DiscordKeys.MAX_USES,
  DiscordKeys.REVOKED,
  DiscordKeys.ROLES,
  DiscordKeys.TARGET_APPLICATION,
  DiscordKeys.TARGET_TYPE,
  DiscordKeys.TARGET_USER,
  DiscordKeys.TEMPORARY,
  DiscordKeys.TYPE,
  DiscordKeys.USES,
]);

const keysMergeInvite = new BaseSet<string>([
  DiscordKeys.GUILD,
]);

/**
 * Instant Invite Structure
 * @category Structure
 */
export class Invite extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysInvite); }
  static { setStructureKeys(this, '_keysMerge', keysMergeInvite); }

  declare approximateMemberCount?: number;
  declare approximatePresenceCount?: number;
  channel!: Channel;
  code: string = '';
  declare createdAt?: Date;
  declare expiresAt?: Date;
  flags: number = 0;
  declare guild?: GuildPartial;
  declare guildScheduledEvent?: GuildScheduledEvent;
  declare inviter?: User;
  declare maxAge?: number;
  declare maxUses?: number;
  declare revoked?: boolean;
  // partial roles given to whoever accepts the invite
  declare roles?: Array<{id: string, name?: string, [key: string]: any}>;
  declare targetApplication?: any;
  declare targetType?: InviteTargetTypes;
  declare targetUser?: User;
  declare temporary?: boolean;
  type: InviteTypes = InviteTypes.GUILD;
  declare uses?: number;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get isGuestInvite(): boolean {
    return (this.flags & InviteFlags.IS_GUEST_INVITE) === InviteFlags.IS_GUEST_INVITE;
  }

  get createdAtUnix(): number {
    return (this.createdAt) ? this.createdAt.getTime() : 0;
  }

  get expired(): boolean {
    if (this.expiresAt) {
      return this.expiresAtUnix <= Date.now();
    }
    return this.expiresIn === 0;
  }

  get expiresAtUnix(): number {
    return (this.expiresAt) ? this.expiresAt.getTime() : 0;
  }

  get expiresIn(): number {
    if (this.createdAt && this.maxAge) {
      return Math.max((this.createdAtUnix + (this.maxAge * 1000)) - Date.now(), 0);
    }
    return Infinity;
  }

  get expiresInUnix(): number {
    if (this.createdAt && this.maxAge) {
      return this.createdAtUnix + (this.maxAge * 1000);
    }
    return Infinity;
  }

  get isVanity(): boolean {
    if (this.guild) {
      return this.code === this.guild.vanityUrlCode;
    }
    return false;
  }

  get longUrl(): string {
    return Endpoints.Invite.LONG(this.code);
  }

  get url(): string {
    return Endpoints.Invite.SHORT(this.code);
  }

  accept() {
    return this.client.rest.acceptInvite(this.code);
  }

  addTargetUser(userId: string) {
    return this.client.rest.addInviteTargetUser(this.code, userId);
  }

  addTargetUsers(userIds: Array<string>) {
    return this.client.rest.bulkAddInviteTargetUsers(this.code, {userIds});
  }

  delete(options: RequestTypes.DeleteInvite = {}) {
    return this.client.rest.deleteInvite(this.code, options);
  }

  fetch(options: RequestTypes.FetchInvite = {}) {
    return this.client.rest.fetchInvite(this.code, options);
  }

  removeTargetUser(userId: string) {
    return this.client.rest.removeInviteTargetUser(this.code, userId);
  }

  removeTargetUsers(userIds: Array<string>) {
    return this.client.rest.bulkDeleteInviteTargetUsers(this.code, {userIds});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.GUILD in data) {
      const value = new GuildPartial(this.client, data[DiscordKeys.GUILD]);
      (this as any)[DetritusKeys[DiscordKeys.GUILD]] = value;
    }
    if (DiscordKeys.APPROXIMATE_MEMBER_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPROXIMATE_MEMBER_COUNT]] = data[DiscordKeys.APPROXIMATE_MEMBER_COUNT];
    }
    if (DiscordKeys.APPROXIMATE_PRESENCE_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPROXIMATE_PRESENCE_COUNT]] = data[DiscordKeys.APPROXIMATE_PRESENCE_COUNT];
    }
    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
    }
    if (DiscordKeys.ROLES in data) {
      (this as any)[DetritusKeys[DiscordKeys.ROLES]] = data[DiscordKeys.ROLES];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.CHANNEL in data) {
      const value = data[DiscordKeys.CHANNEL];
      if (this.guild) {
        value.guild_id = this.guild.id;
      }
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL]] = createChannelFromData(this.client, value, true);
    }
    if (DiscordKeys.CODE in data) {
      (this as any)[DetritusKeys[DiscordKeys.CODE]] = data[DiscordKeys.CODE];
    }
    if (DiscordKeys.CREATED_AT in data) {
      const value = data[DiscordKeys.CREATED_AT];
      (this as any)[DetritusKeys[DiscordKeys.CREATED_AT]] = (value) ? new Date(value) : value;
    }
    if (DiscordKeys.EXPIRES_AT in data) {
      const value = data[DiscordKeys.EXPIRES_AT];
      (this as any)[DetritusKeys[DiscordKeys.EXPIRES_AT]] = (value) ? new Date(value) : value;
    }
    if (DiscordKeys.GUILD_SCHEDULED_EVENT in data) {
      const value = new GuildScheduledEvent(this.client, data[DiscordKeys.GUILD_SCHEDULED_EVENT]);
      (this as any)[DetritusKeys[DiscordKeys.GUILD_SCHEDULED_EVENT]] = value;
    }
    if (DiscordKeys.INVITER in data) {
      const value = data[DiscordKeys.INVITER];

      let inviter: User;
      if (this.isClone) {
        inviter = new User(this.client, value, this.isClone);
      } else {
        if (this.client.users.has(value.id)) {
          inviter = this.client.users.get(value.id) as User;
          inviter.merge(value);
        } else {
          inviter = new User(this.client, value);
        }
      }
      (this as any)[DetritusKeys[DiscordKeys.INVITER]] = inviter;
    }
    if (DiscordKeys.MAX_AGE in data) {
      (this as any)[DetritusKeys[DiscordKeys.MAX_AGE]] = data[DiscordKeys.MAX_AGE];
    }
    if (DiscordKeys.MAX_USES in data) {
      (this as any)[DetritusKeys[DiscordKeys.MAX_USES]] = data[DiscordKeys.MAX_USES];
    }
    if (DiscordKeys.REVOKED in data) {
      (this as any)[DetritusKeys[DiscordKeys.REVOKED]] = data[DiscordKeys.REVOKED];
    }
    if (DiscordKeys.TARGET_APPLICATION in data) {
      (this as any)[DetritusKeys[DiscordKeys.TARGET_APPLICATION]] = data[DiscordKeys.TARGET_APPLICATION];
    }
    if (DiscordKeys.TARGET_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TARGET_TYPE]] = data[DiscordKeys.TARGET_TYPE];
    }
    if (DiscordKeys.TARGET_USER in data) {
      const value = data[DiscordKeys.TARGET_USER];

      let user: User;
      if (this.isClone) {
        user = new User(this.client, value, this.isClone);
      } else {
        if (this.client.users.has(value.id)) {
          user = this.client.users.get(value.id) as User;
          user.merge(value);
        } else {
          user = new User(this.client, value);
        }
      }
      (this as any)[DetritusKeys[DiscordKeys.TARGET_USER]] = user;
    }
    if (DiscordKeys.TEMPORARY in data) {
      (this as any)[DetritusKeys[DiscordKeys.TEMPORARY]] = data[DiscordKeys.TEMPORARY];
    }
    if (DiscordKeys.USES in data) {
      (this as any)[DetritusKeys[DiscordKeys.USES]] = data[DiscordKeys.USES];
    }
  }
}
