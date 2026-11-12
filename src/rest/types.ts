import { BaseCollection } from '../collections/basecollection';

import {
  ChannelGuildThread,
  Member,
  Message,
  ThreadMember,
  User,
} from '../structures';


export namespace RestResponses {
  export interface BulkGuildBan {
    bannedUsers: Array<string>,
    failedUsers: Array<string>,
  }

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

  export interface SearchChannelThreads {
    // each thread's first message, by the thread's id (missing if it got deleted)
    firstMessages: BaseCollection<string, Message>,
    hasMore: boolean,
    members: BaseCollection<string, BaseCollection<string, ThreadMember>>,
    // each thread's newest message, by the thread's id (only sent for some searches)
    mostRecentMessages: BaseCollection<string, Message>,
    threads: BaseCollection<string, ChannelGuildThread>,
    totalResults?: number,
  }

  export interface SearchGuildMembers {
    guildId: string,
    members: BaseCollection<string, SearchGuildMembersResult>,
    pageResultCount: number,
    // seconds, only set when discord is still indexing the guild's members (nothing was searched)
    retryAfter?: number,
    totalResultCount: number,
  }

  // how the member joined, alongside the member
  export interface SearchGuildMembersResult {
    inviterId: null | string,
    joinSourceApplicationId: null | string,
    joinSourceChannelId: null | string,
    joinSourceType: null | number,
    member: Member,
    sourceInviteCode: null | string,
  }

}
