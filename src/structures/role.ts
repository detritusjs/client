import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { Member } from './member';


const keysRole = new BaseSet<string>([
  'color',
  'guild_id',
  'hoist',
  'id',
  'managed',
  'mentionable',
  'name',
  'permissions',
  'position',
]);

/**
 * Guild Role Structure, used in [Guild]
 * @category Structure
 */
export class Role extends BaseStructure {
  readonly _keys = keysRole;

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

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get members(): BaseCollection<string, Member> {
    const collection = new BaseCollection<string, Member>();
    const guild = this.guild;
    const members = (guild) ? guild.members : null;
    if (members) {
      for (let [userId, member] of members) {
        if (member.roles.has(this.id)) {
          collection.set(userId, member);
        }
      }
    }
    return collection;
  }

  get mention(): string {
    return `<@&${this.id}>`;
  }

  delete() {
    return this.client.rest.deleteGuildRole(this.guildId, this.id);
  }

  edit(options: RequestTypes.EditGuildRole) {
    return this.client.rest.editGuildRole(this.guildId, this.id, options);
  }

  toString(): string {
    return this.mention;
  }
}
