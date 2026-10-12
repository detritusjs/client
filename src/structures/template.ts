import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { User } from './user';


const keysTemplate = new BaseSet<string>([
  DiscordKeys.CODE,
  DiscordKeys.CREATED_AT,
  DiscordKeys.CREATOR,
  DiscordKeys.CREATOR_ID,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.IS_DIRTY,
  DiscordKeys.NAME,
  DiscordKeys.SERIALIZED_SOURCE_GUILD,
  DiscordKeys.SOURCE_GUILD_ID,
  DiscordKeys.UPDATED_AT,
  DiscordKeys.USAGE_COUNT,
]);

const keysMergeTemplate = new BaseSet<string>([
  DiscordKeys.SOURCE_GUILD_ID,
]);

/**
 * Guild Template Structure
 * @category Structure
 */
export class Template extends BaseStructure {
  readonly _keys = keysTemplate;
  readonly _keysMerge = keysMergeTemplate;

  code: string = '';
  createdAt!: Date;
  creator!: User;
  creatorId: string = '';
  description: string = '';
  isDirty: boolean = false;
  name: string = '';
  serializedSourceGuild?: any;
  sourceGuildId: string = '';
  updatedAt!: Date;
  usageCount: number = 0;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get createdAtUnix(): number {
    return this.createdAt.getTime();
  }

  get isUpdated(): boolean {
    return this.createdAt === this.updatedAt;
  }

  get longUrl(): string {
    return Endpoints.Template.LONG(this.code);
  }

  get updatedAtUnix(): number {
    return this.updatedAt.getTime();
  }

  get url(): string {
    return Endpoints.Template.SHORT(this.code);
  }

  delete() {
    return this.client.rest.deleteGuildTemplate(this.sourceGuildId, this.code);
  }

  fetch() {
    return this.client.rest.fetchTemplate(this.code);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.SOURCE_GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.SOURCE_GUILD_ID]] = data[DiscordKeys.SOURCE_GUILD_ID];
    }
    if (DiscordKeys.CODE in data) {
      (this as any)[DetritusKeys[DiscordKeys.CODE]] = data[DiscordKeys.CODE];
    }
    if (DiscordKeys.CREATED_AT in data) {
      const value = new Date(data[DiscordKeys.CREATED_AT]);
      (this as any)[DetritusKeys[DiscordKeys.CREATED_AT]] = value;
    }
    if (DiscordKeys.CREATOR in data) {
      const value = data[DiscordKeys.CREATOR];

      let creator: User;
      if (this.isClone) {
        creator = new User(this.client, value, this.isClone);
      } else {
        if (this.client.users.has(value.id)) {
          creator = this.client.users.get(value.id) as User;
          creator.merge(value);
        } else {
          creator = new User(this.client, value);
        }
      }
      (this as any)[DetritusKeys[DiscordKeys.CREATOR]] = creator;
    }
    if (DiscordKeys.CREATOR_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CREATOR_ID]] = data[DiscordKeys.CREATOR_ID];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.IS_DIRTY in data) {
      const value = !!data[DiscordKeys.IS_DIRTY];
      (this as any)[DetritusKeys[DiscordKeys.IS_DIRTY]] = value;
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.SERIALIZED_SOURCE_GUILD in data) {
      (this as any)[DetritusKeys[DiscordKeys.SERIALIZED_SOURCE_GUILD]] = data[DiscordKeys.SERIALIZED_SOURCE_GUILD];
    }
    if (DiscordKeys.UPDATED_AT in data) {
      const value = new Date(data[DiscordKeys.UPDATED_AT]);
      (this as any)[DetritusKeys[DiscordKeys.UPDATED_AT]] = value;
    }
    if (DiscordKeys.USAGE_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.USAGE_COUNT]] = data[DiscordKeys.USAGE_COUNT];
    }
  }
}
