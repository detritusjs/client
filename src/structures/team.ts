import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { Snowflake } from '../utils';
import {
  DiscordKeys,
  TeamMembershipStates,
  TeamPayoutAccountStatuses,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User, UserMixin } from './user';


const keysTeam = new BaseSet<string>([
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.MEMBERS,
  DiscordKeys.NAME,
  DiscordKeys.OWNER_USER_ID,
  DiscordKeys.PAYOUT_ACCOUNT_STATUS,
]);

/**
 * Team Structure
 * an application's team
 * @category Structure
 */
export class Team extends BaseStructure {
  readonly _keys = keysTeam;

  icon: null | string = null;
  id: string = '';
  members = new BaseCollection<string, TeamMember>();
  name: string = '';
  ownerUserId: string = '';
  payoutAccountStatus?: TeamPayoutAccountStatuses;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get owner(): null | TeamMember {
    for (let [userId, member] of this.members) {
      if (member.user.id === this.ownerUserId) {
        return member;
      }
    }
    return null;
  }

  async addMember(options: RequestTypes.AddTeamMember) {
    return this.client.rest.addTeamMember(this.id, options);
  }

  async edit(options?: RequestTypes.EditTeam) {
    return this.client.rest.editTeam(this.id, options);
  }

  async fetch() {
    return this.client.rest.fetchTeam(this.id);
  }

  async fetchApplications() {
    return this.client.rest.fetchTeamApplications(this.id);
  }

  async fetchMembers() {
    const members = await this.client.rest.fetchTeamMembers(this.id);
    this.members.clear();
    for (let [userId, member] of members) {
      this.members.set(userId, member);
    }
    return this.members;
  }

  async fetchMember(userId: string) {
    const member = await this.client.rest.fetchTeamMember(this.id, userId);
    this.members.set(member.user.id, member);
    return member;
  }

  async fetchPayouts(options?: RequestTypes.FetchTeamPayouts) {
    return this.client.rest.fetchTeamPayouts(this.id, options);
  }

  async delete(options?: RequestTypes.DeleteTeam) {
    return this.client.rest.deleteTeam(this.id, options);
  }

  async removeTeamMember(userId: string) {
    return this.client.rest.removeTeamMember(this.id, userId);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.MEMBERS: {
          this.members.clear();
          for (let raw of value) {
            this.members.set(raw.user.id, new TeamMember(this.client, raw, this._clone));
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysTeamMember = new BaseSet<string>([
  DiscordKeys.MEMBERSHIP_STATE,
  DiscordKeys.PERMISSIONS,
  DiscordKeys.TEAM_ID,
  DiscordKeys.USER,
]);

/**
 * Team Member Structure
 * an application's team member
 * @category Structure
 */
export class TeamMember extends UserMixin {
  readonly _keys = keysTeamMember;

  membershipState: TeamMembershipStates = TeamMembershipStates.BASE;
  permissions!: BaseSet<string>;
  teamId: string = '';
  declare user: User;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get accepted(): boolean {
    return this.membershipState === TeamMembershipStates.ACCEPTED;
  }

  get invited(): boolean {
    return this.membershipState === TeamMembershipStates.INVITED;
  }

  async fetch() {
    const member = await this.client.rest.fetchTeamMember(this.teamId, this.user.id);
    this.merge(member.toJSON());
    return this;
  }

  async fetchTeam() {
    return this.client.rest.fetchTeam(this.teamId);
  }

  async remove() {
    return this.client.rest.removeTeamMember(this.teamId, this.user.id);
  }

  async transferOwnership(options: {code?: string} = {}) {
    const body = {
      code: options.code,
      ownerUserId: this.user.id,
    };
    return this.client.rest.editTeam(this.teamId, body);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.PERMISSIONS: {
          value = new BaseSet(value);
        }; break;
        case DiscordKeys.USER: {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = <User> this.client.users.get(value.id);
            user.merge(value);
          } else {
            user = new User(this.client, value);
            // dont insert into cache
          }
          value = user;
        }; break;
      }
      super.mergeValue(key, value);
    }
  }
}
