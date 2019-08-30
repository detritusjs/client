import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { InviteTargetUserTypes } from '../constants';

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
  'approximate_member_count',
  'approximate_presence_count',
  'channel',
  'code',
  'created_at',
  'guild',
  'inviter',
  'max_age',
  'max_uses',
  'revoked',
  'target_user',
  'target_user_type',
  'temporary',
  'uses',
]);

const keysMergeInvite = new BaseSet<string>([
  'guild',
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

  delete() {
    return this.client.rest.deleteInvite(this.code);
  }

  fetch(options: RequestTypes.FetchInvite = {}) {
    return this.client.rest.fetchInvite(this.code, options);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'channel': {
          let channel: Channel;
          if (this.client.channels.has(value.id)) {
            channel = <Channel> this.client.channels.get(value.id);
            channel.merge(value);
          } else {
            if (this.guild) {
              value.guild_id = this.guild.id;
            }
            channel = createChannelFromData(this.client, value);
          }
          value = channel;
        }; break;
        case 'created_at': {
          if (value) {
            value = new Date(value);
          }
        }; break;
        case 'guild': {
          let guild: Guild;
          if (this.client.guilds.has(value.id)) {
            guild = <Guild> this.client.guilds.get(value.id);
            guild.merge(value);
          } else {
            guild = new Guild(this.client, value);
          }
          value = guild;
        }; break;
        case 'inviter': {
          let inviter: User;
          if (this.client.users.has(value.id)) {
            inviter = <User> this.client.users.get(value.id);
            inviter.merge(value);
          } else {
            inviter = new User(this.client, value);
          }
          value = inviter;
        }; break;
        case 'target_user': {
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
      return super.mergeValue.call(this, key, value);
    }
  }
}
