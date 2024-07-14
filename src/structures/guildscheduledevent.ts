import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../collections/baseset';
import { ShardClient } from '../client';
import {
  DetritusKeys,
  DiscordKeys,
  GuildScheduledEventEntityTypes,
  GuildScheduledEventPrivacyLevels,
  GuildScheduledEventStatusTypes,
} from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { Member } from './member';
import { User } from './user';


const keysGuildScheduledEvent = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.CREATOR,
  DiscordKeys.CREATOR_ID,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.ENTITY_ID,
  DiscordKeys.ENTITY_METADATA,
  DiscordKeys.ENTITY_TYPE,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.IMAGE,
  DiscordKeys.NAME,
  DiscordKeys.PRIVACY_LEVEL,
  DiscordKeys.SCHEDULED_END_TIME,
  DiscordKeys.SCHEDULED_START_TIME,
  DiscordKeys.STATUS,
  DiscordKeys.USER_COUNT,
]);

/**
 * Guild Scheduled Event Structure
 * @category Structure
 */
export class GuildScheduledEvent extends BaseStructure {
  readonly _keys = keysGuildScheduledEvent;

  channelId: string | null = null;
  creator?: User;
  creatorId?: string;
  deleted: boolean = false;
  description?: string | null;
  entityId: string | null = null;
  entityMetadata: any;
  entityType: GuildScheduledEventEntityTypes = GuildScheduledEventEntityTypes.STAGE_INSTANCE;
  guildId: string = '';
  id: string = '';
  image?: string | null;
  name: string = '';
  privacyLevel: GuildScheduledEventPrivacyLevels = GuildScheduledEventPrivacyLevels.GUILD_ONLY;
  scheduledEndTimeUnix?: number;
  scheduledStartTimeUnix: number = 0;
  status: GuildScheduledEventStatusTypes = GuildScheduledEventStatusTypes.SCHEDULED;
  userCount?: number;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get createdAt(): Date | null {
    const createdAtUnix = this.createdAtUnix;
    if (createdAtUnix !== null) {
      return new Date(createdAtUnix);
    }
    return null;
  }

  get createdAtUnix(): null | number {
    if (this.id) {
      return Snowflake.timestamp(this.id);
    }
    return null;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get scheduledEndTime(): Date | null {
    if  (this.scheduledEndTimeUnix !== undefined) {
      return new Date(this.scheduledEndTimeUnix);
    }
    return null;
  }

  get scheduledStartTime(): Date {
    return new Date(this.scheduledStartTimeUnix);
  }

  async delete(options: RequestTypes.DeleteGuildScheduledEvent = {}) {
    return this.client.rest.deleteGuildScheduledEvent(this.guildId, this.id, options);
  }

  async edit(options: RequestTypes.EditGuildScheduledEvent = {}) {
    return this.client.rest.editGuildScheduledEvent(this.guildId, this.id, options);
  }

  async fetchUsers(options: RequestTypes.FetchGuildScheduledEventUsers = {}) {
    return this.client.rest.fetchGuildScheduledEventUsers(this.guildId, this.id, options);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_ID]] = data[DiscordKeys.CHANNEL_ID];
    }
    if (DiscordKeys.CREATOR in data) {
      const value = data[DiscordKeys.CREATOR];

      let user: User;
      if (this.client.users.has(value.id)) {
        user = this.client.users.get(value.id)!;
        user.merge(value);
      } else {
        user = new User(this.client, value);
        // maybe insert?
      }
      (this as any)[DetritusKeys[DiscordKeys.CREATOR]] = user;
    }
    if (DiscordKeys.CREATOR_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CREATOR_ID]] = data[DiscordKeys.CREATOR_ID];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.ENTITY_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ENTITY_ID]] = data[DiscordKeys.ENTITY_ID];
    }
    if (DiscordKeys.ENTITY_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.ENTITY_TYPE]] = data[DiscordKeys.ENTITY_TYPE];
    }
    if (DiscordKeys.ENTITY_METADATA in data) {
      const value = data[DiscordKeys.ENTITY_METADATA];
      // make object using this.entityType;
      (this as any)[DetritusKeys[DiscordKeys.ENTITY_METADATA]] = value;
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.IMAGE in data) {
      (this as any)[DetritusKeys[DiscordKeys.IMAGE]] = data[DiscordKeys.IMAGE];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.PRIVACY_LEVEL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PRIVACY_LEVEL]] = data[DiscordKeys.PRIVACY_LEVEL];
    }
    if (DiscordKeys.SCHEDULED_END_TIME in data) {
      const value = data[DiscordKeys.SCHEDULED_END_TIME];
      this.scheduledEndTimeUnix = Date.parse(value);
    }
    if (DiscordKeys.SCHEDULED_START_TIME in data) {
      const value = data[DiscordKeys.SCHEDULED_START_TIME];
      this.scheduledStartTimeUnix = Date.parse(value);
    }
    if (DiscordKeys.STATUS in data) {
      (this as any)[DetritusKeys[DiscordKeys.STATUS]] = data[DiscordKeys.STATUS];
    }
    if (DiscordKeys.USER_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER_COUNT]] = data[DiscordKeys.USER_COUNT];
    }
  }
}



const keysGuildScheduledEventUser = new BaseSet<string>([
  DiscordKeys.GUILD_SCHEDULED_EVENT_ID,
  DiscordKeys.MEMBER,
  DiscordKeys.USER,
]);

/**
 * Guild Scheduled Event User Structure
 * @category Structure
 */
export class GuildScheduledEventUser extends BaseStructure {
  readonly _keys = keysGuildScheduledEventUser;

  guildScheduledEventId: string = '';
  member?: Member;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get id(): string {
    return this.user.id;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.GUILD_SCHEDULED_EVENT_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_SCHEDULED_EVENT_ID]] = data[DiscordKeys.GUILD_SCHEDULED_EVENT_ID];
    }
    if (DiscordKeys.USER in data) {
      const value = data[DiscordKeys.USER];

      let user: User;
      if (this.client.users.has(value.id)) {
        user = this.client.users.get(value.id)!;
        user.merge(value);
      } else {
        user = new User(this.client, value);
        // maybe insert?
      }
      (this as any)[DetritusKeys[DiscordKeys.USER]] = user;
    }
    if (DiscordKeys.MEMBER in data) {
      const value = data[DiscordKeys.MEMBER];
      const guildId = value[DiscordKeys.GUILD_ID];

      let member: Member;
      if (this.client.members.has(guildId, value.user.id)) {
        member = this.client.members.get(guildId, value.user.id)!;
        member.merge(value);
      } else {
        member = new Member(this.client, value);
        member.user = this.user;
      }
      (this as any)[DetritusKeys[DiscordKeys.MEMBER]] = member;
    }
  }
}
