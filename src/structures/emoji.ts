import {
  Endpoints,
  Types as Options,
} from 'detritus-client-rest';

import { BaseCollection } from '../collections/basecollection';
import { ShardClient } from '../client';
import { ImageFormats } from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { Role } from './role';
import { User } from './user';


const keysEmoji: ReadonlyArray<string> = [
  'animated',
  'available',
  'guild_id',
  'id',
  'managed',
  'name',
  'require_colons',
  'roles',
  'user',
];

const keysMergeEmoji: ReadonlyArray<string> = [
  'guild_id',
];

/**
 * Emoji Structure
 * @category Structure
 */
export class Emoji extends BaseStructure {
  readonly _keys = keysEmoji;
  readonly _keysMerge = keysMergeEmoji;
  readonly roles = new BaseCollection<string, null | Role>();

  animated: boolean = false;
  available: boolean = true;
  guildId: null | string = null;
  id: string = '';
  managed: boolean = false;
  name: string = '';
  requireColons: boolean = false;
  user: null | User = null;

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

  get endpointFormat(): string {
    if (this.id) {
      return `${this.name}:${this.id}`;
    }
    return this.name;
  }

  get format(): string {
    if (this.id) {
      return `<${(this.animated) ? 'a:' : ''}${this.name}:${this.id}>`;
    }
    return this.name;
  }

  get guild(): Guild | null {
    if (this.guildId !== null) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get url(): string {
    return this.urlFormat();
  }

  urlFormat(format?: string): string {
    if (!this.id) {
      throw new Error('Cannot get a URL of a standard Emoji.');
    }
    if (format === undefined) {
      if (this.animated) {
        format = ImageFormats.GIF;
      } else {
        format = this.client.imageFormat || ImageFormats.PNG;
      }
    }

    const valid = [ImageFormats.PNG, ImageFormats.GIF];
    if (!valid.includes(format)) {
      throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
    }
    return Endpoints.CDN.URL + Endpoints.CDN.EMOJI(this.id, format);
  }

  async edit(options: Options.EditGuildEmoji) {
    if (!this.id || this.guildId === null) {
      throw new Error('Cannot edit a standard Emoji.');
    }
    return this.client.rest.editGuildEmoji(this.guildId, this.id, options);
  }

  async delete() {
    if (!this.id || this.guildId === null) {
      throw new Error('Cannot delete a standard Emoji.');
    }
    return this.client.rest.deleteGuildEmoji(this.guildId, this.id);
  }

  async fetchData(
    options: {
      format?: string,
      query?: any,
    } = {},
  ) {
    return this.client.rest.request({
      query: options.query,
      url: this.urlFormat(options.format),
    });
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'roles': {
          this.roles.clear();
          const guild = this.guild;
          for (let roleId of (<Array<string>> value)) {
            if (guild === null) {
              this.roles.set(roleId, null);
            } else {
              this.roles.set(roleId, <Role> guild.roles.get(roleId));
            }
          }
        }; return;
        case 'user': {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = <User> this.client.users.get(value.id);
            user.merge(value);
          } else {
            user = new User(this.client, value);
            this.client.users.insert(user);
          }
          value = user;
        }; break;
      }
      super.mergeValue.call(this, key, value);
    }
  }

  toString(): string {
    return this.format;
  }
}
