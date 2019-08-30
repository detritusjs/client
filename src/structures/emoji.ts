import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { ShardClient } from '../client';
import { ImageFormats } from '../constants';
import { addQuery, Snowflake, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { Role } from './role';
import { User } from './user';


const keysEmoji = new BaseSet<string>([
  'animated',
  'available',
  'guild_id',
  'id',
  'managed',
  'name',
  'require_colons',
  'roles',
  'user',
]);

const keysMergeEmoji = new BaseSet<string>([
  'guild_id',
]);

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
  guildId?: string;
  id: null | string = null;
  managed: boolean = false;
  name: string = '';
  requireColons: boolean = false;
  user?: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
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
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get url(): string {
    return this.urlFormat();
  }

  urlFormat(format?: null | string, query?: UrlQuery): string {
    if (!this.id) {
      throw new Error('Cannot get a URL of a standard Emoji.');
    }
    if (!format) {
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
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.EMOJI(this.id, format),
      query,
    );
  }

  async edit(options: RequestTypes.EditGuildEmoji) {
    if (!this.id || !this.guildId) {
      throw new Error('Cannot edit a standard Emoji.');
    }
    return this.client.rest.editGuildEmoji(this.guildId, this.id, options);
  }

  async delete() {
    if (!this.id || !this.guildId) {
      throw new Error('Cannot delete a standard Emoji.');
    }
    return this.client.rest.deleteGuildEmoji(this.guildId, this.id);
  }

  async fetchData(
    options: {
      format?: null | string,
      query?: UrlQuery,
    } = {},
  ) {
    return this.client.rest.request({
      url: this.urlFormat(options.format, options.query),
    });
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'roles': {
          this.roles.clear();
          const guild = this.guild;
          for (let roleId of (<Array<string>> value)) {
            if (guild) {
              this.roles.set(roleId, <Role> guild.roles.get(roleId));
            } else {
              this.roles.set(roleId, null);
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
