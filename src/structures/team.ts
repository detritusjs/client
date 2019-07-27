import { Types as Options } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { Snowflake } from '../utils';
import {
  TeamMembershipStates,
  TeamPayoutAccountStatuses,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { User } from './user';


const keysTeam = [
  'icon',
  'id',
  'members',
  'name',
  'owner_user_id',
  'payout_account_status',
];

/**
 * Team Structure
 * an application's team
 * @category Structure
 */
export class Team extends BaseStructure {
  _defaultKeys = keysTeam;
  icon: null | string = null;
  id: string = '';
  members = new BaseCollection<string, TeamMember>();
  name: string = '';
  ownerUserId: string = '';
  payoutAccountStatus: number = TeamPayoutAccountStatuses.BASE;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get owner(): null | User {
    const member = this.members.find((member: TeamMember) => {
      return member.user.id === this.ownerUserId;
    });
    if (member) {
      return member.user;
    }
    return null;
  }

  async addMember(options: Options.AddTeamMember) {
    return this.client.rest.addTeamMember(this.id, options);
  }

  async edit(options?: Options.EditTeam) {
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

  async fetchPayouts(options?: Options.FetchTeamPayouts) {
    return this.client.rest.fetchTeamPayouts(this.id, options);
  }

  async delete(options?: Options.DeleteTeam) {
    return this.client.rest.deleteTeam(this.id, options);
  }

  async removeTeamMember(userId: string) {
    return this.client.rest.removeTeamMember(this.id, userId);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case 'members': {
        this.members.clear();
        for (let raw of value) {
          this.members.set(raw.user.id, new TeamMember(this.client, raw));
        }
      }; return;
    }
    return super.mergeValue.call(this, key, value);
  }
}


const keysTeamMember = [
  'membership_state',
  'permissions',
  'team_id',
  'user',
];

/**
 * Team Member Structure
 * an application's team member
 * @category Structure
 */
export class TeamMember extends BaseStructure {
  _defaultKeys = keysTeamMember;
  membershipState: number = TeamMembershipStates.BASE;
  permissions!: Array<string>;
  teamId: string = '';
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
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
    this.merge(member);
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
    switch (key) {
      case 'user': {
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
    super.mergeValue.call(this, key, value);
  }
}
