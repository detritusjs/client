import {
  Endpoints,
  Types as Options,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
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


const keys = [
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
];

/**
 * Instant Invite Structure
 * @category Structure
 */
export class Invite extends BaseStructure {
  _defaultKeys = keys;
  approximateMemberCount: number = 0;
  approximatePresenceCount: number = 0;
  channel: Channel | null = null;
  code: string = '';
  createdAt?: Date;
  guild: Guild | null = null;
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

  fetch(options: Options.FetchInvite) {
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
            channel = createChannelFromData(this.client, value);
          }
          value = channel;
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
