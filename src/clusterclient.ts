import {
  Client as DetritusRestClient,
} from 'detritus-client-rest';
import { EventSpewer, EventSubscription } from 'detritus-utils';

import { Bucket } from './bucket';
import {
  ShardClient,
  ShardClientOptions,
  ShardClientRunOptions,
} from './client';
import { ClusterProcessChild } from './cluster/processchild';
import { BaseCollection } from './collections/basecollection';
import { CommandClient } from './commandclient';
import { AuthTypes, ClientEvents, SocketStates, DEFAULT_SHARD_LAUNCH_DELAY } from './constants';
import { GatewayClientEvents } from './gateway/clientevents';
import { SlashCommandClient } from './slashcommandclient';


export interface ClusterClientOptions extends ShardClientOptions {
  maxConcurrency?: number,
  shardCount?: number,
  shards?: [number, number],
}

export interface ClusterClientRunOptions extends ShardClientRunOptions {
  delay?: number,
  maxConcurrency?: number,
  shardCount?: number,
}

export class ClusterClient extends EventSpewer {
  readonly _refresh = {
    applications: {last: 0, time: 4 * (60 * 60) * 1000},
    oauth2Application: {last: 0, time: 4 * (60 * 60) * 1000},
  };
  readonly _shardsWaiting = new BaseCollection<number, {resolve: Function, reject: Function}>();
  readonly token: string;

  readonly commandClient: CommandClient | null = null;
  readonly manager: ClusterProcessChild | null = null;
  readonly rest: DetritusRestClient;
  readonly slashCommandClient: SlashCommandClient | null = null;

  buckets = new BaseCollection<number, Bucket>();
  maxConcurrency: number = 1;
  ran: boolean = false;
  shardCount: number = 0;
  shardEnd: number = -1;
  shardStart: number = 0;
  shards = new BaseCollection<number, ShardClient>();
  shardOptions: ShardClientOptions = {};

  constructor(
    token: string,
    options: ClusterClientOptions = {},
  ) {
    super();
    options = Object.assign({}, options);

    const isUsingClusterManager = process.env.CLUSTER_MANAGER === 'true';
    if (isUsingClusterManager) {
      const { 
        CLUSTER_SHARD_COUNT,
        CLUSTER_SHARD_END,
        CLUSTER_SHARD_START,
        CLUSTER_TOKEN,
        MAX_CONCURRENCY,
      } = process.env;
      token = CLUSTER_TOKEN as string;
      options.maxConcurrency = +(MAX_CONCURRENCY as string);
      options.shardCount = +(CLUSTER_SHARD_COUNT as string);
      options.shards = [
        +(CLUSTER_SHARD_START as string),
        +(CLUSTER_SHARD_END as string),
      ];
    }

    if (!token) {
      throw new Error('Token is required for this library to work.');
    }
    this.token = token;

    this.maxConcurrency = options.maxConcurrency || this.maxConcurrency;
    this.shardCount = +(options.shardCount || this.shardCount);
    if (Array.isArray(options.shards)) {
      if (options.shards.length !== 2) {
        throw new Error('Shards need to be in the format of [shardStart, shardEnd]');
      }
      const [shardStart, shardEnd] = options.shards;
      this.shardEnd = +shardEnd;
      this.shardStart = +shardStart;
    }

    Object.assign(this.shardOptions, options);
    this.shardOptions.isBot = true;
    this.shardOptions.rest = Object.assign({}, this.shardOptions.rest);
    this.shardOptions.rest.authType = AuthTypes.BOT;

    this.rest = new DetritusRestClient(token, this.shardOptions.rest);
    this.shardOptions.rest.globalBucket = this.rest.globalBucket;
    this.shardOptions.rest.routesCollection = this.rest.routes;

    this.shardOptions.pass = Object.assign({}, this.shardOptions.pass);
    this.shardOptions.pass.cluster = this;

    if (this.shardOptions.pass.commandClient) {
      this.commandClient = this.shardOptions.pass.commandClient;
    }
    if (this.shardOptions.pass.slashCommandClient) {
      this.slashCommandClient = this.shardOptions.pass.slashCommandClient;
    }

    if (isUsingClusterManager) {
      this.manager = new ClusterProcessChild(this);
    }

    Object.defineProperties(this, {
      commandClient: {configurable: true, enumerable: false, writable: false},
      manager: {configurable: false, writable: false},
      ran: {configurable: true, writable: false},
      rest: {enumerable: false, writable: false},
      shardCount: {writable: false},
      shardEnd: {configurable: true, writable: false},
      shardStart: {configurable: true, writable: false},
      shards: {writable: false},
      shardOptions: {enumerable: false, writable: false},
      slashCommandClient: {enumerable: false, writable: false},
      token: {enumerable: false, writable: false},
    });
  }

  get applicationId(): string {
    return (this.shards.length) ? this.shards.first()!.applicationId : '';
  }

  get clusterId(): number {
    return (this.manager) ? this.manager.clusterId : 0;
  }

  setShardCount(value: number): void {
    Object.defineProperty(this, 'shardCount', {value});
  }

  setShardEnd(value: number): void {
    Object.defineProperty(this, 'shardEnd', {value});
  }

  setShardStart(value: number): void {
    Object.defineProperty(this, 'shardStart', {value});
  }

  /** @hidden */
  _eval(code: string): any {
    return eval(code);
  }

  kill(error?: Error): void {
    for (let [shardId, shard] of this.shards) {
      shard.kill(error);
    }
    this.shards.clear();
    Object.defineProperty(this, 'ran', {value: false});
    this.emit(ClientEvents.KILLED, {error});
    this.removeAllListeners();
  }

  hookedHasEventListener(shard: ShardClient, name: string): boolean {
    return super.hasEventListener(name) || super.hasEventListener.call(shard, name);
  }

  hookedEmit(shard: ShardClient, name: string, event: any): boolean {
    if (name !== ClientEvents.READY) {
      if (this.hasEventListener(name)) {
        const clusterEvent = Object.assign({}, event, {shard});
        this.emit(name, clusterEvent);
      }
    }
    return super.emit.call(shard, name, event);
  }

  async fillApplications(): Promise<void> {
    const refresh = this._refresh.applications;
    if (Date.now() - refresh.last < refresh.time) {
      return;
    }
    const firstShard = this.shards.first();
    const enabled = (firstShard) ? firstShard.applications.enabled : false;
    if (enabled) {
      refresh.last = Date.now();

      let applications: Array<any>;
      if (this.manager && this.manager.hasMultipleClusters) {
        applications = await this.manager.sendRestRequest('fetchApplicationsDetectable');
      } else {
        applications = await this.rest.fetchApplicationsDetectable();
      }
      for (let [shardId, shard] of this.shards) {
        shard.applications.fill(applications);
      }
    }
  }

  async fillOauth2Application(): Promise<void> {
    const refresh = this._refresh.oauth2Application;
    if (Date.now() - refresh.last < refresh.time) {
      return;
    }
    const data = await this.rest.fetchOauth2Application();
    refresh.last = Date.now();
    for (let [shardId, shard] of this.shards) {
      shard._mergeOauth2Application(data);
    }
  }

  async run(
    options: ClusterClientRunOptions = {},
  ): Promise<ClusterClient> {
    if (this.ran) {
      return this;
    }
    Object.defineProperty(this, 'ran', {value: true});
    options = Object.assign({
      delay: DEFAULT_SHARD_LAUNCH_DELAY,
      url: process.env.GATEWAY_URL,
    }, options, {
      wait: false,
    });

    const delay = +(options.delay as number);

    let maxConcurrency: number = +(options.maxConcurrency || this.maxConcurrency);
    let shardCount: number = options.shardCount || this.shardCount || 0;
    if (options.url === undefined || !shardCount || !maxConcurrency) {
      const data = await this.rest.fetchGatewayBot();
      maxConcurrency = data.session_start_limit.max_concurrency;
      shardCount = shardCount || data.shards;
      options.url = options.url || data.url;
    }
    if (!shardCount) {
      throw new Error('Shard Count cannot be 0, pass in one via the options or the constructor.');
    }
    this.maxConcurrency = maxConcurrency;
    this.setShardCount(shardCount);
    if (this.shardEnd === -1) {
      this.setShardEnd(shardCount - 1);
    }

    for (let shardId = this.shardStart; shardId <= this.shardEnd; shardId++) {
      const ratelimitKey = this.getRatelimitKey(shardId);
      if (!this.buckets.has(ratelimitKey)) {
        const bucket = new Bucket(1, delay, true);
        this.buckets.set(ratelimitKey, bucket);
      }

      const shardOptions = Object.assign({}, this.shardOptions);
      shardOptions.gateway = Object.assign({}, shardOptions.gateway, {shardCount, shardId});
      if (this.commandClient || this.slashCommandClient) {
        shardOptions.pass = Object.assign({}, shardOptions.pass);
        if (this.commandClient) {
          shardOptions.pass.commandClient = this.commandClient;
        }
        if (this.slashCommandClient) {
          shardOptions.pass.slashCommandClient = this.slashCommandClient;
        }
      }

      const shard = new ShardClient(this.token, shardOptions);
      Object.defineProperties(shard, {
        hasEventListener: {value: this.hookedHasEventListener.bind(this, shard)},
        emit: {value: this.hookedEmit.bind(this, shard)},
      });
      this.shards.set(shardId, shard);
      if (!this.manager) {
        shard.gateway.on('state', ({state}) => {
          switch (state) {
            case SocketStates.READY: {
              const waiting = this._shardsWaiting.get(shardId);
              if (waiting) {
                waiting.resolve();
              }
              this._shardsWaiting.delete(shardId);
            }; break;
          }
        });
        shard.gateway.onIdentifyCheck = () => {
          const bucket = this.buckets.get(ratelimitKey);
          if (bucket) {
            const waiting = this._shardsWaiting.get(shardId);
            if (waiting) {
              shard.gateway.identify();
            } else {
              bucket.add(() => {
                shard.gateway.identify();
                return new Promise((resolve, reject) => {
                  this._shardsWaiting.set(shardId, {resolve, reject});
                });
              });
            }
          }
          return false;
        };
      }
      this.emit(ClientEvents.SHARD, {shard});
    }
    await this.fillApplications();
    await this.fillOauth2Application();
    for (let [shardId, shard] of this.shards) {
      await shard.run(options);
    }
    this.emit(ClientEvents.READY);
    return this;
  }

  getRatelimitKey(shardId: number): number {
    return shardId % this.maxConcurrency;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: ClientEvents.ACTIVITY_JOIN_INVITE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinInvite) => any): this;
  on(event: 'activityJoinInvite', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinInvite) => any): this;
  on(event: ClientEvents.ACTIVITY_JOIN_REQUEST, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinRequest) => any): this;
  on(event: 'activityJoinRequest', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinRequest) => any): this;
  on(event: ClientEvents.ACTIVITY_START, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityStart) => any): this;
  on(event: 'activityStart', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityStart) => any): this;
  on(event: ClientEvents.APPLICATION_COMMAND_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandCreate) => any): this;
  on(event: 'applicationCommandCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandCreate) => any): this;
  on(event: ClientEvents.APPLICATION_COMMAND_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandDelete) => any): this;
  on(event: 'applicationCommandDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandDelete) => any): this;
  on(event: ClientEvents.APPLICATION_COMMAND_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandUpdate) => any): this;
  on(event: 'applicationCommandUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandUpdate) => any): this;
  on(event: ClientEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  on(event: 'braintreePopupBridgeCallback', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  on(event: ClientEvents.CALL_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallCreate) => any): this;
  on(event: 'callCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallCreate) => any): this;
  on(event: ClientEvents.CALL_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallDelete) => any): this;
  on(event: 'callDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallDelete) => any): this;
  on(event: ClientEvents.CALL_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallUpdate) => any): this;
  on(event: 'callUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallUpdate) => any): this;
  on(event: ClientEvents.CHANNEL_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelCreate) => any): this;
  on(event: 'channelCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelCreate) => any): this;
  on(event: ClientEvents.CHANNEL_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelDelete) => any): this;
  on(event: 'channelDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelDelete) => any): this;
  on(event: ClientEvents.CHANNEL_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelUpdate) => any): this;
  on(event: 'channelUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelUpdate) => any): this;
  on(event: ClientEvents.CHANNEL_PINS_ACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsAck) => any): this;
  on(event: 'channelPinsAck', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsAck) => any): this;
  on(event: ClientEvents.CHANNEL_PINS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsUpdate) => any): this;
  on(event: 'channelPinsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsUpdate) => any): this;
  on(event: ClientEvents.CHANNEL_RECIPIENT_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientAdd) => any): this;
  on(event: 'channelRecipientAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientAdd) => any): this;
  on(event: ClientEvents.CHANNEL_RECIPIENT_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientRemove) => any): this;
  on(event: 'channelRecipientRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientRemove) => any): this;
  on(event: ClientEvents.ENTITLEMENT_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementCreate) => any): this;
  on(event: 'entitlementCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementCreate) => any): this;
  on(event: ClientEvents.ENTITLEMENT_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementDelete) => any): this;
  on(event: 'entitlementDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementDelete) => any): this;
  on(event: ClientEvents.ENTITLEMENT_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementUpdate) => any): this;
  on(event: 'entitlementUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementUpdate) => any): this;
  on(event: ClientEvents.FRIEND_SUGGESTION_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionCreate) => any): this;
  on(event: 'friendSuggestionCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionCreate) => any): this;
  on(event: ClientEvents.FRIEND_SUGGESTION_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionDelete) => any): this;
  on(event: 'friendSuggestionDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionDelete) => any): this;
  on(event: ClientEvents.GATEWAY_READY, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayReady) => any): this;
  on(event: 'gatewayReady', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayReady) => any): this;
  on(event: ClientEvents.GATEWAY_RESUMED, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayResumed) => any): this;
  on(event: 'gatewayResumed', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayResumed) => any): this;
  on(event: ClientEvents.GIFT_CODE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GiftCodeUpdate) => any): this;
  on(event: 'giftCodeUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GiftCodeUpdate) => any): this;
  on(event: ClientEvents.GUILD_BAN_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd) => any): this;
  on(event: 'guildBanAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd) => any): this;
  on(event: ClientEvents.GUILD_BAN_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove) => any): this;
  on(event: 'guildBanRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove) => any): this;
  on(event: ClientEvents.GUILD_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildCreate) => any): this;
  on(event: 'guildCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildCreate) => any): this;
  on(event: ClientEvents.GUILD_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildDelete) => any): this;
  on(event: 'guildDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildDelete) => any): this;
  on(event: ClientEvents.GUILD_EMOJIS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildEmojisUpdate) => any): this;
  on(event: 'guildEmojisUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildEmojisUpdate) => any): this;
  on(event: ClientEvents.GUILD_INTEGRATIONS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  on(event: 'guildIntegrationsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  on(event: ClientEvents.GUILD_MEMBER_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd) => any): this;
  on(event: 'guildMemberAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd) => any): this;
  on(event: ClientEvents.GUILD_MEMBER_LIST_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberListUpdate) => any): this;
  on(event: 'guildMemberListUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberListUpdate) => any): this;
  on(event: ClientEvents.GUILD_MEMBER_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove) => any): this;
  on(event: 'guildMemberRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove) => any): this;
  on(event: ClientEvents.GUILD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate) => any): this;
  on(event: 'guildMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate) => any): this;
  on(event: ClientEvents.GUILD_MEMBERS_CHUNK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMembersChunk) => any): this;
  on(event: 'guildMembersChunk', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMembersChunk) => any): this;
  on(event: ClientEvents.GUILD_READY, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildReady) => any): this;
  on(event: 'guildReady', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildReady) => any): this;
  on(event: ClientEvents.GUILD_ROLE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate) => any): this;
  on(event: 'guildRoleCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate) => any): this;
  on(event: ClientEvents.GUILD_ROLE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete) => any): this;
  on(event: 'guildRoleDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete) => any): this;
  on(event: ClientEvents.GUILD_ROLE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate) => any): this;
  on(event: 'guildRoleUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate) => any): this;
  on(event: ClientEvents.GUILD_STICKERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildStickersUpdate) => any): this;
  on(event: 'guildStickersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildStickersUpdate) => any): this;
  on(event: ClientEvents.GUILD_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildUpdate) => any): this;
  on(event: 'guildUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildUpdate) => any): this;
  on(event: ClientEvents.INTERACTION_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InteractionCreate) => any): this;
  on(event: 'interactionCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InteractionCreate) => any): this;
  on(event: ClientEvents.INVITE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteCreate) => any): this;
  on(event: 'inviteCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteCreate) => any): this;
  on(event: ClientEvents.INVITE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteDelete) => any): this;
  on(event: 'inviteDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteDelete) => any): this;
  on(event: ClientEvents.LIBRARY_APPLICATION_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  on(event: 'libraryApplicationUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  on(event: ClientEvents.LOBBY_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyCreate) => any): this;
  on(event: 'lobbyCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyCreate) => any): this;
  on(event: ClientEvents.LOBBY_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyDelete) => any): this;
  on(event: 'lobbyDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyDelete) => any): this;
  on(event: ClientEvents.LOBBY_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyUpdate) => any): this;
  on(event: 'lobbyUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyUpdate) => any): this;
  on(event: ClientEvents.LOBBY_MEMBER_CONNECT, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberConnect) => any): this;
  on(event: 'lobbyMemberConnect', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberConnect) => any): this;
  on(event: ClientEvents.LOBBY_MEMBER_DISCONNECT, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  on(event: 'lobbyMemberDisconnect', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  on(event: ClientEvents.LOBBY_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberUpdate) => any): this;
  on(event: 'lobbyMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberUpdate) => any): this;
  on(event: ClientEvents.LOBBY_MESSAGE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMessage) => any): this;
  on(event: 'lobbyMessage', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMessage) => any): this;
  on(event: ClientEvents.LOBBY_VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  on(event: 'lobbyVoiceServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  on(event: ClientEvents.LOBBY_VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  on(event: 'lobbyVoiceStateUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  on(event: ClientEvents.MESSAGE_ACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageAck) => any): this;
  on(event: 'messageAck', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageAck) => any): this;
  on(event: ClientEvents.MESSAGE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate) => any): this;
  on(event: 'messageCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate) => any): this;
  on(event: ClientEvents.MESSAGE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete) => any): this;
  on(event: 'messageDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete) => any): this;
  on(event: ClientEvents.MESSAGE_DELETE_BULK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk) => any): this;
  on(event: 'messageDeleteBulk', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk) => any): this;
  on(event: ClientEvents.MESSAGE_REACTION_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionAdd) => any): this;
  on(event: 'messageReactionAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionAdd) => any): this;
  on(event: ClientEvents.MESSAGE_REACTION_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemove) => any): this;
  on(event: 'messageReactionRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemove) => any): this;
  on(event: ClientEvents.MESSAGE_REACTION_REMOVE_ALL, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  on(event: 'messageReactionRemoveAll', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  on(event: ClientEvents.MESSAGE_REACTION_REMOVE_EMOJI, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  on(event: 'messageReactionRemoveEmoji', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  on(event: ClientEvents.MESSAGE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate) => any): this;
  on(event: 'messageUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate) => any): this;
  on(event: ClientEvents.PRESENCES_REPLACE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresencesReplace) => any): this;
  on(event: 'presencesReplace', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresencesReplace) => any): this;
  on(event: ClientEvents.PRESENCE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresenceUpdate) => any): this;
  on(event: 'presenceUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresenceUpdate) => any): this;
  on(event: ClientEvents.RECENT_MENTION_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RecentMentionDelete) => any): this;
  on(event: 'recentMentionDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RecentMentionDelete) => any): this;
  on(event: ClientEvents.RELATIONSHIP_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipAdd) => any): this;
  on(event: 'relationshipAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipAdd) => any): this;
  on(event: ClientEvents.RELATIONSHIP_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipRemove) => any): this;
  on(event: 'relationshipRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipRemove) => any): this;
  on(event: ClientEvents.SESSIONS_REPLACE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.SessionsReplace) => any): this;
  on(event: 'sessionsReplace', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.SessionsReplace) => any): this;
  on(event: ClientEvents.STAGE_INSTANCE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceCreate) => any): this;
  on(event: 'stageInstanceCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceCreate) => any): this;
  on(event: ClientEvents.STAGE_INSTANCE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceDelete) => any): this;
  on(event: 'stageInstanceDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceDelete) => any): this;
  on(event: ClientEvents.STAGE_INSTANCE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceUpdate) => any): this;
  on(event: 'stageInstanceUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceUpdate) => any): this;
  on(event: ClientEvents.STREAM_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamCreate) => any): this;
  on(event: 'streamCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamCreate) => any): this;
  on(event: ClientEvents.STREAM_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamDelete) => any): this;
  on(event: 'streamDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamDelete) => any): this;
  on(event: ClientEvents.STREAM_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamServerUpdate) => any): this;
  on(event: 'streamServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamServerUpdate) => any): this;
  on(event: ClientEvents.STREAM_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamUpdate) => any): this;
  on(event: 'streamUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamUpdate) => any): this;
  on(event: ClientEvents.THREAD_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadCreate) => any): this;
  on(event: 'threadCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadCreate) => any): this;
  on(event: ClientEvents.THREAD_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadDelete) => any): this;
  on(event: 'threadDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadDelete) => any): this;
  on(event: ClientEvents.THREAD_LIST_SYNC, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadListSync) => any): this;
  on(event: 'threadListSync', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadListSync) => any): this;
  on(event: ClientEvents.THREAD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMemberUpdate) => any): this;
  on(event: 'threadMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMemberUpdate) => any): this;
  on(event: ClientEvents.THREAD_MEMBERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMembersUpdate) => any): this;
  on(event: 'threadMembersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMembersUpdate) => any): this;
  on(event: ClientEvents.THREAD_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadUpdate) => any): this;
  on(event: 'threadUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadUpdate) => any): this;
  on(event: ClientEvents.TYPING_START, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStart) => any): this;
  on(event: 'typingStart', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStart) => any): this;
  on(event: ClientEvents.TYPING_STOP, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStop) => any): this;
  on(event: 'typingStop', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStop) => any): this;
  on(event: ClientEvents.USER_ACHIEVEMENT_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserAchievementUpdate) => any): this;
  on(event: 'userAchievementUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserAchievementUpdate) => any): this;
  on(event: ClientEvents.USER_CONNECTIONS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserConnectionsUpdate) => any): this;
  on(event: 'userConnectionsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserConnectionsUpdate) => any): this;
  on(event: ClientEvents.USER_FEED_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  on(event: 'userFeedSettingsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  on(event: ClientEvents.USER_GUILD_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  on(event: 'userGuildSettingsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  on(event: ClientEvents.USER_NOTE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserNoteUpdate) => any): this;
  on(event: 'userNoteUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserNoteUpdate) => any): this;
  on(event: ClientEvents.USER_PAYMENT_SOURCES_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  on(event: 'userPaymentSourcesUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  on(event: ClientEvents.USER_PAYMENTS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentsUpdate) => any): this;
  on(event: 'userPaymentsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentsUpdate) => any): this;
  on(event: ClientEvents.USER_REQUIRED_ACTION_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserRequiredActionUpdate) => any): this;
  on(event: 'userRequiredActionUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserRequiredActionUpdate) => any): this;
  on(event: ClientEvents.USER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserUpdate) => any): this;
  on(event: 'userUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserUpdate) => any): this;
  on(event: ClientEvents.USERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate) => any): this;
  on(event: 'usersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate) => any): this;
  on(event: ClientEvents.VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceServerUpdate) => any): this;
  on(event: 'voiceServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceServerUpdate) => any): this;
  on(event: ClientEvents.VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate) => any): this;
  on(event: 'voiceStateUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate) => any): this;
  on(event: ClientEvents.WEBHOOKS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.WebhooksUpdate) => any): this;
  on(event: 'webhooksUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.WebhooksUpdate) => any): this;
  on(event: ClientEvents.RAW, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Raw) => any): this;
  on(event: 'raw', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Raw) => any): this;
  on(event: ClientEvents.REST_REQUEST, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestRequest) => any): this;
  on(event: 'restRequest', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestRequest) => any): this;
  on(event: ClientEvents.REST_RESPONSE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestResponse) => any): this;
  on(event: 'restResponse', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestResponse) => any): this;
  on(event: ClientEvents.UNKNOWN, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Unknown) => any): this;
  on(event: 'unknown', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Unknown) => any): this;
  on(event: ClientEvents.WARN, listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Warn) | GatewayClientEvents.Warn) => any): this;
  on(event: 'warn', listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Warn) | GatewayClientEvents.Warn) => any): this;
  on(event: ClientEvents.KILLED, listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Killed) | GatewayClientEvents.Killed) => any): this;
  on(event: 'killed', listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Killed) | GatewayClientEvents.Killed) => any): this;
  on(event: ClientEvents.READY, listener: () => any): this;
  on(event: 'ready', listener: () => any): this;
  on(event: ClientEvents.SHARD, listener: (payload: GatewayClientEvents.ClusterEvent) => any): this;
  on(event: 'shard', listener: (payload: GatewayClientEvents.ClusterEvent) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: ClientEvents.ACTIVITY_JOIN_INVITE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinInvite) => any): this;
  once(event: 'activityJoinInvite', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinInvite) => any): this;
  once(event: ClientEvents.ACTIVITY_JOIN_REQUEST, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinRequest) => any): this;
  once(event: 'activityJoinRequest', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinRequest) => any): this;
  once(event: ClientEvents.ACTIVITY_START, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityStart) => any): this;
  once(event: 'activityStart', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityStart) => any): this;
  once(event: ClientEvents.APPLICATION_COMMAND_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandCreate) => any): this;
  once(event: 'applicationCommandCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandCreate) => any): this;
  once(event: ClientEvents.APPLICATION_COMMAND_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandDelete) => any): this;
  once(event: 'applicationCommandDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandDelete) => any): this;
  once(event: ClientEvents.APPLICATION_COMMAND_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandUpdate) => any): this;
  once(event: 'applicationCommandUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandUpdate) => any): this;
  once(event: ClientEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  once(event: 'braintreePopupBridgeCallback', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  once(event: ClientEvents.CALL_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallCreate) => any): this;
  once(event: 'callCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallCreate) => any): this;
  once(event: ClientEvents.CALL_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallDelete) => any): this;
  once(event: 'callDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallDelete) => any): this;
  once(event: ClientEvents.CALL_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallUpdate) => any): this;
  once(event: 'callUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallUpdate) => any): this;
  once(event: ClientEvents.CHANNEL_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelCreate) => any): this;
  once(event: 'channelCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelCreate) => any): this;
  once(event: ClientEvents.CHANNEL_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelDelete) => any): this;
  once(event: 'channelDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelDelete) => any): this;
  once(event: ClientEvents.CHANNEL_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelUpdate) => any): this;
  once(event: 'channelUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelUpdate) => any): this;
  once(event: ClientEvents.CHANNEL_PINS_ACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsAck) => any): this;
  once(event: 'channelPinsAck', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsAck) => any): this;
  once(event: ClientEvents.CHANNEL_PINS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsUpdate) => any): this;
  once(event: 'channelPinsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsUpdate) => any): this;
  once(event: ClientEvents.CHANNEL_RECIPIENT_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientAdd) => any): this;
  once(event: 'channelRecipientAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientAdd) => any): this;
  once(event: ClientEvents.CHANNEL_RECIPIENT_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientRemove) => any): this;
  once(event: 'channelRecipientRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientRemove) => any): this;
  once(event: ClientEvents.ENTITLEMENT_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementCreate) => any): this;
  once(event: 'entitlementCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementCreate) => any): this;
  once(event: ClientEvents.ENTITLEMENT_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementDelete) => any): this;
  once(event: 'entitlementDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementDelete) => any): this;
  once(event: ClientEvents.ENTITLEMENT_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementUpdate) => any): this;
  once(event: 'entitlementUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementUpdate) => any): this;
  once(event: ClientEvents.FRIEND_SUGGESTION_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionCreate) => any): this;
  once(event: 'friendSuggestionCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionCreate) => any): this;
  once(event: ClientEvents.FRIEND_SUGGESTION_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionDelete) => any): this;
  once(event: 'friendSuggestionDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionDelete) => any): this;
  once(event: ClientEvents.GATEWAY_READY, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayReady) => any): this;
  once(event: 'gatewayReady', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayReady) => any): this;
  once(event: ClientEvents.GATEWAY_RESUMED, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayResumed) => any): this;
  once(event: 'gatewayResumed', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayResumed) => any): this;
  once(event: ClientEvents.GIFT_CODE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GiftCodeUpdate) => any): this;
  once(event: 'giftCodeUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GiftCodeUpdate) => any): this;
  once(event: ClientEvents.GUILD_BAN_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd) => any): this;
  once(event: 'guildBanAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd) => any): this;
  once(event: ClientEvents.GUILD_BAN_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove) => any): this;
  once(event: 'guildBanRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove) => any): this;
  once(event: ClientEvents.GUILD_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildCreate) => any): this;
  once(event: 'guildCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildCreate) => any): this;
  once(event: ClientEvents.GUILD_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildDelete) => any): this;
  once(event: 'guildDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildDelete) => any): this;
  once(event: ClientEvents.GUILD_EMOJIS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildEmojisUpdate) => any): this;
  once(event: 'guildEmojisUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildEmojisUpdate) => any): this;
  once(event: ClientEvents.GUILD_INTEGRATIONS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  once(event: 'guildIntegrationsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  once(event: ClientEvents.GUILD_MEMBER_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd) => any): this;
  once(event: 'guildMemberAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd) => any): this;
  once(event: ClientEvents.GUILD_MEMBER_LIST_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberListUpdate) => any): this;
  once(event: 'guildMemberListUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberListUpdate) => any): this;
  once(event: ClientEvents.GUILD_MEMBER_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove) => any): this;
  once(event: 'guildMemberRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove) => any): this;
  once(event: ClientEvents.GUILD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate) => any): this;
  once(event: 'guildMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate) => any): this;
  once(event: ClientEvents.GUILD_MEMBERS_CHUNK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMembersChunk) => any): this;
  once(event: 'guildMembersChunk', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMembersChunk) => any): this;
  once(event: ClientEvents.GUILD_READY, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildReady) => any): this;
  once(event: 'guildReady', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildReady) => any): this;
  once(event: ClientEvents.GUILD_ROLE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate) => any): this;
  once(event: 'guildRoleCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate) => any): this;
  once(event: ClientEvents.GUILD_ROLE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete) => any): this;
  once(event: 'guildRoleDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete) => any): this;
  once(event: ClientEvents.GUILD_ROLE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate) => any): this;
  once(event: 'guildRoleUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate) => any): this;
  once(event: ClientEvents.GUILD_STICKERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildStickersUpdate) => any): this;
  once(event: 'guildStickersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildStickersUpdate) => any): this;
  once(event: ClientEvents.GUILD_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildUpdate) => any): this;
  once(event: 'guildUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildUpdate) => any): this;
  once(event: ClientEvents.INVITE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteCreate) => any): this;
  once(event: 'inviteCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteCreate) => any): this;
  once(event: ClientEvents.INVITE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteDelete) => any): this;
  once(event: 'inviteDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteDelete) => any): this;
  once(event: ClientEvents.LIBRARY_APPLICATION_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  once(event: 'libraryApplicationUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  once(event: ClientEvents.LOBBY_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyCreate) => any): this;
  once(event: 'lobbyCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyCreate) => any): this;
  once(event: ClientEvents.LOBBY_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyDelete) => any): this;
  once(event: 'lobbyDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyDelete) => any): this;
  once(event: ClientEvents.LOBBY_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyUpdate) => any): this;
  once(event: 'lobbyUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyUpdate) => any): this;
  once(event: ClientEvents.LOBBY_MEMBER_CONNECT, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberConnect) => any): this;
  once(event: 'lobbyMemberConnect', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberConnect) => any): this;
  once(event: ClientEvents.LOBBY_MEMBER_DISCONNECT, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  once(event: 'lobbyMemberDisconnect', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  once(event: ClientEvents.LOBBY_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberUpdate) => any): this;
  once(event: 'lobbyMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberUpdate) => any): this;
  once(event: ClientEvents.LOBBY_MESSAGE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMessage) => any): this;
  once(event: 'lobbyMessage', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMessage) => any): this;
  once(event: ClientEvents.LOBBY_VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  once(event: 'lobbyVoiceServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  once(event: ClientEvents.LOBBY_VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  once(event: 'lobbyVoiceStateUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  once(event: ClientEvents.MESSAGE_ACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageAck) => any): this;
  once(event: 'messageAck', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageAck) => any): this;
  once(event: ClientEvents.MESSAGE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate) => any): this;
  once(event: 'messageCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate) => any): this;
  once(event: ClientEvents.MESSAGE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete) => any): this;
  once(event: 'messageDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete) => any): this;
  once(event: ClientEvents.MESSAGE_DELETE_BULK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk) => any): this;
  once(event: 'messageDeleteBulk', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk) => any): this;
  once(event: ClientEvents.MESSAGE_REACTION_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionAdd) => any): this;
  once(event: 'messageReactionAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionAdd) => any): this;
  once(event: ClientEvents.MESSAGE_REACTION_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemove) => any): this;
  once(event: 'messageReactionRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemove) => any): this;
  once(event: ClientEvents.MESSAGE_REACTION_REMOVE_ALL, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  once(event: 'messageReactionRemoveAll', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  once(event: ClientEvents.MESSAGE_REACTION_REMOVE_EMOJI, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  once(event: 'messageReactionRemoveEmoji', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  once(event: ClientEvents.MESSAGE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate) => any): this;
  once(event: 'messageUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate) => any): this;
  once(event: ClientEvents.PRESENCES_REPLACE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresencesReplace) => any): this;
  once(event: 'presencesReplace', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresencesReplace) => any): this;
  once(event: ClientEvents.PRESENCE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresenceUpdate) => any): this;
  once(event: 'presenceUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresenceUpdate) => any): this;
  once(event: ClientEvents.RECENT_MENTION_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RecentMentionDelete) => any): this;
  once(event: 'recentMentionDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RecentMentionDelete) => any): this;
  once(event: ClientEvents.RELATIONSHIP_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipAdd) => any): this;
  once(event: 'relationshipAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipAdd) => any): this;
  once(event: ClientEvents.RELATIONSHIP_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipRemove) => any): this;
  once(event: 'relationshipRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipRemove) => any): this;
  once(event: ClientEvents.SESSIONS_REPLACE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.SessionsReplace) => any): this;
  once(event: 'sessionsReplace', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.SessionsReplace) => any): this;
  once(event: ClientEvents.STAGE_INSTANCE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceCreate) => any): this;
  once(event: 'stageInstanceCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceCreate) => any): this;
  once(event: ClientEvents.STAGE_INSTANCE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceDelete) => any): this;
  once(event: 'stageInstanceDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceDelete) => any): this;
  once(event: ClientEvents.STAGE_INSTANCE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceUpdate) => any): this;
  once(event: 'stageInstanceUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceUpdate) => any): this;
  once(event: ClientEvents.STREAM_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamCreate) => any): this;
  once(event: 'streamCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamCreate) => any): this;
  once(event: ClientEvents.STREAM_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamDelete) => any): this;
  once(event: 'streamDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamDelete) => any): this;
  once(event: ClientEvents.STREAM_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamServerUpdate) => any): this;
  once(event: 'streamServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamServerUpdate) => any): this;
  once(event: ClientEvents.STREAM_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamUpdate) => any): this;
  once(event: 'streamUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamUpdate) => any): this;
  once(event: ClientEvents.THREAD_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadCreate) => any): this;
  once(event: 'threadCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadCreate) => any): this;
  once(event: ClientEvents.THREAD_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadDelete) => any): this;
  once(event: 'threadDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadDelete) => any): this;
  once(event: ClientEvents.THREAD_LIST_SYNC, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadListSync) => any): this;
  once(event: 'threadListSync', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadListSync) => any): this;
  once(event: ClientEvents.THREAD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMemberUpdate) => any): this;
  once(event: 'threadMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMemberUpdate) => any): this;
  once(event: ClientEvents.THREAD_MEMBERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMembersUpdate) => any): this;
  once(event: 'threadMembersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMembersUpdate) => any): this;
  once(event: ClientEvents.THREAD_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadUpdate) => any): this;
  once(event: 'threadUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadUpdate) => any): this;
  once(event: ClientEvents.TYPING_START, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStart) => any): this;
  once(event: 'typingStart', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStart) => any): this;
  once(event: ClientEvents.TYPING_STOP, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStop) => any): this;
  once(event: 'typingStop', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStop) => any): this;
  once(event: ClientEvents.USER_ACHIEVEMENT_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserAchievementUpdate) => any): this;
  once(event: 'userAchievementUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserAchievementUpdate) => any): this;
  once(event: ClientEvents.USER_CONNECTIONS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserConnectionsUpdate) => any): this;
  once(event: 'userConnectionsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserConnectionsUpdate) => any): this;
  once(event: ClientEvents.USER_FEED_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  once(event: 'userFeedSettingsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  once(event: ClientEvents.USER_GUILD_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  once(event: 'userGuildSettingsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  once(event: ClientEvents.USER_NOTE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserNoteUpdate) => any): this;
  once(event: 'userNoteUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserNoteUpdate) => any): this;
  once(event: ClientEvents.USER_PAYMENT_SOURCES_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  once(event: 'userPaymentSourcesUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  once(event: ClientEvents.USER_PAYMENTS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentsUpdate) => any): this;
  once(event: 'userPaymentsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentsUpdate) => any): this;
  once(event: ClientEvents.USER_REQUIRED_ACTION_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserRequiredActionUpdate) => any): this;
  once(event: 'userRequiredActionUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserRequiredActionUpdate) => any): this;
  once(event: ClientEvents.USER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserUpdate) => any): this;
  once(event: 'userUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserUpdate) => any): this;
  once(event: ClientEvents.USERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate) => any): this;
  once(event: 'usersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate) => any): this;
  once(event: ClientEvents.VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceServerUpdate) => any): this;
  once(event: 'voiceServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceServerUpdate) => any): this;
  once(event: ClientEvents.VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate) => any): this;
  once(event: 'voiceStateUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate) => any): this;
  once(event: ClientEvents.WEBHOOKS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.WebhooksUpdate) => any): this;
  once(event: 'webhooksUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.WebhooksUpdate) => any): this;
  once(event: ClientEvents.RAW, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Raw) => any): this;
  once(event: 'raw', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Raw) => any): this;
  once(event: ClientEvents.REST_REQUEST, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestRequest) => any): this;
  once(event: 'restRequest', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestRequest) => any): this;
  once(event: ClientEvents.REST_RESPONSE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestResponse) => any): this;
  once(event: 'restResponse', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestResponse) => any): this;
  once(event: ClientEvents.UNKNOWN, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Unknown) => any): this;
  once(event: 'unknown', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Unknown) => any): this;
  once(event: ClientEvents.WARN, listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Warn) | GatewayClientEvents.Warn) => any): this;
  once(event: 'warn', listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Warn) | GatewayClientEvents.Warn) => any): this;
  once(event: ClientEvents.KILLED, listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Killed) | GatewayClientEvents.Killed) => any): this;
  once(event: 'killed', listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Killed) | GatewayClientEvents.Killed) => any): this;
  once(event: ClientEvents.READY, listener: () => any): this;
  once(event: 'ready', listener: () => any): this;
  once(event: ClientEvents.SHARD, listener: (payload: GatewayClientEvents.ClusterEvent) => any): this;
  once(event: 'shard', listener: (payload: GatewayClientEvents.ClusterEvent) => any): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    super.once(event, listener);
    return this;
  }

  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription;
  subscribe(event: ClientEvents.ACTIVITY_JOIN_INVITE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinInvite) => any): EventSubscription;
  subscribe(event: 'activityJoinInvite', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinInvite) => any): EventSubscription;
  subscribe(event: ClientEvents.ACTIVITY_JOIN_REQUEST, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinRequest) => any): EventSubscription;
  subscribe(event: 'activityJoinRequest', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinRequest) => any): EventSubscription;
  subscribe(event: ClientEvents.ACTIVITY_START, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityStart) => any): EventSubscription;
  subscribe(event: 'activityStart', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityStart) => any): EventSubscription;
  subscribe(event: ClientEvents.APPLICATION_COMMAND_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandCreate) => any): EventSubscription;
  subscribe(event: 'applicationCommandCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.APPLICATION_COMMAND_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandDelete) => any): EventSubscription;
  subscribe(event: 'applicationCommandDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.APPLICATION_COMMAND_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandUpdate) => any): EventSubscription;
  subscribe(event: 'applicationCommandUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ApplicationCommandUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.BraintreePopupBridgeCallback) => any): EventSubscription;
  subscribe(event: 'braintreePopupBridgeCallback', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.BraintreePopupBridgeCallback) => any): EventSubscription;
  subscribe(event: ClientEvents.CALL_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallCreate) => any): EventSubscription;
  subscribe(event: 'callCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.CALL_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallDelete) => any): EventSubscription;
  subscribe(event: 'callDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.CALL_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallUpdate) => any): EventSubscription;
  subscribe(event: 'callUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelCreate) => any): EventSubscription;
  subscribe(event: 'channelCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelDelete) => any): EventSubscription;
  subscribe(event: 'channelDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelUpdate) => any): EventSubscription;
  subscribe(event: 'channelUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_PINS_ACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsAck) => any): EventSubscription;
  subscribe(event: 'channelPinsAck', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsAck) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_PINS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsUpdate) => any): EventSubscription;
  subscribe(event: 'channelPinsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_RECIPIENT_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientAdd) => any): EventSubscription;
  subscribe(event: 'channelRecipientAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_RECIPIENT_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientRemove) => any): EventSubscription;
  subscribe(event: 'channelRecipientRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.ENTITLEMENT_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementCreate) => any): EventSubscription;
  subscribe(event: 'entitlementCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.ENTITLEMENT_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementDelete) => any): EventSubscription;
  subscribe(event: 'entitlementDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.ENTITLEMENT_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementUpdate) => any): EventSubscription;
  subscribe(event: 'entitlementUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.FRIEND_SUGGESTION_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionCreate) => any): EventSubscription;
  subscribe(event: 'friendSuggestionCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.FRIEND_SUGGESTION_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionDelete) => any): EventSubscription;
  subscribe(event: 'friendSuggestionDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.GATEWAY_READY, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayReady) => any): EventSubscription;
  subscribe(event: 'gatewayReady', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayReady) => any): EventSubscription;
  subscribe(event: ClientEvents.GATEWAY_RESUMED, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayResumed) => any): EventSubscription;
  subscribe(event: 'gatewayResumed', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayResumed) => any): EventSubscription;
  subscribe(event: ClientEvents.GIFT_CODE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GiftCodeUpdate) => any): EventSubscription;
  subscribe(event: 'giftCodeUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GiftCodeUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_BAN_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd) => any): EventSubscription;
  subscribe(event: 'guildBanAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_BAN_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove) => any): EventSubscription;
  subscribe(event: 'guildBanRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildCreate) => any): EventSubscription;
  subscribe(event: 'guildCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildDelete) => any): EventSubscription;
  subscribe(event: 'guildDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_EMOJIS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildEmojisUpdate) => any): EventSubscription;
  subscribe(event: 'guildEmojisUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildEmojisUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_INTEGRATIONS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildIntegrationsUpdate) => any): EventSubscription;
  subscribe(event: 'guildIntegrationsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildIntegrationsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBER_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd) => any): EventSubscription;
  subscribe(event: 'guildMemberAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBER_LIST_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberListUpdate) => any): EventSubscription;
  subscribe(event: 'guildMemberListUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberListUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBER_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove) => any): EventSubscription;
  subscribe(event: 'guildMemberRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate) => any): EventSubscription;
  subscribe(event: 'guildMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBERS_CHUNK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMembersChunk) => any): EventSubscription;
  subscribe(event: 'guildMembersChunk', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMembersChunk) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_READY, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildReady) => any): EventSubscription;
  subscribe(event: 'guildReady', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildReady) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_ROLE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate) => any): EventSubscription;
  subscribe(event: 'guildRoleCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_ROLE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete) => any): EventSubscription;
  subscribe(event: 'guildRoleDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_ROLE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate) => any): EventSubscription;
  subscribe(event: 'guildRoleUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_STICKERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildStickersUpdate) => any): EventSubscription;
  subscribe(event: 'guildStickersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildStickersUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildUpdate) => any): EventSubscription;
  subscribe(event: 'guildUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.INVITE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteCreate) => any): EventSubscription;
  subscribe(event: 'inviteCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.INVITE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteDelete) => any): EventSubscription;
  subscribe(event: 'inviteDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.LIBRARY_APPLICATION_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LibraryApplicationUpdate) => any): EventSubscription;
  subscribe(event: 'libraryApplicationUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LibraryApplicationUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyCreate) => any): EventSubscription;
  subscribe(event: 'lobbyCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyDelete) => any): EventSubscription;
  subscribe(event: 'lobbyDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyUpdate) => any): EventSubscription;
  subscribe(event: 'lobbyUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_MEMBER_CONNECT, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberConnect) => any): EventSubscription;
  subscribe(event: 'lobbyMemberConnect', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberConnect) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_MEMBER_DISCONNECT, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberDisconnect) => any): EventSubscription;
  subscribe(event: 'lobbyMemberDisconnect', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberDisconnect) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberUpdate) => any): EventSubscription;
  subscribe(event: 'lobbyMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_MESSAGE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMessage) => any): EventSubscription;
  subscribe(event: 'lobbyMessage', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMessage) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceServerUpdate) => any): EventSubscription;
  subscribe(event: 'lobbyVoiceServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceServerUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceStateUpdate) => any): EventSubscription;
  subscribe(event: 'lobbyVoiceStateUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceStateUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_ACK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageAck) => any): EventSubscription;
  subscribe(event: 'messageAck', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageAck) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate) => any): EventSubscription;
  subscribe(event: 'messageCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete) => any): EventSubscription;
  subscribe(event: 'messageDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_DELETE_BULK, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk) => any): EventSubscription;
  subscribe(event: 'messageDeleteBulk', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_REACTION_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionAdd) => any): EventSubscription;
  subscribe(event: 'messageReactionAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_REACTION_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemove) => any): EventSubscription;
  subscribe(event: 'messageReactionRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_REACTION_REMOVE_ALL, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveAll) => any): EventSubscription;
  subscribe(event: 'messageReactionRemoveAll', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveAll) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_REACTION_REMOVE_EMOJI, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveEmoji) => any): EventSubscription;
  subscribe(event: 'messageReactionRemoveEmoji', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveEmoji) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate) => any): EventSubscription;
  subscribe(event: 'messageUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.PRESENCES_REPLACE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresencesReplace) => any): EventSubscription;
  subscribe(event: 'presencesReplace', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresencesReplace) => any): EventSubscription;
  subscribe(event: ClientEvents.PRESENCE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresenceUpdate) => any): EventSubscription;
  subscribe(event: 'presenceUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresenceUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.RECENT_MENTION_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RecentMentionDelete) => any): EventSubscription;
  subscribe(event: 'recentMentionDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RecentMentionDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.RELATIONSHIP_ADD, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipAdd) => any): EventSubscription;
  subscribe(event: 'relationshipAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.RELATIONSHIP_REMOVE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipRemove) => any): EventSubscription;
  subscribe(event: 'relationshipRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.SESSIONS_REPLACE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.SessionsReplace) => any): EventSubscription;
  subscribe(event: 'sessionsReplace', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.SessionsReplace) => any): EventSubscription;
  subscribe(event: ClientEvents.STAGE_INSTANCE_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceCreate) => any): EventSubscription;
  subscribe(event: 'stageInstanceCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.STAGE_INSTANCE_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceDelete) => any): EventSubscription;
  subscribe(event: 'stageInstanceDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.STAGE_INSTANCE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceUpdate) => any): EventSubscription;
  subscribe(event: 'stageInstanceUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StageInstanceUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.STREAM_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamCreate) => any): EventSubscription;
  subscribe(event: 'streamCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.STREAM_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamDelete) => any): EventSubscription;
  subscribe(event: 'streamDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.STREAM_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamServerUpdate) => any): EventSubscription;
  subscribe(event: 'streamServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamServerUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.STREAM_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamUpdate) => any): EventSubscription;
  subscribe(event: 'streamUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.THREAD_CREATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadCreate) => any): EventSubscription;
  subscribe(event: 'threadCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.THREAD_DELETE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadDelete) => any): EventSubscription;
  subscribe(event: 'threadDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.THREAD_LIST_SYNC, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadListSync) => any): EventSubscription;
  subscribe(event: 'threadListSync', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadListSync) => any): EventSubscription;
  subscribe(event: ClientEvents.THREAD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMemberUpdate) => any): EventSubscription;
  subscribe(event: 'threadMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMemberUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.THREAD_MEMBERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMembersUpdate) => any): EventSubscription;
  subscribe(event: 'threadMembersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadMembersUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.THREAD_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadUpdate) => any): EventSubscription;
  subscribe(event: 'threadUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ThreadUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.TYPING_START, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStart) => any): EventSubscription;
  subscribe(event: 'typingStart', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStart) => any): EventSubscription;
  subscribe(event: ClientEvents.TYPING_STOP, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStop) => any): EventSubscription;
  subscribe(event: 'typingStop', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStop) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_ACHIEVEMENT_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserAchievementUpdate) => any): EventSubscription;
  subscribe(event: 'userAchievementUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserAchievementUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_CONNECTIONS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserConnectionsUpdate) => any): EventSubscription;
  subscribe(event: 'userConnectionsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserConnectionsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_FEED_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserFeedSettingsUpdate) => any): EventSubscription;
  subscribe(event: 'userFeedSettingsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserFeedSettingsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_GUILD_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserGuildSettingsUpdate) => any): EventSubscription;
  subscribe(event: 'userGuildSettingsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserGuildSettingsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_NOTE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserNoteUpdate) => any): EventSubscription;
  subscribe(event: 'userNoteUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserNoteUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_PAYMENT_SOURCES_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentSourcesUpdate) => any): EventSubscription;
  subscribe(event: 'userPaymentSourcesUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentSourcesUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_PAYMENTS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentsUpdate) => any): EventSubscription;
  subscribe(event: 'userPaymentsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_REQUIRED_ACTION_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserRequiredActionUpdate) => any): EventSubscription;
  subscribe(event: 'userRequiredActionUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserRequiredActionUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserUpdate) => any): EventSubscription;
  subscribe(event: 'userUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USERS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate) => any): EventSubscription;
  subscribe(event: 'usersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceServerUpdate) => any): EventSubscription;
  subscribe(event: 'voiceServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceServerUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate) => any): EventSubscription;
  subscribe(event: 'voiceStateUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.WEBHOOKS_UPDATE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.WebhooksUpdate) => any): EventSubscription;
  subscribe(event: 'webhooksUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.WebhooksUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.RAW, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Raw) => any): EventSubscription;
  subscribe(event: 'raw', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Raw) => any): EventSubscription;
  subscribe(event: ClientEvents.REST_REQUEST, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestRequest) => any): EventSubscription;
  subscribe(event: 'restRequest', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestRequest) => any): EventSubscription;
  subscribe(event: ClientEvents.REST_RESPONSE, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestResponse) => any): EventSubscription;
  subscribe(event: 'restResponse', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestResponse) => any): EventSubscription;
  subscribe(event: ClientEvents.UNKNOWN, listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Unknown) => any): EventSubscription;
  subscribe(event: 'unknown', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Unknown) => any): EventSubscription;
  subscribe(event: ClientEvents.WARN, listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Warn) | GatewayClientEvents.Warn) => any): EventSubscription;
  subscribe(event: 'warn', listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Warn) | GatewayClientEvents.Warn) => any): EventSubscription;
  subscribe(event: ClientEvents.KILLED, listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Killed) | GatewayClientEvents.Killed) => any): EventSubscription;
  subscribe(event: 'killed', listener: (payload: (GatewayClientEvents.ClusterEvent & GatewayClientEvents.Killed) | GatewayClientEvents.Killed) => any): EventSubscription;
  subscribe(event: ClientEvents.READY, listener: () => any): EventSubscription;
  subscribe(event: 'ready', listener: () => any): EventSubscription;
  subscribe(event: ClientEvents.SHARD, listener: (payload: GatewayClientEvents.ClusterEvent) => any): EventSubscription;
  subscribe(event: 'shard', listener: (payload: GatewayClientEvents.ClusterEvent) => any): EventSubscription;
  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription {
    return super.subscribe(event, listener);
  }
}
