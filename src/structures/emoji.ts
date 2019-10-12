import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { ShardClient } from '../client';
import { DiscordKeys, ImageFormats } from '../constants';
import { addQuery, Snowflake, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { Role } from './role';
import { User } from './user';


const keysEmoji = new BaseSet<string>([
  DiscordKeys.ANIMATED,
  DiscordKeys.AVAILABLE,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.MANAGED,
  DiscordKeys.NAME,
  DiscordKeys.REQUIRE_COLONS,
  DiscordKeys.ROLES,
  DiscordKeys.USER,
]);

const keysMergeEmoji = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
]);

/**
 * Emoji Structure
 * @category Structure
 */
export class Emoji extends BaseStructure {
  readonly _keys = keysEmoji;
  readonly _keysMerge = keysMergeEmoji;
  _roles?: BaseCollection<string, null | Role>;

  animated: boolean = false;
  available?: boolean;
  guildId?: string;
  id: null | string = null;
  managed?: boolean;
  name: string = '';
  requireColons?: boolean;
  user?: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
    Object.defineProperty(this, '_roles', {enumerable: false, writable: true});
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
      return `<${(this.animated) ? 'a' : ''}:${this.name}:${this.id}>`;
    }
    return this.name;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get roles(): BaseCollection<string, null | Role> {
    if (this._roles) {
      return this._roles;
    }
    return emptyBaseCollection;
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

  async delete(options: RequestTypes.DeleteGuildEmoji = {}) {
    if (!this.id || !this.guildId) {
      throw new Error('Cannot delete a standard Emoji.');
    }
    return this.client.rest.deleteGuildEmoji(this.guildId, this.id, options);
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
        case DiscordKeys.ROLES: {
          if (value.length) {
            if (!this._roles) {
              this._roles = new BaseCollection<string, null | Role>();
            }
            this._roles.clear();

            const guild = this.guild;
            for (let roleId of value) {
              this._roles.set(roleId, (guild) ? guild.roles.get(roleId) || null : null);
            }
          } else {
            if (this._roles) {
              this._roles.clear();
              this._roles = undefined;
            }
          }
        }; return;
        case DiscordKeys.USER: {
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
      super.mergeValue(key, value);
    }
  }

  toString(): string {
    return this.format;
  }
}
