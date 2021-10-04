import { BaseCollection } from '../collections/basecollection';

import {
  ChannelGuildThread,
  ThreadMember,
  User,
} from '../structures';


export namespace RestResponses {
  export interface FetchChannelThreadsActive {
    hasMore: boolean,
    members: BaseCollection<string, BaseCollection<string, ThreadMember>>,
    threads: BaseCollection<string, ChannelGuildThread>,
  }

  export interface FetchChannelThreadsArchivedPrivate {
    hasMore: boolean,
    members: BaseCollection<string, BaseCollection<string, ThreadMember>>,
    threads: BaseCollection<string, ChannelGuildThread>,
  }

  export interface FetchChannelThreadsArchivedPrivateJoined {
    hasMore: boolean,
    members: BaseCollection<string, BaseCollection<string, ThreadMember>>,
    threads: BaseCollection<string, ChannelGuildThread>,
  }

  export interface FetchChannelThreadsArchivedPublic {
    hasMore: boolean,
    members: BaseCollection<string, BaseCollection<string, ThreadMember>>,
    threads: BaseCollection<string, ChannelGuildThread>,
  }

  export interface FetchGuildBans extends BaseCollection<string, RawGuildBan> {

  }

  export interface RawGuildBan {
    reason: null | string,
    user: User,
  }
}
