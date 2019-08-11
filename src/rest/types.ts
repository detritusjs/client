import { BaseCollection } from '../collections/basecollection';

import {
  User,
  UserWithFlags,
  UserWithToken,
} from '../structures';


export namespace RestResponses {
  export interface FetchGuildBans extends BaseCollection<string, RawGuildBan> {

  }

  export interface RawGuildBan {
    reason: null | string,
    user: User,
  }
}
