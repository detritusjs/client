import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { addQuery, getFormatFromHash, Snowflake, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { User } from './user';


const keysWebhook: ReadonlyArray<string> = [
  'avatar',
  'channel_id',
  'discriminator',
  'guild_id',
  'id',
  'name',
  'token',
  'user',
];

/**
 * Webhook Structure
 * @category Structure
 */
export class Webhook extends BaseStructure {
  readonly _keys = keysWebhook;

  avatar: null | string = null;
  channelId: string = '';
  discriminator: string = '0000';
  guildId: string = '';
  id: string = '';
  name: string = '';
  token?: null | string;
  user?: null | User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get avatarUrl(): string {
    return this.avatarUrlFormat();
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) || null;
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get defaultAvatarUrl(): string {
    return Endpoints.CDN.URL + Endpoints.CDN.AVATAR_DEFAULT(parseInt(this.discriminator) % 5);
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get jumpLink(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.USER(this.id);
  }

  get mention(): string {
    return `<@${this.id}>`;
  }

  avatarUrlFormat(format?: string, query?: UrlQuery): string {
    if (!this.avatar) {
      return addQuery(
        this.defaultAvatarUrl,
        query,
      );
    }
    const hash = this.avatar;
    format = getFormatFromHash(
      hash,
      format,
      this.client.imageFormat,
    );
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.AVATAR(this.id, hash, format),
      query,
    );
  }

  async createMessage(
    options: RequestTypes.ExecuteWebhook,
    compatibleType?: string,
  ) {
    return this.execute(options, compatibleType);
  }

  async delete() {
    if (this.token) {
      return this.client.rest.deleteWebhookToken(this.id, this.token);
    }
    return this.client.rest.deleteWebhook(this.id);
  }

  async execute(
    options: RequestTypes.ExecuteWebhook,
    compatibleType?: string,
  ) {
    if (!this.token) {
      throw new Error('Webhook is missing it\'s token');
    }
    return this.client.rest.executeWebhook(this.id, this.token, options, compatibleType);
  }


  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
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
    return `${this.name}#${this.discriminator}`;
  }
}
