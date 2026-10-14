import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
} from './basestructure';
import { ChannelGuildThread } from './channel';
import { Member } from './member';
import { User } from './user';


const keysThreadMember = new BaseSet<string>([
  DiscordKeys.FLAGS,
  DiscordKeys.ID,
  DiscordKeys.JOIN_TIMESTAMP,
  DiscordKeys.MEMBER,
  DiscordKeys.USER_ID,
]);


/**
 * Thread Member Structure
 * @category Structure
 */
export class ThreadMember extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysThreadMember); }

  flags: number = 0;
  id: string = '';
  joinTimestampUnix: number = 0;
  member?: Member;
  userId: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get joinTimestamp(): Date {
    return new Date(this.joinTimestampUnix);
  }

  get thread(): ChannelGuildThread | null {
    if (this.client.channels.has(this.id)) {
      return this.client.channels.get(this.id) as ChannelGuildThread;
    }
    return null;
  }

  get user(): User | null {
    return this.client.users.get(this.userId) || null;
  }

  add() {
    return this.client.rest.addThreadMember(this.id, this.userId);
  }

  remove() {
    return this.client.rest.removeThreadMember(this.id, this.userId);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.JOIN_TIMESTAMP in data) {
      this.joinTimestampUnix = (new Date(data[DiscordKeys.JOIN_TIMESTAMP])).getTime();
    }
    if (DiscordKeys.USER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER_ID]] = data[DiscordKeys.USER_ID];
    }
    // only sent when fetching with `withMember`
    if (DiscordKeys.MEMBER in data) {
      const value = data[DiscordKeys.MEMBER];
      const thread = this.thread;
      if (thread && thread.guildId) {
        value[DiscordKeys.GUILD_ID] = thread.guildId;
      }
      (this as any)[DetritusKeys[DiscordKeys.MEMBER]] = new Member(this.client, value, true);
    }
  }
}


const keysThreadMetadata = new BaseSet<string>([
  DiscordKeys.ARCHIVE_TIMESTAMP,
  DiscordKeys.ARCHIVED,
  DiscordKeys.ARCHIVER_ID,
  DiscordKeys.AUTO_ARCHIVE_DURATION,
  DiscordKeys.CREATE_TIMESTAMP,
  DiscordKeys.INVITABLE,
  DiscordKeys.LOCKED,
]);

/**
 * Thread Metadata Structure
 * @category Structure
 */
 export class ThreadMetadata extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysThreadMetadata); }
  readonly channel: ChannelGuildThread;

  archiveTimestampUnix: number = 0;
  archived: boolean = false;
  archiverId?: string;
  autoArchiveDuration: number = 60;
  createTimestampUnix?: number;
  invitable?: boolean;
  locked?: boolean;

  constructor(
    channel: ChannelGuildThread,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(channel.client, undefined, isClone);
    this.channel = channel;
    this.merge(data);
  }

  get archiver(): User | null {
    if (this.archiverId) {
      return this.client.users.get(this.archiverId) || null;
    }
    return null;
  }

  get archiveTimestamp(): Date {
    return new Date(this.archiveTimestampUnix);
  }

  // only on threads created after 2022-01-09
  get createTimestamp(): Date | null {
    if (this.createTimestampUnix) {
      return new Date(this.createTimestampUnix);
    }
    return null;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ARCHIVE_TIMESTAMP in data) {
      this.archiveTimestampUnix = (new Date(data[DiscordKeys.ARCHIVE_TIMESTAMP])).getTime();
    }
    if (DiscordKeys.ARCHIVED in data) {
      (this as any)[DetritusKeys[DiscordKeys.ARCHIVED]] = data[DiscordKeys.ARCHIVED];
    }
    if (DiscordKeys.ARCHIVER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ARCHIVER_ID]] = data[DiscordKeys.ARCHIVER_ID];
    }
    if (DiscordKeys.AUTO_ARCHIVE_DURATION in data) {
      (this as any)[DetritusKeys[DiscordKeys.AUTO_ARCHIVE_DURATION]] = data[DiscordKeys.AUTO_ARCHIVE_DURATION];
    }
    if (DiscordKeys.CREATE_TIMESTAMP in data) {
      const value = data[DiscordKeys.CREATE_TIMESTAMP];
      this.createTimestampUnix = (value) ? Date.parse(value) : undefined;
    }
    if (DiscordKeys.INVITABLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.INVITABLE]] = data[DiscordKeys.INVITABLE];
    }
    if (DiscordKeys.LOCKED in data) {
      (this as any)[DetritusKeys[DiscordKeys.LOCKED]] = data[DiscordKeys.LOCKED];
    }
  }
}
