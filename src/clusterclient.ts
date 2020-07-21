import {
  Client as DetritusRestClient,
} from 'detritus-client-rest';
import { EventSpewer, Timers } from 'detritus-utils';

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

    if (this.shardOptions.pass.commandClient !== undefined) {
      this.commandClient = this.shardOptions.pass.commandClient;
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
      token: {enumerable: false, writable: false},
    });
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
      const applications = await this.rest.fetchApplicationsDetectable();
      refresh.last = Date.now();
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
      if (this.commandClient) {
        shardOptions.pass = Object.assign({}, shardOptions.pass);
        shardOptions.pass.commandClient = this.commandClient;
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
            bucket.add(() => {
              shard.gateway.identify();
              return new Promise((resolve, reject) => {
                const waiting = this._shardsWaiting.get(shardId);
                if (waiting) {
                  waiting.reject(new Error('Received new Identify Request with same shard id, unknown why'));
                }
                this._shardsWaiting.set(shardId, {resolve, reject});
              });
            });
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
    Object.defineProperty(this, 'ran', {value: true});
    this.emit(ClientEvents.READY);
    return this;
  }

  getRatelimitKey(shardId: number): number {
    return shardId % this.maxConcurrency;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: 'activityJoinInvite', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinInvite) => any): this;
  on(event: 'activityJoinRequest', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityJoinRequest) => any): this;
  on(event: 'activityStart', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ActivityStart) => any): this;
  on(event: 'braintreePopupBridgeCallback', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  on(event: 'callCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallCreate) => any): this;
  on(event: 'callDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallDelete) => any): this;
  on(event: 'callUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.CallUpdate) => any): this;
  on(event: 'channelCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelCreate) => any): this;
  on(event: 'channelDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelDelete) => any): this;
  on(event: 'channelPinsAck', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsAck) => any): this;
  on(event: 'channelPinsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelPinsUpdate) => any): this;
  on(event: 'channelUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelUpdate) => any): this;
  on(event: 'channelRecipientAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientAdd) => any): this;
  on(event: 'channelRecipientRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelRecipientRemove) => any): this;
  on(event: 'entitlementCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementCreate) => any): this;
  on(event: 'entitlementDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementDelete) => any): this;
  on(event: 'entitlementUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.EntitlementUpdate) => any): this;
  on(event: 'friendSuggestionCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionCreate) => any): this;
  on(event: 'friendSuggestionDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.FriendSuggestionDelete) => any): this;
  on(event: 'gatewayReady', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayReady) => any): this;
  on(event: 'gatewayResumed', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GatewayResumed) => any): this;
  on(event: 'giftCodeUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GiftCodeUpdate) => any): this;
  on(event: 'guildBanAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd) => any): this;
  on(event: 'guildBanRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove) => any): this;
  on(event: 'guildCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildCreate) => any): this;
  on(event: 'guildDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildDelete) => any): this;
  on(event: 'guildEmojisUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildEmojisUpdate) => any): this;
  on(event: 'guildIntegrationsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  on(event: 'guildMemberAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd) => any): this;
  on(event: 'guildMemberListUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberListUpdate) => any): this;
  on(event: 'guildMemberRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove) => any): this;
  on(event: 'guildMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate) => any): this;
  on(event: 'guildMembersChunk', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMembersChunk) => any): this;
  on(event: 'guildReady', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildReady) => any): this;
  on(event: 'guildRoleCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate) => any): this;
  on(event: 'guildRoleDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete) => any): this;
  on(event: 'guildRoleUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate) => any): this;
  on(event: 'guildUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildUpdate) => any): this;
  on(event: 'inviteCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteCreate) => any): this;
  on(event: 'inviteDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.InviteDelete) => any): this;
  on(event: 'libraryApplicationUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  on(event: 'lobbyCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyCreate) => any): this;
  on(event: 'lobbyDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyDelete) => any): this;
  on(event: 'lobbyUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyUpdate) => any): this;
  on(event: 'lobbyMemberDisconnect', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  on(event: 'lobbyMemberUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMemberUpdate) => any): this;
  on(event: 'lobbyMessage', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyMessage) => any): this;
  on(event: 'lobbyVoiceServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  on(event: 'lobbyVoiceStateUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  on(event: 'messageAck', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageAck) => any): this;
  on(event: 'messageCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate) => any): this;
  on(event: 'messageDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete) => any): this;
  on(event: 'messageDeleteBulk', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk) => any): this;
  on(event: 'messageReactionAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionAdd) => any): this;
  on(event: 'messageReactionRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemove) => any): this;
  on(event: 'messageReactionRemoveAll', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  on(event: 'messageReactionRemoveEmoji', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  on(event: 'messageUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate) => any): this;
  on(event: 'oauth2TokenRevoke', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Oauth2TokenRevoke) => any): this;
  on(event: 'presenceUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresenceUpdate) => any): this;
  on(event: 'presencesReplace', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.PresencesReplace) => any): this;
  on(event: 'recentMentionDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RecentMentionDelete) => any): this;
  on(event: 'relationshipAdd', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipAdd) => any): this;
  on(event: 'relationshipRemove', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RelationshipRemove) => any): this;
  on(event: 'sessionsReplace', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.SessionsReplace) => any): this;
  on(event: 'streamCreate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamCreate) => any): this;
  on(event: 'streamDelete', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamDelete) => any): this;
  on(event: 'streamServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamServerUpdate) => any): this;
  on(event: 'streamUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.StreamUpdate) => any): this;
  on(event: 'typingStart', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStart) => any): this;
  on(event: 'typingStop', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.TypingStop) => any): this;
  on(event: 'userAchievementUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserAchievementUpdate) => any): this;
  on(event: 'userConnectionsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserConnectionsUpdate) => any): this;
  on(event: 'userFeedSettingsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  on(event: 'userGuildSettingsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  on(event: 'userNoteUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserNoteUpdate) => any): this;
  on(event: 'userPaymentSourcesUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  on(event: 'userPaymentsUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserPaymentsUpdate) => any): this;
  on(event: 'userUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UserUpdate) => any): this;
  on(event: 'usersUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate) => any): this;
  on(event: 'voiceServerUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceServerUpdate) => any): this;
  on(event: 'voiceStateUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate) => any): this;
  on(event: 'webhooksUpdate', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.WebhooksUpdate) => any): this;
  on(event: 'raw', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Raw) => any): this;
  on(event: 'restRequest', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestRequest) => any): this;
  on(event: 'restResponse', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.RestResponse) => any): this;
  on(event: 'unknown', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Unknown) => any): this;
  on(event: 'warn', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Warn | GatewayClientEvents.Warn) => any): this;
  on(event: 'killed', listener: (payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.Killed | GatewayClientEvents.Killed) => any): this;
  on(event: 'ready', listener: () => any): this;
  on(event: 'shard', listener: (payload: GatewayClientEvents.ClusterEvent) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
