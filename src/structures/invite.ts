import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, InviteTargetUserTypes } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import {
  Channel,
  createChannelFromData,
} from './channel';
import { GuildPartial } from './guild';
import { User } from './user';


const keysInvite = new BaseSet<string>([
  DiscordKeys.APPROXIMATE_MEMBER_COUNT,
  DiscordKeys.APPROXIMATE_PRESENCE_COUNT,
  DiscordKeys.CHANNEL,
  DiscordKeys.CODE,
  DiscordKeys.CREATED_AT,
  DiscordKeys.GUILD,
  DiscordKeys.INVITER,
  DiscordKeys.MAX_AGE,
  DiscordKeys.MAX_USES,
  DiscordKeys.REVOKED,
  DiscordKeys.TARGET_USER,
  DiscordKeys.TARGET_USER_TYPE,
  DiscordKeys.TEMPORARY,
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
  readonly _keys = keysInvite;
  readonly _keysMerge = keysMergeInvite;

  approximateMemberCount?: number;
  approximatePresenceCount?: number;
  channel?: Channel;
  code: string = '';
  createdAt?: Date;
  guild?: GuildPartial;
  inviter?: User;
  maxAge?: number;
  maxUses?: number;
  revoked?: boolean;
  targetUser?: User;
  targetUserType?: InviteTargetUserTypes;
  temporary?: boolean;
  uses?: number;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get createdAtUnix(): number {
    return (this.createdAt) ? this.createdAt.getTime() : 0;
  }

  get expiresAt(): Date | null {
    const expiresAt = this.expiresAtUnix;
    if (expiresAt !== Infinity) {
      return new Date(expiresAt);
    }
    return null;
  }

  get expiresAtUnix(): number {
    if (this.createdAt && this.maxAge) {
      return this.createdAtUnix + this.maxAge;
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

  delete(options: RequestTypes.DeleteInvite = {}) {
    return this.client.rest.deleteInvite(this.code, options);
  }

  fetch(options: RequestTypes.FetchInvite = {}) {
    return this.client.rest.fetchInvite(this.code, options);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.CHANNEL: {
          value = createChannelFromData(this.client, value, true);
        }; break;
        case DiscordKeys.CREATED_AT: {
          if (value) {
            value = new Date(value);
          }
        }; break;
        case DiscordKeys.GUILD: {
          value = new GuildPartial(this.client, value);
        }; break;
        case DiscordKeys.INVITER: {
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
          value = inviter;
        }; break;
        case DiscordKeys.TARGET_USER: {
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
          value = user;
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
