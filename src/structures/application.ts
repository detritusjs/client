import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ApplicationFlags,
  ApplicationIntegrationTypes,
  DetritusKeys,
  DiscordKeys,
  Distributors,
  DistributorNames,
  DistributorUrls,
  SpecialUrls,
} from '../constants';
import {
  addQuery,
  getFormatFromHash,
  getQueryForImage,
  Snowflake,
  UrlQuery,
} from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Team } from './team';
import { UserWithFlags, UserWithToken } from './user';


export const SpecialThirdPartySkus: {[key: string]: string} = Object.freeze({
  'Call of Duty Black Ops 4': 'call-of-duty',
  'Call of Duty Modern Warfare': 'call-of-duty-mw',
  'StarCraft': 'starcraft-remastered',
  'World of Warcraft Classic': 'world-of-warcraft',
  'World of Warcraft Public Test': 'world-of-warcraft',
});


export interface ApplicationDeveloper {
  id: string,
  name: string,
}

export interface ApplicationExecutable {
  arguments?: string,
  name: string,
  os: string,
}

export interface ApplicationPublisher {
  id: string,
  name: string,
}

const keysApplication = new BaseSet<string>([
  DiscordKeys.ALIASES,
  DiscordKeys.APPROXIMATE_GUILD_COUNT,
  DiscordKeys.BOT,
  DiscordKeys.BOT_PUBLIC,
  DiscordKeys.BOT_REQUIRE_CODE_GRANT,
  DiscordKeys.COVER_IMAGE,
  DiscordKeys.CUSTOM_INSTALL_URL,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.DEVELOPERS,
  DiscordKeys.EULA_ID,
  DiscordKeys.EXECUTABLES,
  DiscordKeys.FLAGS,
  DiscordKeys.GUILD_ID,
  DiscordKeys.HOOK,
  DiscordKeys.ICON,
  DiscordKeys.ID,
  DiscordKeys.INSTALL_PARAMS,
  DiscordKeys.INTEGRATION_TYPES_CONFIG,
  DiscordKeys.INTERACTIONS_ENDPOINT_URL,
  DiscordKeys.NAME,
  DiscordKeys.OVERLAY,
  DiscordKeys.OVERLAY_COMPATIBILITY_HOOK,
  DiscordKeys.OWNER,
  DiscordKeys.PRIMARY_SKU_ID,
  DiscordKeys.PRIVACY_POLICY_URL,
  DiscordKeys.PUBLISHERS,
  DiscordKeys.REDIRECT_URIS,
  DiscordKeys.ROLE_CONNECTIONS_VERIFY_URL,
  DiscordKeys.RPC_ORIGINS,
  DiscordKeys.SLUG,
  DiscordKeys.SPLASH,
  DiscordKeys.STORE_APPLICATION_STATE,
  DiscordKeys.SUMMARY,
  DiscordKeys.TAGS,
  DiscordKeys.TEAM,
  DiscordKeys.TERMS_OF_SERVICE_URL,
  DiscordKeys.THIRD_PARTY_SKUS,
  DiscordKeys.VERIFY_KEY,
  DiscordKeys.YOUTUBE_TRAILER_VIDEO_ID,
]);

/**
 * Application Structure, used for channels, guilds, presences, etc..
 * @category Structure
 */
export class Application extends BaseStructure {
  readonly _keys = keysApplication;

  aliases?: BaseSet<string>;
  approximateGuildCount?: number;
  bot?: UserWithToken;
  botPublic?: boolean;
  botRequireCodeGrant?: boolean;
  coverImage?: string;
  customInstallUrl?: string;
  description: string = '';
  developers?: Array<ApplicationDeveloper>;
  eulaId?: string;
  executables?: Array<ApplicationExecutable>;
  flags?: number;
  guildId?: string;
  hook?: boolean;
  icon: null | string = null;
  id: string = '';
  installParams?: ApplicationInstallParams;
  integrationTypesConfig?: BaseCollection<ApplicationIntegrationTypes, ApplicationIntegrationTypeConfiguration>;
  interactionsEndpointUrl?: string;
  name: string = '';
  overlay?: boolean;
  overlayCompatibilityHook?: boolean;
  owner?: UserWithFlags;
  primarySkuId?: string;
  privacyPolicyUrl?: string;
  publishers?: Array<ApplicationPublisher>;
  redirectUris?: Array<string>;
  roleConnectionsVerifyUrl?: string;
  rpcApplicationState?: number;
  rpcOrigins?: BaseSet<string>;
  secret?: string;
  slug?: string;
  splash?: string;
  storeApplicationState?: number;
  summary: string = '';
  tags?: Array<string>;
  team?: Team;
  termsOfServiceUrl?: string;
  thirdPartySkus?: BaseCollection<string, ApplicationThirdPartySku>;
  verifyKey: string = '';
  youtubeTrailerVideoId?: string;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get canGatewayGuildMembers(): boolean {
    return this.hasFlag(ApplicationFlags.GATEWAY_GUILD_MEMBERS) || this.hasFlag(ApplicationFlags.GATEWAY_GUILD_MEMBERS_LIMITED);
  }

  get canGatewayMessageContent(): boolean {
    return this.hasFlag(ApplicationFlags.GATEWAY_MESSAGE_CONTENT) || this.hasFlag(ApplicationFlags.GATEWAY_MESSAGE_CONTENT_LIMITED);
  }

  get canGatewayPresence(): boolean {
    return this.hasFlag(ApplicationFlags.GATEWAY_PRESENCE) || this.hasFlag(ApplicationFlags.GATEWAY_PRESENCE_LIMITED);
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

  get directoryUrl(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.APPLICATION_DIRECTORY(this.id);
  }

  get directoryPremiumUrl(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.APPLICATION_DIRECTORY_PREMIUM(this.id);
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

  get splashUrl(): null | string {
    return this.splashUrlFormat();
  }

  get youtubeTrailerUrl(): null | string {
    if (this.youtubeTrailerVideoId) {
      return SpecialUrls.YOUTUBE_VIDEO(this.youtubeTrailerVideoId);
    }
    return null;
  }

  coverImageUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): null | string {
    if (!this.coverImage) {
      return null;
    }
    const hash = this.coverImage;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.APP_ICON(this.id, hash, format), query);
  }

  hasFlag(flag: number): boolean {
    if (this.flags) {
      return (this.flags & flag) === flag;
    }
    return false;
  }

  iconUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): null | string {
    if (!this.icon) {
      return null;
    }
    const hash = this.icon;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.APP_ICON(this.id, hash, format), query);
  }

  matches(name: string): boolean {
    if (this.name === name) {
      return true;
    }
    if (this.aliases && this.aliases.some((alias) => alias === name)) {
      return true;
    }
    return false;
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

  splashUrlFormat(format?: number | null | string | UrlQuery, query?: number | UrlQuery): null | string {
    if (!this.splash) {
      return null;
    }
    const hash = this.splash;
    if ((format && typeof(format) === 'object') || typeof(format) === 'number') {
      query = format;
      format = null;
    }
    query = getQueryForImage(query);
    format = getFormatFromHash(hash, format, this.client.imageFormat);
    return addQuery(Endpoints.CDN.URL + Endpoints.CDN.APP_ICON(this.id, hash, format), query);
  }

  async bulkOverwriteRoleConnectionsMetadata(
    metadata: Array<
      RequestTypes.BulkOverwriteApplicationRoleConnectionsMetadataRecord |
      RequestTypes.toJSON<RequestTypes.BulkOverwriteApplicationRoleConnectionsMetadataRecordData>
    >,
  ) {
    return this.client.rest.bulkOverwriteApplicationRoleConnectionsMetadata(this.id, metadata);
  }

  async consumeEntitlement(entitlementId: string) {
    return this.client.rest.consumeApplicationEntitlement(this.id, entitlementId);
  }

  async createEntitlement(options: RequestTypes.CreateApplicationEntitlement) {
    return this.client.rest.createApplicationEntitlement(this.id, options);
  }

  async deleteEntitlement(entitlementId: string) {
    return this.client.rest.deleteApplicationEntitlement(this.id, entitlementId);
  }

  async fetchEntitlements(options: RequestTypes.FetchApplicationEntitlements = {}) {
    return this.client.rest.fetchApplicationEntitlements(this.id, options);
  }

  async fetchRoleConnectionsMetadata() {
    return this.client.rest.fetchApplicationRoleConnectionsMetadata(this.id);
  }

  async joinGuild(options: RequestTypes.JoinGuild = {}) {
    if (!this.guildId) {
      throw new Error('Application doesn\'t have a guildId to join');
    }
    return this.client.rest.joinGuild(this.guildId, options);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ALIASES in data) {
      const value = data[DiscordKeys.ALIASES];
      if (this.aliases) {
        this.aliases.clear();
        for (let raw of value) {
          this.aliases.add(raw);
        }
      } else {
        if (value.length) {
          this.aliases = new BaseSet(value);
        }
      }
    }
    if (DiscordKeys.APPROXIMATE_GUILD_COUNT in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPROXIMATE_GUILD_COUNT]] = data[DiscordKeys.APPROXIMATE_GUILD_COUNT];
    }
    if (DiscordKeys.BOT in data) {
      const value = new UserWithToken(this.client, data[DiscordKeys.BOT], this._clone);
      (this as any)[DetritusKeys[DiscordKeys.BOT]] = value;
    }
    if (DiscordKeys.BOT_PUBLIC in data) {
      (this as any)[DetritusKeys[DiscordKeys.BOT_PUBLIC]] = data[DiscordKeys.BOT_PUBLIC];
    }
    if (DiscordKeys.BOT_REQUIRE_CODE_GRANT in data) {
      (this as any)[DetritusKeys[DiscordKeys.BOT_REQUIRE_CODE_GRANT]] = data[DiscordKeys.BOT_REQUIRE_CODE_GRANT];
    }
    if (DiscordKeys.COVER_IMAGE in data) {
      (this as any)[DetritusKeys[DiscordKeys.COVER_IMAGE]] = data[DiscordKeys.COVER_IMAGE];
    }
    if (DiscordKeys.CUSTOM_INSTALL_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM_INSTALL_URL]] = data[DiscordKeys.CUSTOM_INSTALL_URL];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.DEVELOPERS in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEVELOPERS]] = data[DiscordKeys.DEVELOPERS];
    }
    if (DiscordKeys.EULA_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.EULA_ID]] = data[DiscordKeys.EULA_ID];
    }
    if (DiscordKeys.EXECUTABLES in data) {
      (this as any)[DetritusKeys[DiscordKeys.EXECUTABLES]] = data[DiscordKeys.EXECUTABLES];
    }
    if (DiscordKeys.FLAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.HOOK in data) {
      (this as any)[DetritusKeys[DiscordKeys.HOOK]] = data[DiscordKeys.HOOK];
    }
    if (DiscordKeys.ICON in data) {
      (this as any)[DetritusKeys[DiscordKeys.ICON]] = data[DiscordKeys.ICON];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.INSTALL_PARAMS in data) {
      const value = new ApplicationInstallParams(this, data[DiscordKeys.INSTALL_PARAMS]);
      (this as any)[DetritusKeys[DiscordKeys.INSTALL_PARAMS]] = value;
    }
    if (DiscordKeys.INTEGRATION_TYPES_CONFIG in data) {
      const value = new BaseCollection<ApplicationIntegrationTypes, ApplicationIntegrationTypeConfiguration>();
      for (let key in data[DiscordKeys.INTEGRATION_TYPES_CONFIG]) {
        const config = new ApplicationIntegrationTypeConfiguration(this, data[DiscordKeys.INTEGRATION_TYPES_CONFIG][key]);
        value.set(parseInt(key) as ApplicationIntegrationTypes, config);
      }
      (this as any)[DetritusKeys[DiscordKeys.INTEGRATION_TYPES_CONFIG]] = value;
    }
    if (DiscordKeys.INTERACTIONS_ENDPOINT_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.INTERACTIONS_ENDPOINT_URL]] = data[DiscordKeys.INTERACTIONS_ENDPOINT_URL];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.OVERLAY in data) {
      (this as any)[DetritusKeys[DiscordKeys.OVERLAY]] = data[DiscordKeys.OVERLAY];
    }
    if (DiscordKeys.OVERLAY_COMPATIBILITY_HOOK in data) {
      (this as any)[DetritusKeys[DiscordKeys.OVERLAY_COMPATIBILITY_HOOK]] = data[DiscordKeys.OVERLAY_COMPATIBILITY_HOOK];
    }
    if (DiscordKeys.OWNER in data) {
      const value = data[DiscordKeys.OWNER];
      if (!this.isClone && this.client.users.has(value.id)) {
        // dont use the cache since this object has flags key, just update the cache
        this.client.users.get(value.id)!.merge(value);
      }
      (this as any)[DetritusKeys[DiscordKeys.OWNER]] = new UserWithFlags(this.client, value);
    }
    if (DiscordKeys.PRIMARY_SKU_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.PRIMARY_SKU_ID]] = data[DiscordKeys.PRIMARY_SKU_ID];
    }
    if (DiscordKeys.PRIVACY_POLICY_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PRIVACY_POLICY_URL]] = data[DiscordKeys.PRIVACY_POLICY_URL];
    }
    if (DiscordKeys.PUBLISHERS in data) {
      (this as any)[DetritusKeys[DiscordKeys.PUBLISHERS]] = data[DiscordKeys.PUBLISHERS];
    }
    if (DiscordKeys.REDIRECT_URIS in data) {
      (this as any)[DetritusKeys[DiscordKeys.REDIRECT_URIS]] = data[DiscordKeys.REDIRECT_URIS];
    }
    if (DiscordKeys.ROLE_CONNECTIONS_VERIFY_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.ROLE_CONNECTIONS_VERIFY_URL]] = data[DiscordKeys.ROLE_CONNECTIONS_VERIFY_URL];
    }
    if (DiscordKeys.RPC_APPLICATION_STATE in data) {
      (this as any)[DetritusKeys[DiscordKeys.RPC_APPLICATION_STATE]] = data[DiscordKeys.RPC_APPLICATION_STATE];
    }
    if (DiscordKeys.RPC_ORIGINS in data) {
      const value = data[DiscordKeys.RPC_ORIGINS];
      if (this.rpcOrigins) {
        this.rpcOrigins.clear();
        for (let raw of value) {
          this.rpcOrigins.add(raw);
        }
      } else {
        if (value.length) {
          this.rpcOrigins = new BaseSet(value);
        }
      }
    }
    if (DiscordKeys.SLUG in data) {
      (this as any)[DetritusKeys[DiscordKeys.SLUG]] = data[DiscordKeys.SLUG];
    }
    if (DiscordKeys.SPLASH in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPLASH]] = data[DiscordKeys.SPLASH];
    }
    if (DiscordKeys.STORE_APPLICATION_STATE in data) {
      (this as any)[DetritusKeys[DiscordKeys.STORE_APPLICATION_STATE]] = data[DiscordKeys.STORE_APPLICATION_STATE];
    }
    if (DiscordKeys.SUMMARY in data) {
      (this as any)[DetritusKeys[DiscordKeys.SUMMARY]] = data[DiscordKeys.SUMMARY];
    }
    if (DiscordKeys.TAGS in data) {
      (this as any)[DetritusKeys[DiscordKeys.TAGS]] = data[DiscordKeys.TAGS];
    }
    if (DiscordKeys.TEAM in data) {
      const value = data[DiscordKeys.TEAM];

      let team: Team;
      if (this.team) {
        team = this.team;
        team.merge(value);
      } else {
        team = new Team(this.client, value, this._clone);
      }
      (this as any)[DetritusKeys[DiscordKeys.TEAM]] = team;
    }
    if (DiscordKeys.TERMS_OF_SERVICE_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.TERMS_OF_SERVICE_URL]] = data[DiscordKeys.TERMS_OF_SERVICE_URL];
    }
    if (DiscordKeys.THIRD_PARTY_SKUS in data) {
      const value = data[DiscordKeys.THIRD_PARTY_SKUS];
      if (this.thirdPartySkus) {
        this.thirdPartySkus.clear();
      } else {
        this.thirdPartySkus = new BaseCollection<string, ApplicationThirdPartySku>();
      }

      for (let raw of value) {
        const thirdPartySku = new ApplicationThirdPartySku(this, raw);
        this.thirdPartySkus.set(thirdPartySku.key, thirdPartySku);
      }
    }
    if (DiscordKeys.VERIFY_KEY in data) {
      (this as any)[DetritusKeys[DiscordKeys.VERIFY_KEY]] = data[DiscordKeys.VERIFY_KEY];
    }
    if (DiscordKeys.YOUTUBE_TRAILER_VIDEO_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.YOUTUBE_TRAILER_VIDEO_ID]] = data[DiscordKeys.YOUTUBE_TRAILER_VIDEO_ID];
    }
  }
}


const keysApplicationInstallParams = new BaseSet<string>([
  DiscordKeys.PERMISSIONS,
  DiscordKeys.SCOPE,
]);

export class ApplicationInstallParams extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysApplicationInstallParams;

  readonly application: Application;

  permissions!: string;
  scopes!: Array<string>;

  constructor(application: Application, data: BaseStructureData) {
    super(application.client, undefined, application._clone);
    this.application = application;
    this.merge(data);
    Object.defineProperty(this, 'application', {enumerable: false, writable: false});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
  
    if (DiscordKeys.PERMISSIONS in data) {
      (this as any)[DetritusKeys[DiscordKeys.PERMISSIONS]] = data[DiscordKeys.PERMISSIONS];
    }
    if (DiscordKeys.SCOPES in data) {
      (this as any)[DetritusKeys[DiscordKeys.SCOPES]] = data[DiscordKeys.SCOPES];
    }
  }
}


const keysApplicationIntegrationTypeConfiguration = new BaseSet<string>([
  DiscordKeys.OAUTH2_INSTALL_PARAMS,
]);

export class ApplicationIntegrationTypeConfiguration extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysApplicationIntegrationTypeConfiguration;

  readonly application: Application;

  oauth2_install_params?: ApplicationInstallParams;

  constructor(application: Application, data: BaseStructureData) {
    super(application.client, undefined, application._clone);
    this.application = application;
    this.merge(data);
    Object.defineProperty(this, 'application', {enumerable: false, writable: false});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.OAUTH2_INSTALL_PARAMS in data) {
      const value = new ApplicationInstallParams(this.application, data[DiscordKeys.OAUTH2_INSTALL_PARAMS]);
      (this as any)[DetritusKeys[DiscordKeys.OAUTH2_INSTALL_PARAMS]] = value;
    }
  }
}



const keysApplicationThirdPartySku = new BaseSet<string>([
  DiscordKeys.DISTRIBUTOR,
  DiscordKeys.ID,
  DiscordKeys.SKU,
]);

export class ApplicationThirdPartySku extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysApplicationThirdPartySku;

  readonly application: Application;

  distributor!: Distributors;
  id: null | string = null;
  sku: null | string = null; // deprecated

  constructor(application: Application, data: BaseStructureData) {
    super(application.client, undefined, application._clone);
    this.application = application;
    this.merge(data);
    Object.defineProperty(this, 'application', {enumerable: false, writable: false});
  }

  get key(): string {
    return `${this.distributor}.${this.id || ''}`;
  }

  get name(): string {
    if (this.distributor in DistributorNames) {
      return DistributorNames[this.distributor];
    }
    return this.distributor;
  }

  get url(): null | string {
    if (this.distributor in DistributorUrls) {
      const url = DistributorUrls[this.distributor];
      switch (this.distributor) {
        case Distributors.BATTLENET: {
          // use name
          let skuId: string;
          if (this.application.name in SpecialThirdPartySkus) {
            skuId = SpecialThirdPartySkus[this.application.name];
          } else {
            skuId = this.application.name.replace(/ /g, '-').toLowerCase();
          }
          return url(skuId);
        };
        case Distributors.DISCORD: {
          const skuId = this.id as string;
          return url(skuId, this.application.slug);
        };
        case Distributors.EPIC: {
          const skuId = (this.id as string).toLowerCase();
          return url(skuId);
        };
        case Distributors.GOG: {
          const skuId = this.application.name.replace(/ /g, '_').toLowerCase();
          return url(skuId);
        };
        case Distributors.ORIGIN: {
          let skuId: string;
          if (this.application.aliases && this.application.aliases.length) {
            skuId = this.application.aliases.first() as string;
          } else {
            skuId = this.application.name;
          }
          return url(skuId);
        };
        case Distributors.STEAM: {
          const skuId = this.id as string;
          return url(skuId);
        };
        case Distributors.TWITCH: {
          // they shut down lol
        }; break;
        case Distributors.UPLAY: {
          const skuId = this.application.name;
          return url(skuId);
        };
      }
    }
    return null;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.DISTRIBUTOR in data) {
      (this as any)[DetritusKeys[DiscordKeys.DISTRIBUTOR]] = data[DiscordKeys.DISTRIBUTOR];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.SKU in data) {
      (this as any)[DetritusKeys[DiscordKeys.SKU]] = data[DiscordKeys.SKU];
    }
  }
}
