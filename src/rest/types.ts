import { BaseCollection } from '../collections/basecollection';

import {
  User,
  UserWithFlags,
  UserWithToken,
} from '../structures';


export namespace RestResponses {
  export interface FetchGuildBans extends BaseCollection<string, RawGuildBan> {

  }

  export interface FetchOauth2Application {
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
    team?: null | {
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
    },
    verifyKey: string,
  }

  export interface RawGuildBan {
    reason: null | string,
    user: User,
  }
}
