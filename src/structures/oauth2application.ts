import { Endpoints, RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, Oauth2AssetTypes } from '../constants';
import {
  addQuery,
  getFormatFromHash,
  Snowflake,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Team } from './team';
import { User, UserWithFlags, UserWithToken } from './user';


const keysOauth2Application = new BaseSet<string>([
  DiscordKeys.BOT,
  DiscordKeys.BOT_PUBLIC,
  DiscordKeys.BOT_REQUIRE_CODE_GRANT,
  DiscordKeys.COVER_IMAGE,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.FLAGS,
  DiscordKeys.GUILD_ID,
  DiscordKeys.HOOK,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.OWNER,
  DiscordKeys.PRIMARY_SKU_ID,
  DiscordKeys.REDIRECT_URIS,
  DiscordKeys.RPC_APPLICATION_STATE,
  DiscordKeys.RPC_ORIGINS,
  DiscordKeys.SECRET,
  DiscordKeys.SLUG,
  DiscordKeys.STORE_APPLICATION_STATE,
  DiscordKeys.SUMMARY,
  DiscordKeys.TEAM,
  DiscordKeys.VERIFY_KEY,
]);

/**
 * Oauth2 Application Structure
 * @category Structure
 */
export class Oauth2Application extends BaseStructure {
  readonly _keys = keysOauth2Application;

  bot?: UserWithToken;
  botPublic: boolean = false;
  botRequireCodeGrant: boolean = false;
  coverImage?: string | null;
  description: string = '';
  flags: number = 0;
  guildId?: string;
  icon: null | string = null;
  id: string = '';
  name: string = '';
  owner!: UserWithFlags;
  primarySkuId?: string;
  redirectUris?: Array<string>;
  rpcApplicationState?: number;
  rpcOrigins?: Array<string>;
  secret?: string;
  slug?: string;
  storeApplicationState?: number;
  summary: string = '';
  team?: Team;
  verifyKey: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get coverImageUrl(): null | string {
    return this.coverImageUrlFormat();
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get jumpLink(): null | string {
    return this.platformDiscordUrl;
  }

  get iconUrl(): null | string {
    return this.iconUrlFormat();
  }

  get isOnDiscord(): boolean {
    return !!this.primarySkuId;
  }

  get oauth2Url(): string {
    return this.oauth2UrlFormat();
  }

  get platformDiscordUrl(): null | string {
    if (this.primarySkuId) {
      return (
        Endpoints.Routes.URL +
        Endpoints.Routes.APPLICATION_STORE_LISTING_SKU(this.primarySkuId, this.slug)
      );
    }
    return null;
  }

  coverImageUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (this.coverImage) {
      const hash = this.coverImage;
      format = getFormatFromHash(hash, format, this.client.imageFormat);
      return addQuery(Endpoints.CDN.URL + Endpoints.CDN.APP_ICON(this.id, hash, format), query);
    }
    return null;
  }

  iconUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (this.icon) {
      const hash = this.icon;
      format = getFormatFromHash(hash, format, this.client.imageFormat);
      return addQuery(Endpoints.CDN.URL + Endpoints.CDN.APP_ICON(this.id, hash, format), query);
    }
    return null;
  }

  oauth2UrlFormat(options: UrlQuery = {}): string {
    const query = {
      channel_id: options.channelId,
      client_id: this.id,
      disable_guild_select: options.disableGuildSelect,
      guild_id: options.guildId,
      permissions: options.permissions,
      prompt: options.prompt,
      redirect_uri: options.redirectUri,
      response_type: options.responseType,
      scope: options.scope,
    };
    if (Array.isArray(options.scope)) {
      query.scope = options.scope.join(' ');
    }
    return addQuery(Endpoints.Routes.URL + Endpoints.Routes.OAUTH2_AUTHORIZE, query);
  }

  async createAsset(options: RequestTypes.CreateOauth2ApplicationAsset) {
    return this.client.rest.createOauth2ApplicationAsset(this.id, options);
  }

  async createStoreAsset(options: RequestTypes.CreateStoreApplicationAsset) {
    return this.client.rest.createStoreApplicationAsset(this.id, options);
  }

  async deleteAsset(assetId: string) {
    return this.client.rest.deleteOauth2ApplicationAsset(this.id, assetId);
  }

  async deleteStoreAsset(assetId: string) {
    return this.client.rest.deleteStoreApplicationAsset(this.id, assetId);
  }

  async fetchAssets() {
    return this.client.rest.fetchOauth2ApplicationAssets(this.id);
  }

  async fetchNews() {
    return this.client.rest.fetchApplicationNews(this.id);
  }

  async fetchStoreAssets() {
    return this.client.rest.fetchStoreApplicationAssets(this.id);
  }

  async joinGuild(options: RequestTypes.JoinGuild = {}) {
    if (!this.guildId) {
      throw new Error('Application doesn\'t have a guildId to join');
    }
    return this.client.rest.joinGuild(this.guildId, options);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.BOT: {
          value = new UserWithToken(this.client, value);
        }; break;
        case DiscordKeys.OWNER: {
          if (this.client.users.has(value.id)) {
            // dont use the cache since this object has flags key, just update the cache
            (<User> this.client.users.get(value.id)).merge(value);
          }
          value = new UserWithFlags(this.client, value);
        }; break;
        case DiscordKeys.TEAM: {
          let team: Team;
          if (this.team) {
            team = this.team;
            team.merge(value);
          } else {
            team = new Team(this.client, value);
          }
          value = team;
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}


export const keysOauth2ApplicationAsset = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.TYPE,
]);

export class Oauth2ApplicationAsset extends BaseStructure {
  readonly _keys = keysOauth2ApplicationAsset;

  applicationId: string = '';
  id: string = '';
  name: string = '';
  type!: Oauth2AssetTypes;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get isLarge(): boolean {
    return this.type === Oauth2AssetTypes.LARGE;
  }

  get isSmall(): boolean {
    return this.type === Oauth2AssetTypes.SMALL;
  }

  get url(): string {
    return this.urlFormat();
  }

  urlFormat(format?: null | string, query?: UrlQuery): string {
    const hash = this.id;
    format = getFormatFromHash(
      hash,
      format,
      this.client.imageFormat,
    );
    return addQuery(
      Endpoints.CDN.URL + Endpoints.CDN.APP_ASSET(this.applicationId, hash, format),
      query,
    );
  }

  async delete() {
    return this.client.rest.deleteOauth2ApplicationAsset(this.applicationId, this.id);
  }
}
