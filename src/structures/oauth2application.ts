import { Endpoints, RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, Oauth2AssetTypes } from '../constants';
import {
  addQuery,
  getFormatFromHash,
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
  DiscordKeys.DESCRIPTION,
  DiscordKeys.FLAGS,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.OWNER,
  DiscordKeys.REDIRECT_URIS,
  DiscordKeys.RPC_APPLICATION_STATE,
  DiscordKeys.SECRET,
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
  description: string = '';
  flags: number = 0;
  guildId?: string;
  icon: null | string = null;
  id: string = '';
  name: string = '';
  owner?: UserWithFlags;
  redirectUris: Array<string> = [];
  rpcApplicationState: number = 0;
  secret?: string;
  team?: Team;
  verifyKey: string = '';

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
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

  async joinGuild(options: RequestTypes.JoinGuild) {
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
      return super.mergeValue.call(this, key, value);
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
  type: number = 0;

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
