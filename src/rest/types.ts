import { BaseCollection } from '../collections/basecollection';

import {
  User,
  UserWithFlags,
  UserWithToken,
} from '../structures';


export interface fetchGuildBan {
  reason: null | string,
  user: User,
}

export interface fetchGuildBans extends BaseCollection<string, fetchGuildBan> {

}

export interface fetchOauth2Application {
  bot?: UserWithToken,
  botPublic: boolean,
  botRequireCodeGrant: boolean,
  description: string,
  flags?: number,
  guildId?: string,
  icon: null | string,
  id: string,
  name: string,
  owner: UserWithFlags,
  redirectUris?: Array<string>,
  rpcApplicationState?: number,
  secret?: string,
  storeApplicationState?: number,
  summary: string,
  team?: null | Team,
  verifyKey: string,
}


export interface Team {
  icon: null | string,
  id: string,
  members: Array<{
    membershipState: number,
    permissions: Array<string>,
    teamId: string,
    user: User,
  }>,
  name: string,
  ownerUserId: string,
}
