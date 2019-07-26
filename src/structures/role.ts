import { Types as Options } from 'detritus-client-rest';

import { Client as ShardClient } from '../client';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keys: ReadonlyArray<string> = [
  'color',
  'guild_id',
  'hoist',
  'id',
  'managed',
  'mentionable',
  'name',
  'permissions',
  'position',
];

export class Role extends BaseStructure {
  _defaultKeys = keys;
  color: number = 0;
  guildId: string = '';
  hoist: boolean = false;
  id: string = '';
  managed: boolean = false;
  mentionable: boolean = false;
  name: string = '';
  permissions: number = 0;
  position: number = 0;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get mention(): string {
    return `<@&${this.id}>`;
  }

  delete() {
    return this.client.rest.deleteGuildRole(this.guildId, this.id);
  }

  edit(options: Options.EditGuildRole) {
    return this.client.rest.editGuildRole(this.guildId, this.id, options);
  }

  toString(): string {
    return this.mention;
  }
}
