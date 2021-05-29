import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { ChannelGuildThread } from './channel';
import { User } from './user';


const keysThreadMember = new BaseSet<string>([
  DiscordKeys.FLAGS,
  DiscordKeys.ID,
  DiscordKeys.JOIN_TIMESTAMP,
  DiscordKeys.USER_ID,
]);


/**
 * Thread Member Structure
 * @category Structure
 */
export class ThreadMember extends BaseStructure {
  readonly _keys = keysThreadMember;

  flags: number = 0;
  id: string = '';
  joinTimestampUnix: number = 0;
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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.JOIN_TIMESTAMP: {
          this.joinTimestampUnix = (new Date(value)).getTime();
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysThreadMetadata = new BaseSet<string>([
  DiscordKeys.ARCHIVE_TIMESTAMP,
  DiscordKeys.ARCHIVED,
  DiscordKeys.ARCHIVER_ID,
  DiscordKeys.AUTO_ARCHIVE_DURATION,
  DiscordKeys.LOCKED,
]);

/**
 * Thread Metadata Structure
 * @category Structure
 */
 export class ThreadMetadata extends BaseStructure {
  readonly _keys = keysThreadMetadata;
  readonly channel: ChannelGuildThread;

  archiveTimestampUnix: number = 0;
  archived: boolean = false;
  archiverId?: string;
  autoArchiveDuration: number = 60;
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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.ARCHIVE_TIMESTAMP: {
          this.archiveTimestampUnix = (new Date(value)).getTime();
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}
