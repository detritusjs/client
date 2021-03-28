import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys } from '../constants';

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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.CREATED_AT: {
          value = new Date(value);
        }; break;
        case DiscordKeys.CREATOR: {
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
          value = creator;
        }; break;
        case DiscordKeys.IS_DIRTY: {
          value = !!value;
        }; break;
        case DiscordKeys.SERIALIZED_SOURCE_GUILD: {
          
        }; break;
        case DiscordKeys.UPDATED_AT: {
          value = new Date(value);
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
