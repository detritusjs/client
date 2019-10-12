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
import { Guild } from './guild';
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
  guild?: Guild;
  inviter?: User;
  maxAge?: number;
  maxUses?: number;
  revoked?: boolean;
  targetUser?: User;
  targetUserType?: number;
  temporary?: boolean;
  uses?: number;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
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
          let channel: Channel;
          if (this.client.channels.has(value.id)) {
            channel = <Channel> this.client.channels.get(value.id);
            channel.merge(value);
          } else {
            if (this.guild) {
              value.guild_id = this.guild.id;
            }
            value.is_partial = true;
            channel = createChannelFromData(this.client, value);
          }
          value = channel;
        }; break;
        case DiscordKeys.CREATED_AT: {
          if (value) {
            value = new Date(value);
          }
        }; break;
        case DiscordKeys.GUILD: {
          let guild: Guild;
          if (this.client.guilds.has(value.id)) {
            guild = <Guild> this.client.guilds.get(value.id);
            guild.merge(value);
          } else {
            value.is_partial = true;
            guild = new Guild(this.client, value);
          }
          value = guild;
        }; break;
        case DiscordKeys.INVITER: {
          let inviter: User;
          if (this.client.users.has(value.id)) {
            inviter = <User> this.client.users.get(value.id);
            inviter.merge(value);
          } else {
            inviter = new User(this.client, value);
          }
          value = inviter;
        }; break;
        case DiscordKeys.TARGET_USER: {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = <User> this.client.users.get(value.id);
            user.merge(value);
          } else {
            user = new User(this.client, value);
          }
          value = user;
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
