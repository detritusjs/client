import * as Crypto from 'crypto';

import { ClientOptions as RestOptions, Endpoints } from 'detritus-client-rest';
import { Gateway } from 'detritus-client-socket';
import { EventSpewer, EventSubscription, Timers } from 'detritus-utils';


import { ClusterClient } from './clusterclient';
import { CommandClient } from './commandclient';
import {
  AuthTypes,
  ClientEvents,
  ImageFormats,
  IMAGE_FORMATS,
} from './constants';
import { ChunkWaiting, GatewayHandler, GatewayHandlerOptions } from './gateway/handler';
import { GatewayClientEvents } from './gateway/clientevents';
import { RestClient } from './rest';

import { BaseCollection } from './collections/basecollection';
import { BaseSet } from './collections/baseset';
import {
  Applications,
  ApplicationsOptions,
  Channels,
  ChannelsOptions,
  ConnectedAccounts,
  ConnectedAccountsOptions,
  Emojis,
  EmojisOptions,
  Guilds,
  GuildsOptions,
  Members,
  MembersOptions,
  Messages,
  MessagesOptions,
  Notes,
  NotesOptions,
  Presences,
  PresencesOptions,
  Relationships,
  RelationshipsOptions,
  Roles,
  RolesOptions,
  Sessions,
  SessionsOptions,
  StageInstances,
  StageInstancesOptions,
  TypingCollection,
  TypingOptions,
  Users,
  UsersOptions,
  VoiceCalls,
  VoiceCallsOptions,
  VoiceConnections,
  VoiceConnectionsOptions,
  VoiceStates,
  VoiceStatesOptions,
} from './collections';

import {
  VoiceConnection,
  VoiceConnectionOptions,
} from './media/voiceconnection';

import {
  Member,
  Oauth2Application,
  Presence,
  User,
  UserMe,
} from './structures';


interface GatewayOptions extends Gateway.SocketOptions, GatewayHandlerOptions {

}

export interface ShardClientCacheOptions {
  applications?: ApplicationsOptions | boolean,
  channels?: ChannelsOptions | boolean,
  connectedAccounts?: ConnectedAccountsOptions | boolean,
  emojis?: EmojisOptions | boolean,
  guilds?: GuildsOptions | boolean,
  members?: MembersOptions | boolean,
  messages?: MessagesOptions | boolean,
  notes?: NotesOptions | boolean,
  presences?: PresencesOptions | boolean,
  relationships?: RelationshipsOptions | boolean,
  roles?: RolesOptions | boolean,
  sessions?: SessionsOptions | boolean,
  stageInstances?: StageInstancesOptions | boolean,
  typings?: TypingOptions | boolean,
  users?: UsersOptions | boolean,
  voiceCalls?: VoiceCallsOptions | boolean,
  voiceConnections?: VoiceConnectionsOptions | boolean,
  voiceStates?: VoiceStatesOptions | boolean,
}

export interface ShardClientPassOptions {
  cluster?: ClusterClient,
  commandClient?: CommandClient,
  applications?: Applications,
  channels?: Channels,
  connectedAccounts?: ConnectedAccounts,
  emojis?: Emojis,
  guilds?: Guilds,
  members?: Members,
  messages?: Messages,
  notes?: Notes,
  presences?: Presences,
  relationships?: Relationships,
  roles?: Roles,
  sessions?: Sessions,
  stageInstances?: StageInstances,
  typings?: TypingCollection,
  users?: Users,
  voiceCalls?: VoiceCalls,
  voiceConnections?: VoiceConnections,
  voiceStates?: VoiceStates,
}

export interface ShardClientOptions {
  cache?: ShardClientCacheOptions | boolean,
  gateway?: GatewayOptions,
  imageFormat?: ImageFormats | string,
  isBot?: boolean,
  rest?: RestOptions,
  pass?: ShardClientPassOptions,
}

export interface ShardClientRunOptions {
  url?: string,
  wait?: boolean,
}

export interface VoiceConnectOptions extends VoiceConnectionOptions {
  deaf?: boolean,
  forceMode?: string,
  mute?: boolean,
  receive?: boolean,
  selfDeaf?: boolean,
  selfMute?: boolean,
  selfVideo?: boolean,
  timeout?: number,
  video?: boolean,
  wait?: boolean,
}

/**
 * Shard Client, represents one gateway connection
 * @category Clients
 */
export class ShardClient extends EventSpewer {
  /**
   * @ignore
   */
  _isBot: boolean = true;
  _killed: boolean = false;

  application: Oauth2Application | null = null;
  cluster: ClusterClient | null = null;
  commandClient: CommandClient | null = null;

  /** Default Image Format to use for any url getters*/
  imageFormat: ImageFormats = ImageFormats.PNG;

  /** `detritus-client-socket`'s Gateway Socket */
  gateway: Gateway.Socket;

  /** Our Dispatch Handler */
  gatewayHandler: GatewayHandler;

  /**
   * If this is a bot, this will be filled with it's application owner or all of the application's team owners
   * If this is a user, this will only include the user object
   * Only fills once we receive the Ready payload
   */
  owners = new BaseCollection<string, User>();

  /** If the client is ran or not */
  ran: boolean = false;

  /** (Users only) if the client requires an action (like the captcha overlay) */
  requiredAction?: null | string;

  /** `detritus-client-rest`'s Rest Client, but wrapped over */
  rest: RestClient;

  /** our token */
  token: string;

  /** Us, only fills once we received the Ready payload from the gateway */
  user: null | UserMe = null;

  readonly applications: Applications;
  readonly channels: Channels;
  readonly connectedAccounts: ConnectedAccounts;
  readonly emojis: Emojis;
  readonly guilds: Guilds;
  readonly members: Members;
  readonly messages: Messages;
  readonly notes: Notes;
  readonly presences: Presences;
  readonly relationships: Relationships;
  readonly roles: Roles;
  readonly sessions: Sessions;
  readonly stageInstances: StageInstances;
  readonly typings: TypingCollection;
  readonly users: Users;
  readonly voiceCalls: VoiceCalls;
  readonly voiceConnections: VoiceConnections;
  readonly voiceStates: VoiceStates;

  constructor(
    token: string,
    options: ShardClientOptions = {},
  ) {
    super();
    if (!token) {
      throw new Error('Token is required for this library to work.');
    }
    this.token = token;

    options = Object.assign({}, options);
    if (options.cache === undefined) {
      options.cache = {};
    }
    if (options.pass === undefined) {
      options.pass = {};
    }
    this.cluster = options.pass.cluster || this.cluster;
    this.commandClient = options.pass.commandClient || this.commandClient;
    this.gateway = new Gateway.Socket(token, options.gateway);
    this.gatewayHandler = new GatewayHandler(this, options.gateway);
    this.rest = new RestClient(token, Object.assign({
      authType: (options.isBot) ? AuthTypes.BOT : AuthTypes.USER,
    }, options.rest), this);

    if (options.isBot !== undefined) {
      this._isBot = !!options.isBot;
    }
    if (options.imageFormat) {
      const imageFormat = <ImageFormats> <unknown> options.imageFormat.toLowerCase();
      if (!IMAGE_FORMATS.includes(imageFormat)) {
        throw new Error(`Image format must be one of ${JSON.stringify(IMAGE_FORMATS)}`);
      }
      this.imageFormat = imageFormat;
    }

    Object.defineProperties(this, {
      _isBot: {configurable: true, enumerable: false, writable: false},
      _killed: {configurable: true, enumerable: false, writable: false},
      cluster: {enumerable: false, writable: false},
      commandClient: {configurable: true, enumerable: false, writable: false},
      gateway: {enumerable: false, writable: false},
      ran: {configurable: true, writable: false},
      rest: {enumerable: false, writable: false},
      token: {enumerable: false, writable: false},
    });

    if (typeof(options.cache) === 'boolean') {
      const enabled = options.cache;
      options.cache = {
        applications: {enabled},
        channels: {enabled},
        connectedAccounts: {enabled},
        emojis: {enabled},
        guilds: {enabled},
        members: {enabled},
        messages: {enabled},
        notes: {enabled},
        presences: {enabled},
        relationships: {enabled},
        roles: {enabled},
        sessions: {enabled},
        stageInstances: {enabled},
        typings: {enabled},
        users: {enabled},
        voiceCalls: {enabled},
        voiceConnections: {enabled},
        voiceStates: {enabled},
      };
    }

    this.applications = options.pass.applications || new Applications(this, options.cache.applications);
    this.channels = options.pass.channels || new Channels(this, options.cache.channels);
    this.connectedAccounts = options.pass.connectedAccounts || new ConnectedAccounts(this, options.cache.connectedAccounts);
    this.emojis = options.pass.emojis || new Emojis(this, options.cache.emojis);
    this.guilds = options.pass.guilds || new Guilds(this, options.cache.guilds);
    this.members = options.pass.members || new Members(this, options.cache.members);
    this.messages = options.pass.messages || new Messages(this, options.cache.messages);
    this.notes = options.pass.notes || new Notes(this, options.cache.notes);
    this.presences = options.pass.presences || new Presences(this, options.cache.presences);
    this.relationships = options.pass.relationships || new Relationships(this, options.cache.relationships);
    this.roles = options.pass.roles || new Roles(this, options.cache.roles);
    this.sessions = options.pass.sessions || new Sessions(this, options.cache.sessions);
    this.stageInstances = options.pass.stageInstances || new StageInstances(this, options.cache.stageInstances);
    this.typings = options.pass.typings || new TypingCollection(this, options.cache.typings);
    this.users = options.pass.users || new Users(this, options.cache.users);
    this.voiceCalls = options.pass.voiceCalls || new VoiceCalls(this, options.cache.voiceCalls);
    this.voiceConnections = options.pass.voiceConnections || new VoiceConnections(this, options.cache.voiceConnections);
    this.voiceStates = options.pass.voiceStates || new VoiceStates(this, options.cache.voiceStates);
  }

  get clientId(): string {
    if (this.application) {
      return this.application.id;
    }
    return this.userId;
  }

  get isBot(): boolean {
    if (this.user) {
      return this.user.bot;
    }
    return this._isBot;
  }

  get killed(): boolean {
    return this._killed && this.gateway.killed;
  }

  get shardCount(): number {
    return this.gateway.shardCount;
  }

  get shardId(): number {
    return this.gateway.shardId;
  }

  get userId(): string {
    return this.gateway.userId || '';
  }

  _mergeOauth2Application(data: any) {
    let oauth2Application: Oauth2Application;
    if (this.application) {
      oauth2Application = this.application;
      oauth2Application.merge(data);
    } else {
      oauth2Application = new Oauth2Application(this, data);
      this.application = oauth2Application;
    }
    if (oauth2Application.owner) {
      this.owners.clear();
      this.owners.set(oauth2Application.owner.id, oauth2Application.owner);
      if (oauth2Application.team) {
        for (let [userId, member] of oauth2Application.team.members) {
          this.owners.set(userId, member.user);
        }
      }
    }
    return oauth2Application;
  }

  isOwner(userId: string): boolean {
    return this.owners.has(userId);
  }

  kill(error?: Error): void {
    if (!this.killed) {
      Object.defineProperty(this, '_killed', {value: true});
      this.gateway.kill(error);
      this.reset();
      if (this.cluster) {
        // must be a better way to handle this
        // maybe kill the entire cluster?
        this.cluster.shards.delete(this.shardId);
      }
      this.emit(ClientEvents.KILLED, {error});
      this.rest.raw.removeAllListeners();
      this.removeAllListeners();
    }
  }

  async ping(): Promise<{gateway: number, rest: number}> {
    const [gateway, response] = await Promise.all([
      this.gateway.ping(),
      this.rest.request({
        dataOnly: false,
        route: {
          path: Endpoints.Api.ME,
        },
      }),
    ]);
    return {gateway, rest: response.took};
  }

  async requestGuildMembers(
    guildId: string,
    oldOptions: {
      limit?: number,
      presences?: boolean,
      query: string,
      timeout?: number,
      userIds?: Array<string>,
    },
  ): Promise<{
    members: BaseCollection<string, Member>,
    nonce: string,
    notFound: BaseSet<string>,
    presences: BaseCollection<string, Presence>,
  }> {
    const options = Object.assign({
      limit: 0,
      timeout: 1500,
    }, oldOptions) as {
      limit: number,
      nonce: string,
      presences?: boolean,
      query: string,
      timeout: number,
      userIds?: Array<string>,
    };
    let key = `${guildId}:${options.limit}:${options.query}:${options.presences}`;
    if (options.userIds && options.userIds.length) {
      if (options.userIds.length <= 10) {
        key += `:${options.userIds.join('.')}`;
      } else {
        key += `:amount.${options.userIds.length}`;
      }
    }
    const nonce = options.nonce = Crypto.createHash('md5').update(key).digest('hex');
    let cache: ChunkWaiting;
    if (this.gatewayHandler._chunksWaiting.has(nonce)) {
      cache = this.gatewayHandler._chunksWaiting.get(nonce) as ChunkWaiting;
    } else {
      const promise: any = {};
      promise.wait = new Promise((res, rej) => {
        promise.resolve = res;
        promise.reject = rej;
      });
      cache = {
        members: new BaseCollection<string, Member>(),
        notFound: new BaseSet<string>(),
        presences: new BaseCollection<string, Presence>(),
        promise,
        waiting: 0,
      };
      this.gatewayHandler._chunksWaiting.set(nonce, cache);
      this.gateway.requestGuildMembers(guildId, options);
    }
    cache.waiting++;

    const timeout = new Timers.Timeout();
    return new Promise((resolve, reject) => {
      cache.promise.wait.then(resolve).catch(reject);
      timeout.start(options.timeout, () => {
        reject(new Error(`Guild chunking took longer than ${options.timeout}ms.`));
        cache.waiting--;
        if (cache.waiting <= 0) {
          this.gatewayHandler._chunksWaiting.delete(nonce);
        }
      });
    }).then(() => {
      timeout.stop();
      this.gatewayHandler._chunksWaiting.delete(nonce);
      return {
        members: cache.members,
        nonce,
        notFound: cache.notFound,
        presences: cache.presences,
      };
    });
  }

  reset(): void {
    this.applications.clear();
    this.channels.clear();
    this.connectedAccounts.clear();
    this.guilds.clear();
    this.members.clear();
    this.messages.clear();
    this.notes.clear();
    this.presences.clear();
    this.relationships.clear();
    this.sessions.clear();
    this.users.clear();
    this.voiceCalls.clear();
    this.voiceConnections.clear();
    this.voiceStates.clear();
  }

  async run(
    options: ShardClientRunOptions = {},
  ): Promise<ShardClient> {
    const wait = options.wait || options.wait === undefined;

    let url: string;
    if (options.url) {
      url = <string> options.url;
    } else {
      const data = await this.rest.fetchGateway();
      url = data.url;
    }

    this.gateway.connect(url);
    if (wait) {
      await new Promise((resolve, reject) => {
        this.once(ClientEvents.GATEWAY_READY, resolve);
        this.once(ClientEvents.KILLED, ({error}) => reject(error));
      });
    }
    Object.defineProperty(this, 'ran', {value: true});
    return this;
  }

  /**
   * 
   * @param guildId Guild Id you want to connect to, if a user and wanting to connect to a Dm Channel, keep this blank
   * @param channelId Channel Id you want to connect to or move to
   * @param options Options to pass into the `detritus-client-socket`'s gateway's voiceConnect
   * @returns Returns a promise that resolves into a Voice Connection object and an isNew variable.
   *          isNew is used to see if the connection was reused (e.g. changing channels) so you can put listeners on or not
   */
  async voiceConnect(
    guildId?: null | string,
    channelId?: null | string,
    options: VoiceConnectOptions = {},
  ): Promise<{
    connection: VoiceConnection,
    isNew: boolean,
  } | null> {
    options.selfDeaf = options.selfDeaf || options.deaf;
    options.selfMute = options.selfMute || options.mute;
    const gateway = await this.gateway.voiceConnect(guildId, channelId, options);
    const serverId = (guildId || channelId) as string;
    if (gateway) {
      if (this.voiceConnections.has(serverId)) {
        return {
          connection: this.voiceConnections.get(serverId) as VoiceConnection,
          isNew: false,
        };
      }

      try {
        const payload = {
          connection: new VoiceConnection(this, gateway, options),
          isNew: true,
        };
        this.voiceConnections.insert(payload.connection);

        if (options.wait || options.wait === undefined) {
          return new Promise((resolve) => {
            payload.connection.once('ready', () => {
              resolve(payload);
            });
          });
        } else {
          return payload;
        }
      } catch(error) {
        gateway.kill(error);
        throw error;
      }
    } else {
      if (this.voiceConnections.has(serverId)) {
        (this.voiceConnections.get(serverId) as VoiceConnection).kill();
      }
    }
    return null;
  }

  toString(): string {
    return `Detritus Client (Shard ${this.shardId})`;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: ClientEvents.ACTIVITY_JOIN_INVITE, listener: (payload: GatewayClientEvents.ActivityJoinInvite) => any): this;
  on(event: 'activityJoinInvite', listener: (payload: GatewayClientEvents.ActivityJoinInvite) => any): this;
  on(event: ClientEvents.ACTIVITY_JOIN_REQUEST, listener: (payload: GatewayClientEvents.ActivityJoinRequest) => any): this;
  on(event: 'activityJoinRequest', listener: (payload: GatewayClientEvents.ActivityJoinRequest) => any): this;
  on(event: ClientEvents.ACTIVITY_START, listener: (payload: GatewayClientEvents.ActivityStart) => any): this;
  on(event: 'activityStart', listener: (payload: GatewayClientEvents.ActivityStart) => any): this;
  on(event: ClientEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK, listener: (payload: GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  on(event: 'braintreePopupBridgeCallback', listener: (payload: GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  on(event: ClientEvents.CALL_CREATE, listener: (payload: GatewayClientEvents.CallCreate) => any): this;
  on(event: 'callCreate', listener: (payload: GatewayClientEvents.CallCreate) => any): this;
  on(event: ClientEvents.CALL_DELETE, listener: (payload: GatewayClientEvents.CallDelete) => any): this;
  on(event: 'callDelete', listener: (payload: GatewayClientEvents.CallDelete) => any): this;
  on(event: ClientEvents.CALL_UPDATE, listener: (payload: GatewayClientEvents.CallUpdate) => any): this;
  on(event: 'callUpdate', listener: (payload: GatewayClientEvents.CallUpdate) => any): this;
  on(event: ClientEvents.CHANNEL_CREATE, listener: (payload: GatewayClientEvents.ChannelCreate) => any): this;
  on(event: 'channelCreate', listener: (payload: GatewayClientEvents.ChannelCreate) => any): this;
  on(event: ClientEvents.CHANNEL_DELETE, listener: (payload: GatewayClientEvents.ChannelDelete) => any): this;
  on(event: 'channelDelete', listener: (payload: GatewayClientEvents.ChannelDelete) => any): this;
  on(event: ClientEvents.CHANNEL_UPDATE, listener: (payload: GatewayClientEvents.ChannelUpdate) => any): this;
  on(event: 'channelUpdate', listener: (payload: GatewayClientEvents.ChannelUpdate) => any): this;
  on(event: ClientEvents.CHANNEL_PINS_ACK, listener: (payload: GatewayClientEvents.ChannelPinsAck) => any): this;
  on(event: 'channelPinsAck', listener: (payload: GatewayClientEvents.ChannelPinsAck) => any): this;
  on(event: ClientEvents.CHANNEL_PINS_UPDATE, listener: (payload: GatewayClientEvents.ChannelPinsUpdate) => any): this;
  on(event: 'channelPinsUpdate', listener: (payload: GatewayClientEvents.ChannelPinsUpdate) => any): this;
  on(event: ClientEvents.CHANNEL_RECIPIENT_ADD, listener: (payload: GatewayClientEvents.ChannelRecipientAdd) => any): this;
  on(event: 'channelRecipientAdd', listener: (payload: GatewayClientEvents.ChannelRecipientAdd) => any): this;
  on(event: ClientEvents.CHANNEL_RECIPIENT_REMOVE, listener: (payload: GatewayClientEvents.ChannelRecipientRemove) => any): this;
  on(event: 'channelRecipientRemove', listener: (payload: GatewayClientEvents.ChannelRecipientRemove) => any): this;
  on(event: ClientEvents.ENTITLEMENT_CREATE, listener: (payload: GatewayClientEvents.EntitlementCreate) => any): this;
  on(event: 'entitlementCreate', listener: (payload: GatewayClientEvents.EntitlementCreate) => any): this;
  on(event: ClientEvents.ENTITLEMENT_DELETE, listener: (payload: GatewayClientEvents.EntitlementDelete) => any): this;
  on(event: 'entitlementDelete', listener: (payload: GatewayClientEvents.EntitlementDelete) => any): this;
  on(event: ClientEvents.ENTITLEMENT_UPDATE, listener: (payload: GatewayClientEvents.EntitlementUpdate) => any): this;
  on(event: 'entitlementUpdate', listener: (payload: GatewayClientEvents.EntitlementUpdate) => any): this;
  on(event: ClientEvents.FRIEND_SUGGESTION_CREATE, listener: (payload: GatewayClientEvents.FriendSuggestionCreate) => any): this;
  on(event: 'friendSuggestionCreate', listener: (payload: GatewayClientEvents.FriendSuggestionCreate) => any): this;
  on(event: ClientEvents.FRIEND_SUGGESTION_DELETE, listener: (payload: GatewayClientEvents.FriendSuggestionDelete) => any): this;
  on(event: 'friendSuggestionDelete', listener: (payload: GatewayClientEvents.FriendSuggestionDelete) => any): this;
  on(event: ClientEvents.GATEWAY_READY, listener: (payload: GatewayClientEvents.GatewayReady) => any): this;
  on(event: 'gatewayReady', listener: (payload: GatewayClientEvents.GatewayReady) => any): this;
  on(event: ClientEvents.GATEWAY_RESUMED, listener: (payload: GatewayClientEvents.GatewayResumed) => any): this;
  on(event: 'gatewayResumed', listener: (payload: GatewayClientEvents.GatewayResumed) => any): this;
  on(event: ClientEvents.GIFT_CODE_UPDATE, listener: (payload: GatewayClientEvents.GiftCodeUpdate) => any): this;
  on(event: 'giftCodeUpdate', listener: (payload: GatewayClientEvents.GiftCodeUpdate) => any): this;
  on(event: ClientEvents.GUILD_BAN_ADD, listener: (payload: GatewayClientEvents.GuildBanAdd) => any): this;
  on(event: 'guildBanAdd', listener: (payload: GatewayClientEvents.GuildBanAdd) => any): this;
  on(event: ClientEvents.GUILD_BAN_REMOVE, listener: (payload: GatewayClientEvents.GuildBanRemove) => any): this;
  on(event: 'guildBanRemove', listener: (payload: GatewayClientEvents.GuildBanRemove) => any): this;
  on(event: ClientEvents.GUILD_CREATE, listener: (payload: GatewayClientEvents.GuildCreate) => any): this;
  on(event: 'guildCreate', listener: (payload: GatewayClientEvents.GuildCreate) => any): this;
  on(event: ClientEvents.GUILD_DELETE, listener: (payload: GatewayClientEvents.GuildDelete) => any): this;
  on(event: 'guildDelete', listener: (payload: GatewayClientEvents.GuildDelete) => any): this;
  on(event: ClientEvents.GUILD_EMOJIS_UPDATE, listener: (payload: GatewayClientEvents.GuildEmojisUpdate) => any): this;
  on(event: 'guildEmojisUpdate', listener: (payload: GatewayClientEvents.GuildEmojisUpdate) => any): this;
  on(event: ClientEvents.GUILD_INTEGRATIONS_UPDATE, listener: (payload: GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  on(event: 'guildIntegrationsUpdate', listener: (payload: GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  on(event: ClientEvents.GUILD_MEMBER_ADD, listener: (payload: GatewayClientEvents.GuildMemberAdd) => any): this;
  on(event: 'guildMemberAdd', listener: (payload: GatewayClientEvents.GuildMemberAdd) => any): this;
  on(event: ClientEvents.GUILD_MEMBER_LIST_UPDATE, listener: (payload: GatewayClientEvents.GuildMemberListUpdate) => any): this;
  on(event: 'guildMemberListUpdate', listener: (payload: GatewayClientEvents.GuildMemberListUpdate) => any): this;
  on(event: ClientEvents.GUILD_MEMBER_REMOVE, listener: (payload: GatewayClientEvents.GuildMemberRemove) => any): this;
  on(event: 'guildMemberRemove', listener: (payload: GatewayClientEvents.GuildMemberRemove) => any): this;
  on(event: ClientEvents.GUILD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.GuildMemberUpdate) => any): this;
  on(event: 'guildMemberUpdate', listener: (payload: GatewayClientEvents.GuildMemberUpdate) => any): this;
  on(event: ClientEvents.GUILD_MEMBERS_CHUNK, listener: (payload: GatewayClientEvents.GuildMembersChunk) => any): this;
  on(event: 'guildMembersChunk', listener: (payload: GatewayClientEvents.GuildMembersChunk) => any): this;
  on(event: ClientEvents.GUILD_READY, listener: (payload: GatewayClientEvents.GuildReady) => any): this;
  on(event: 'guildReady', listener: (payload: GatewayClientEvents.GuildReady) => any): this;
  on(event: ClientEvents.GUILD_ROLE_CREATE, listener: (payload: GatewayClientEvents.GuildRoleCreate) => any): this;
  on(event: 'guildRoleCreate', listener: (payload: GatewayClientEvents.GuildRoleCreate) => any): this;
  on(event: ClientEvents.GUILD_ROLE_DELETE, listener: (payload: GatewayClientEvents.GuildRoleDelete) => any): this;
  on(event: 'guildRoleDelete', listener: (payload: GatewayClientEvents.GuildRoleDelete) => any): this;
  on(event: ClientEvents.GUILD_ROLE_UPDATE, listener: (payload: GatewayClientEvents.GuildRoleUpdate) => any): this;
  on(event: 'guildRoleUpdate', listener: (payload: GatewayClientEvents.GuildRoleUpdate) => any): this;
  on(event: ClientEvents.GUILD_UPDATE, listener: (payload: GatewayClientEvents.GuildUpdate) => any): this;
  on(event: 'guildUpdate', listener: (payload: GatewayClientEvents.GuildUpdate) => any): this;
  on(event: ClientEvents.INTERACTION_CREATE, listener: (payload: GatewayClientEvents.InteractionCreate) => any): this;
  on(event: 'interactionCreate', listener: (payload: GatewayClientEvents.InteractionCreate) => any): this;
  on(event: ClientEvents.INVITE_CREATE, listener: (payload: GatewayClientEvents.InviteCreate) => any): this;
  on(event: 'inviteCreate', listener: (payload: GatewayClientEvents.InviteCreate) => any): this;
  on(event: ClientEvents.INVITE_DELETE, listener: (payload: GatewayClientEvents.InviteDelete) => any): this;
  on(event: 'inviteDelete', listener: (payload: GatewayClientEvents.InviteDelete) => any): this;
  on(event: ClientEvents.LIBRARY_APPLICATION_UPDATE, listener: (payload: GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  on(event: 'libraryApplicationUpdate', listener: (payload: GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  on(event: ClientEvents.LOBBY_CREATE, listener: (payload: GatewayClientEvents.LobbyCreate) => any): this;
  on(event: 'lobbyCreate', listener: (payload: GatewayClientEvents.LobbyCreate) => any): this;
  on(event: ClientEvents.LOBBY_DELETE, listener: (payload: GatewayClientEvents.LobbyDelete) => any): this;
  on(event: 'lobbyDelete', listener: (payload: GatewayClientEvents.LobbyDelete) => any): this;
  on(event: ClientEvents.LOBBY_UPDATE, listener: (payload: GatewayClientEvents.LobbyUpdate) => any): this;
  on(event: 'lobbyUpdate', listener: (payload: GatewayClientEvents.LobbyUpdate) => any): this;
  on(event: ClientEvents.LOBBY_MEMBER_CONNECT, listener: (payload: GatewayClientEvents.LobbyMemberConnect) => any): this;
  on(event: 'lobbyMemberConnect', listener: (payload: GatewayClientEvents.LobbyMemberConnect) => any): this;
  on(event: ClientEvents.LOBBY_MEMBER_DISCONNECT, listener: (payload: GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  on(event: 'lobbyMemberDisconnect', listener: (payload: GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  on(event: ClientEvents.LOBBY_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.LobbyMemberUpdate) => any): this;
  on(event: 'lobbyMemberUpdate', listener: (payload: GatewayClientEvents.LobbyMemberUpdate) => any): this;
  on(event: ClientEvents.LOBBY_MESSAGE, listener: (payload: GatewayClientEvents.LobbyMessage) => any): this;
  on(event: 'lobbyMessage', listener: (payload: GatewayClientEvents.LobbyMessage) => any): this;
  on(event: ClientEvents.LOBBY_VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  on(event: 'lobbyVoiceServerUpdate', listener: (payload: GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  on(event: ClientEvents.LOBBY_VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  on(event: 'lobbyVoiceStateUpdate', listener: (payload: GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  on(event: ClientEvents.MESSAGE_ACK, listener: (payload: GatewayClientEvents.MessageAck) => any): this;
  on(event: 'messageAck', listener: (payload: GatewayClientEvents.MessageAck) => any): this;
  on(event: ClientEvents.MESSAGE_CREATE, listener: (payload: GatewayClientEvents.MessageCreate) => any): this;
  on(event: 'messageCreate', listener: (payload: GatewayClientEvents.MessageCreate) => any): this;
  on(event: ClientEvents.MESSAGE_DELETE, listener: (payload: GatewayClientEvents.MessageDelete) => any): this;
  on(event: 'messageDelete', listener: (payload: GatewayClientEvents.MessageDelete) => any): this;
  on(event: ClientEvents.MESSAGE_DELETE_BULK, listener: (payload: GatewayClientEvents.MessageDeleteBulk) => any): this;
  on(event: 'messageDeleteBulk', listener: (payload: GatewayClientEvents.MessageDeleteBulk) => any): this;
  on(event: ClientEvents.MESSAGE_REACTION_ADD, listener: (payload: GatewayClientEvents.MessageReactionAdd) => any): this;
  on(event: 'messageReactionAdd', listener: (payload: GatewayClientEvents.MessageReactionAdd) => any): this;
  on(event: ClientEvents.MESSAGE_REACTION_REMOVE, listener: (payload: GatewayClientEvents.MessageReactionRemove) => any): this;
  on(event: 'messageReactionRemove', listener: (payload: GatewayClientEvents.MessageReactionRemove) => any): this;
  on(event: ClientEvents.MESSAGE_REACTION_REMOVE_ALL, listener: (payload: GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  on(event: 'messageReactionRemoveAll', listener: (payload: GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  on(event: ClientEvents.MESSAGE_REACTION_REMOVE_EMOJI, listener: (payload: GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  on(event: 'messageReactionRemoveEmoji', listener: (payload: GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  on(event: ClientEvents.MESSAGE_UPDATE, listener: (payload: GatewayClientEvents.MessageUpdate) => any): this;
  on(event: 'messageUpdate', listener: (payload: GatewayClientEvents.MessageUpdate) => any): this;
  on(event: ClientEvents.PRESENCES_REPLACE, listener: (payload: GatewayClientEvents.PresencesReplace) => any): this;
  on(event: 'presencesReplace', listener: (payload: GatewayClientEvents.PresencesReplace) => any): this;
  on(event: ClientEvents.PRESENCE_UPDATE, listener: (payload: GatewayClientEvents.PresenceUpdate) => any): this;
  on(event: 'presenceUpdate', listener: (payload: GatewayClientEvents.PresenceUpdate) => any): this;
  on(event: ClientEvents.RECENT_MENTION_DELETE, listener: (payload: GatewayClientEvents.RecentMentionDelete) => any): this;
  on(event: 'recentMentionDelete', listener: (payload: GatewayClientEvents.RecentMentionDelete) => any): this;
  on(event: ClientEvents.RELATIONSHIP_ADD, listener: (payload: GatewayClientEvents.RelationshipAdd) => any): this;
  on(event: 'relationshipAdd', listener: (payload: GatewayClientEvents.RelationshipAdd) => any): this;
  on(event: ClientEvents.RELATIONSHIP_REMOVE, listener: (payload: GatewayClientEvents.RelationshipRemove) => any): this;
  on(event: 'relationshipRemove', listener: (payload: GatewayClientEvents.RelationshipRemove) => any): this;
  on(event: ClientEvents.SESSIONS_REPLACE, listener: (payload: GatewayClientEvents.SessionsReplace) => any): this;
  on(event: 'sessionsReplace', listener: (payload: GatewayClientEvents.SessionsReplace) => any): this;
  on(event: ClientEvents.STAGE_INSTANCE_CREATE, listener: (payload: GatewayClientEvents.StageInstanceCreate) => any): this;
  on(event: 'stageInstanceCreate', listener: (payload: GatewayClientEvents.StageInstanceCreate) => any): this;
  on(event: ClientEvents.STAGE_INSTANCE_DELETE, listener: (payload: GatewayClientEvents.StageInstanceDelete) => any): this;
  on(event: 'stageInstanceDelete', listener: (payload: GatewayClientEvents.StageInstanceDelete) => any): this;
  on(event: ClientEvents.STAGE_INSTANCE_UPDATE, listener: (payload: GatewayClientEvents.StageInstanceUpdate) => any): this;
  on(event: 'stageInstanceUpdate', listener: (payload: GatewayClientEvents.StageInstanceUpdate) => any): this;
  on(event: ClientEvents.STREAM_CREATE, listener: (payload: GatewayClientEvents.StreamCreate) => any): this;
  on(event: 'streamCreate', listener: (payload: GatewayClientEvents.StreamCreate) => any): this;
  on(event: ClientEvents.STREAM_DELETE, listener: (payload: GatewayClientEvents.StreamDelete) => any): this;
  on(event: 'streamDelete', listener: (payload: GatewayClientEvents.StreamDelete) => any): this;
  on(event: ClientEvents.STREAM_SERVER_UPDATE, listener: (payload: GatewayClientEvents.StreamServerUpdate) => any): this;
  on(event: 'streamServerUpdate', listener: (payload: GatewayClientEvents.StreamServerUpdate) => any): this;
  on(event: ClientEvents.STREAM_UPDATE, listener: (payload: GatewayClientEvents.StreamUpdate) => any): this;
  on(event: 'streamUpdate', listener: (payload: GatewayClientEvents.StreamUpdate) => any): this;
  on(event: ClientEvents.TYPING_START, listener: (payload: GatewayClientEvents.TypingStart) => any): this;
  on(event: 'typingStart', listener: (payload: GatewayClientEvents.TypingStart) => any): this;
  on(event: ClientEvents.TYPING_STOP, listener: (payload: GatewayClientEvents.TypingStop) => any): this;
  on(event: 'typingStop', listener: (payload: GatewayClientEvents.TypingStop) => any): this;
  on(event: ClientEvents.USER_ACHIEVEMENT_UPDATE, listener: (payload: GatewayClientEvents.UserAchievementUpdate) => any): this;
  on(event: 'userAchievementUpdate', listener: (payload: GatewayClientEvents.UserAchievementUpdate) => any): this;
  on(event: ClientEvents.USER_CONNECTIONS_UPDATE, listener: (payload: GatewayClientEvents.UserConnectionsUpdate) => any): this;
  on(event: 'userConnectionsUpdate', listener: (payload: GatewayClientEvents.UserConnectionsUpdate) => any): this;
  on(event: ClientEvents.USER_FEED_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  on(event: 'userFeedSettingsUpdate', listener: (payload: GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  on(event: ClientEvents.USER_GUILD_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  on(event: 'userGuildSettingsUpdate', listener: (payload: GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  on(event: ClientEvents.USER_NOTE_UPDATE, listener: (payload: GatewayClientEvents.UserNoteUpdate) => any): this;
  on(event: 'userNoteUpdate', listener: (payload: GatewayClientEvents.UserNoteUpdate) => any): this;
  on(event: ClientEvents.USER_PAYMENT_SOURCES_UPDATE, listener: (payload: GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  on(event: 'userPaymentSourcesUpdate', listener: (payload: GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  on(event: ClientEvents.USER_PAYMENTS_UPDATE, listener: (payload: GatewayClientEvents.UserPaymentsUpdate) => any): this;
  on(event: 'userPaymentsUpdate', listener: (payload: GatewayClientEvents.UserPaymentsUpdate) => any): this;
  on(event: ClientEvents.USER_REQUIRED_ACTION_UPDATE, listener: (payload: GatewayClientEvents.UserRequiredActionUpdate) => any): this;
  on(event: 'userRequiredActionUpdate', listener: (payload: GatewayClientEvents.UserRequiredActionUpdate) => any): this;
  on(event: ClientEvents.USER_UPDATE, listener: (payload: GatewayClientEvents.UserUpdate) => any): this;
  on(event: 'userUpdate', listener: (payload: GatewayClientEvents.UserUpdate) => any): this;
  on(event: ClientEvents.USERS_UPDATE, listener: (payload: GatewayClientEvents.UsersUpdate) => any): this;
  on(event: 'usersUpdate', listener: (payload: GatewayClientEvents.UsersUpdate) => any): this;
  on(event: ClientEvents.VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.VoiceServerUpdate) => any): this;
  on(event: 'voiceServerUpdate', listener: (payload: GatewayClientEvents.VoiceServerUpdate) => any): this;
  on(event: ClientEvents.VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.VoiceStateUpdate) => any): this;
  on(event: 'voiceStateUpdate', listener: (payload: GatewayClientEvents.VoiceStateUpdate) => any): this;
  on(event: ClientEvents.WEBHOOKS_UPDATE, listener: (payload: GatewayClientEvents.WebhooksUpdate) => any): this;
  on(event: 'webhooksUpdate', listener: (payload: GatewayClientEvents.WebhooksUpdate) => any): this;
  on(event: ClientEvents.RAW, listener: (payload: GatewayClientEvents.Raw) => any): this;
  on(event: 'raw', listener: (payload: GatewayClientEvents.Raw) => any): this;
  on(event: ClientEvents.REST_REQUEST, listener: (payload: GatewayClientEvents.RestRequest) => any): this;
  on(event: 'restRequest', listener: (payload: GatewayClientEvents.RestRequest) => any): this;
  on(event: ClientEvents.REST_RESPONSE, listener: (payload: GatewayClientEvents.RestResponse) => any): this;
  on(event: 'restResponse', listener: (payload: GatewayClientEvents.RestResponse) => any): this;
  on(event: ClientEvents.UNKNOWN, listener: (payload: GatewayClientEvents.Unknown) => any): this;
  on(event: 'unknown', listener: (payload: GatewayClientEvents.Unknown) => any): this;
  on(event: ClientEvents.WARN, listener: (payload: GatewayClientEvents.Warn) => any): this;
  on(event: 'warn', listener: (payload: GatewayClientEvents.Warn) => any): this;
  on(event: ClientEvents.KILLED, listener: (payload: GatewayClientEvents.Killed) => any): this;
  on(event: 'killed', listener: (payload: GatewayClientEvents.Killed) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: ClientEvents.ACTIVITY_JOIN_INVITE, listener: (payload: GatewayClientEvents.ActivityJoinInvite) => any): this;
  once(event: 'activityJoinInvite', listener: (payload: GatewayClientEvents.ActivityJoinInvite) => any): this;
  once(event: ClientEvents.ACTIVITY_JOIN_REQUEST, listener: (payload: GatewayClientEvents.ActivityJoinRequest) => any): this;
  once(event: 'activityJoinRequest', listener: (payload: GatewayClientEvents.ActivityJoinRequest) => any): this;
  once(event: ClientEvents.ACTIVITY_START, listener: (payload: GatewayClientEvents.ActivityStart) => any): this;
  once(event: 'activityStart', listener: (payload: GatewayClientEvents.ActivityStart) => any): this;
  once(event: ClientEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK, listener: (payload: GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  once(event: 'braintreePopupBridgeCallback', listener: (payload: GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  once(event: ClientEvents.CALL_CREATE, listener: (payload: GatewayClientEvents.CallCreate) => any): this;
  once(event: 'callCreate', listener: (payload: GatewayClientEvents.CallCreate) => any): this;
  once(event: ClientEvents.CALL_DELETE, listener: (payload: GatewayClientEvents.CallDelete) => any): this;
  once(event: 'callDelete', listener: (payload: GatewayClientEvents.CallDelete) => any): this;
  once(event: ClientEvents.CALL_UPDATE, listener: (payload: GatewayClientEvents.CallUpdate) => any): this;
  once(event: 'callUpdate', listener: (payload: GatewayClientEvents.CallUpdate) => any): this;
  once(event: ClientEvents.CHANNEL_CREATE, listener: (payload: GatewayClientEvents.ChannelCreate) => any): this;
  once(event: 'channelCreate', listener: (payload: GatewayClientEvents.ChannelCreate) => any): this;
  once(event: ClientEvents.CHANNEL_DELETE, listener: (payload: GatewayClientEvents.ChannelDelete) => any): this;
  once(event: 'channelDelete', listener: (payload: GatewayClientEvents.ChannelDelete) => any): this;
  once(event: ClientEvents.CHANNEL_UPDATE, listener: (payload: GatewayClientEvents.ChannelUpdate) => any): this;
  once(event: 'channelUpdate', listener: (payload: GatewayClientEvents.ChannelUpdate) => any): this;
  once(event: ClientEvents.CHANNEL_PINS_ACK, listener: (payload: GatewayClientEvents.ChannelPinsAck) => any): this;
  once(event: 'channelPinsAck', listener: (payload: GatewayClientEvents.ChannelPinsAck) => any): this;
  once(event: ClientEvents.CHANNEL_PINS_UPDATE, listener: (payload: GatewayClientEvents.ChannelPinsUpdate) => any): this;
  once(event: 'channelPinsUpdate', listener: (payload: GatewayClientEvents.ChannelPinsUpdate) => any): this;
  once(event: ClientEvents.CHANNEL_RECIPIENT_ADD, listener: (payload: GatewayClientEvents.ChannelRecipientAdd) => any): this;
  once(event: 'channelRecipientAdd', listener: (payload: GatewayClientEvents.ChannelRecipientAdd) => any): this;
  once(event: ClientEvents.CHANNEL_RECIPIENT_REMOVE, listener: (payload: GatewayClientEvents.ChannelRecipientRemove) => any): this;
  once(event: 'channelRecipientRemove', listener: (payload: GatewayClientEvents.ChannelRecipientRemove) => any): this;
  once(event: ClientEvents.ENTITLEMENT_CREATE, listener: (payload: GatewayClientEvents.EntitlementCreate) => any): this;
  once(event: 'entitlementCreate', listener: (payload: GatewayClientEvents.EntitlementCreate) => any): this;
  once(event: ClientEvents.ENTITLEMENT_DELETE, listener: (payload: GatewayClientEvents.EntitlementDelete) => any): this;
  once(event: 'entitlementDelete', listener: (payload: GatewayClientEvents.EntitlementDelete) => any): this;
  once(event: ClientEvents.ENTITLEMENT_UPDATE, listener: (payload: GatewayClientEvents.EntitlementUpdate) => any): this;
  once(event: 'entitlementUpdate', listener: (payload: GatewayClientEvents.EntitlementUpdate) => any): this;
  once(event: ClientEvents.FRIEND_SUGGESTION_CREATE, listener: (payload: GatewayClientEvents.FriendSuggestionCreate) => any): this;
  once(event: 'friendSuggestionCreate', listener: (payload: GatewayClientEvents.FriendSuggestionCreate) => any): this;
  once(event: ClientEvents.FRIEND_SUGGESTION_DELETE, listener: (payload: GatewayClientEvents.FriendSuggestionDelete) => any): this;
  once(event: 'friendSuggestionDelete', listener: (payload: GatewayClientEvents.FriendSuggestionDelete) => any): this;
  once(event: ClientEvents.GATEWAY_READY, listener: (payload: GatewayClientEvents.GatewayReady) => any): this;
  once(event: 'gatewayReady', listener: (payload: GatewayClientEvents.GatewayReady) => any): this;
  once(event: ClientEvents.GATEWAY_RESUMED, listener: (payload: GatewayClientEvents.GatewayResumed) => any): this;
  once(event: 'gatewayResumed', listener: (payload: GatewayClientEvents.GatewayResumed) => any): this;
  once(event: ClientEvents.GIFT_CODE_UPDATE, listener: (payload: GatewayClientEvents.GiftCodeUpdate) => any): this;
  once(event: 'giftCodeUpdate', listener: (payload: GatewayClientEvents.GiftCodeUpdate) => any): this;
  once(event: ClientEvents.GUILD_BAN_ADD, listener: (payload: GatewayClientEvents.GuildBanAdd) => any): this;
  once(event: 'guildBanAdd', listener: (payload: GatewayClientEvents.GuildBanAdd) => any): this;
  once(event: ClientEvents.GUILD_BAN_REMOVE, listener: (payload: GatewayClientEvents.GuildBanRemove) => any): this;
  once(event: 'guildBanRemove', listener: (payload: GatewayClientEvents.GuildBanRemove) => any): this;
  once(event: ClientEvents.GUILD_CREATE, listener: (payload: GatewayClientEvents.GuildCreate) => any): this;
  once(event: 'guildCreate', listener: (payload: GatewayClientEvents.GuildCreate) => any): this;
  once(event: ClientEvents.GUILD_DELETE, listener: (payload: GatewayClientEvents.GuildDelete) => any): this;
  once(event: 'guildDelete', listener: (payload: GatewayClientEvents.GuildDelete) => any): this;
  once(event: ClientEvents.GUILD_EMOJIS_UPDATE, listener: (payload: GatewayClientEvents.GuildEmojisUpdate) => any): this;
  once(event: 'guildEmojisUpdate', listener: (payload: GatewayClientEvents.GuildEmojisUpdate) => any): this;
  once(event: ClientEvents.GUILD_INTEGRATIONS_UPDATE, listener: (payload: GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  once(event: 'guildIntegrationsUpdate', listener: (payload: GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  once(event: ClientEvents.GUILD_MEMBER_ADD, listener: (payload: GatewayClientEvents.GuildMemberAdd) => any): this;
  once(event: 'guildMemberAdd', listener: (payload: GatewayClientEvents.GuildMemberAdd) => any): this;
  once(event: ClientEvents.GUILD_MEMBER_LIST_UPDATE, listener: (payload: GatewayClientEvents.GuildMemberListUpdate) => any): this;
  once(event: 'guildMemberListUpdate', listener: (payload: GatewayClientEvents.GuildMemberListUpdate) => any): this;
  once(event: ClientEvents.GUILD_MEMBER_REMOVE, listener: (payload: GatewayClientEvents.GuildMemberRemove) => any): this;
  once(event: 'guildMemberRemove', listener: (payload: GatewayClientEvents.GuildMemberRemove) => any): this;
  once(event: ClientEvents.GUILD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.GuildMemberUpdate) => any): this;
  once(event: 'guildMemberUpdate', listener: (payload: GatewayClientEvents.GuildMemberUpdate) => any): this;
  once(event: ClientEvents.GUILD_MEMBERS_CHUNK, listener: (payload: GatewayClientEvents.GuildMembersChunk) => any): this;
  once(event: 'guildMembersChunk', listener: (payload: GatewayClientEvents.GuildMembersChunk) => any): this;
  once(event: ClientEvents.GUILD_READY, listener: (payload: GatewayClientEvents.GuildReady) => any): this;
  once(event: 'guildReady', listener: (payload: GatewayClientEvents.GuildReady) => any): this;
  once(event: ClientEvents.GUILD_ROLE_CREATE, listener: (payload: GatewayClientEvents.GuildRoleCreate) => any): this;
  once(event: 'guildRoleCreate', listener: (payload: GatewayClientEvents.GuildRoleCreate) => any): this;
  once(event: ClientEvents.GUILD_ROLE_DELETE, listener: (payload: GatewayClientEvents.GuildRoleDelete) => any): this;
  once(event: 'guildRoleDelete', listener: (payload: GatewayClientEvents.GuildRoleDelete) => any): this;
  once(event: ClientEvents.GUILD_ROLE_UPDATE, listener: (payload: GatewayClientEvents.GuildRoleUpdate) => any): this;
  once(event: 'guildRoleUpdate', listener: (payload: GatewayClientEvents.GuildRoleUpdate) => any): this;
  once(event: ClientEvents.GUILD_UPDATE, listener: (payload: GatewayClientEvents.GuildUpdate) => any): this;
  once(event: 'guildUpdate', listener: (payload: GatewayClientEvents.GuildUpdate) => any): this;
  once(event: ClientEvents.INVITE_CREATE, listener: (payload: GatewayClientEvents.InviteCreate) => any): this;
  once(event: 'inviteCreate', listener: (payload: GatewayClientEvents.InviteCreate) => any): this;
  once(event: ClientEvents.INVITE_DELETE, listener: (payload: GatewayClientEvents.InviteDelete) => any): this;
  once(event: 'inviteDelete', listener: (payload: GatewayClientEvents.InviteDelete) => any): this;
  once(event: ClientEvents.LIBRARY_APPLICATION_UPDATE, listener: (payload: GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  once(event: 'libraryApplicationUpdate', listener: (payload: GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  once(event: ClientEvents.LOBBY_CREATE, listener: (payload: GatewayClientEvents.LobbyCreate) => any): this;
  once(event: 'lobbyCreate', listener: (payload: GatewayClientEvents.LobbyCreate) => any): this;
  once(event: ClientEvents.LOBBY_DELETE, listener: (payload: GatewayClientEvents.LobbyDelete) => any): this;
  once(event: 'lobbyDelete', listener: (payload: GatewayClientEvents.LobbyDelete) => any): this;
  once(event: ClientEvents.LOBBY_UPDATE, listener: (payload: GatewayClientEvents.LobbyUpdate) => any): this;
  once(event: 'lobbyUpdate', listener: (payload: GatewayClientEvents.LobbyUpdate) => any): this;
  once(event: ClientEvents.LOBBY_MEMBER_CONNECT, listener: (payload: GatewayClientEvents.LobbyMemberConnect) => any): this;
  once(event: 'lobbyMemberConnect', listener: (payload: GatewayClientEvents.LobbyMemberConnect) => any): this;
  once(event: ClientEvents.LOBBY_MEMBER_DISCONNECT, listener: (payload: GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  once(event: 'lobbyMemberDisconnect', listener: (payload: GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  once(event: ClientEvents.LOBBY_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.LobbyMemberUpdate) => any): this;
  once(event: 'lobbyMemberUpdate', listener: (payload: GatewayClientEvents.LobbyMemberUpdate) => any): this;
  once(event: ClientEvents.LOBBY_MESSAGE, listener: (payload: GatewayClientEvents.LobbyMessage) => any): this;
  once(event: 'lobbyMessage', listener: (payload: GatewayClientEvents.LobbyMessage) => any): this;
  once(event: ClientEvents.LOBBY_VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  once(event: 'lobbyVoiceServerUpdate', listener: (payload: GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  once(event: ClientEvents.LOBBY_VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  once(event: 'lobbyVoiceStateUpdate', listener: (payload: GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  once(event: ClientEvents.MESSAGE_ACK, listener: (payload: GatewayClientEvents.MessageAck) => any): this;
  once(event: 'messageAck', listener: (payload: GatewayClientEvents.MessageAck) => any): this;
  once(event: ClientEvents.MESSAGE_CREATE, listener: (payload: GatewayClientEvents.MessageCreate) => any): this;
  once(event: 'messageCreate', listener: (payload: GatewayClientEvents.MessageCreate) => any): this;
  once(event: ClientEvents.MESSAGE_DELETE, listener: (payload: GatewayClientEvents.MessageDelete) => any): this;
  once(event: 'messageDelete', listener: (payload: GatewayClientEvents.MessageDelete) => any): this;
  once(event: ClientEvents.MESSAGE_DELETE_BULK, listener: (payload: GatewayClientEvents.MessageDeleteBulk) => any): this;
  once(event: 'messageDeleteBulk', listener: (payload: GatewayClientEvents.MessageDeleteBulk) => any): this;
  once(event: ClientEvents.MESSAGE_REACTION_ADD, listener: (payload: GatewayClientEvents.MessageReactionAdd) => any): this;
  once(event: 'messageReactionAdd', listener: (payload: GatewayClientEvents.MessageReactionAdd) => any): this;
  once(event: ClientEvents.MESSAGE_REACTION_REMOVE, listener: (payload: GatewayClientEvents.MessageReactionRemove) => any): this;
  once(event: 'messageReactionRemove', listener: (payload: GatewayClientEvents.MessageReactionRemove) => any): this;
  once(event: ClientEvents.MESSAGE_REACTION_REMOVE_ALL, listener: (payload: GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  once(event: 'messageReactionRemoveAll', listener: (payload: GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  once(event: ClientEvents.MESSAGE_REACTION_REMOVE_EMOJI, listener: (payload: GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  once(event: 'messageReactionRemoveEmoji', listener: (payload: GatewayClientEvents.MessageReactionRemoveEmoji) => any): this;
  once(event: ClientEvents.MESSAGE_UPDATE, listener: (payload: GatewayClientEvents.MessageUpdate) => any): this;
  once(event: 'messageUpdate', listener: (payload: GatewayClientEvents.MessageUpdate) => any): this;
  once(event: ClientEvents.PRESENCES_REPLACE, listener: (payload: GatewayClientEvents.PresencesReplace) => any): this;
  once(event: 'presencesReplace', listener: (payload: GatewayClientEvents.PresencesReplace) => any): this;
  once(event: ClientEvents.PRESENCE_UPDATE, listener: (payload: GatewayClientEvents.PresenceUpdate) => any): this;
  once(event: 'presenceUpdate', listener: (payload: GatewayClientEvents.PresenceUpdate) => any): this;
  once(event: ClientEvents.RECENT_MENTION_DELETE, listener: (payload: GatewayClientEvents.RecentMentionDelete) => any): this;
  once(event: 'recentMentionDelete', listener: (payload: GatewayClientEvents.RecentMentionDelete) => any): this;
  once(event: ClientEvents.RELATIONSHIP_ADD, listener: (payload: GatewayClientEvents.RelationshipAdd) => any): this;
  once(event: 'relationshipAdd', listener: (payload: GatewayClientEvents.RelationshipAdd) => any): this;
  once(event: ClientEvents.RELATIONSHIP_REMOVE, listener: (payload: GatewayClientEvents.RelationshipRemove) => any): this;
  once(event: 'relationshipRemove', listener: (payload: GatewayClientEvents.RelationshipRemove) => any): this;
  once(event: ClientEvents.SESSIONS_REPLACE, listener: (payload: GatewayClientEvents.SessionsReplace) => any): this;
  once(event: 'sessionsReplace', listener: (payload: GatewayClientEvents.SessionsReplace) => any): this;
  once(event: ClientEvents.STAGE_INSTANCE_CREATE, listener: (payload: GatewayClientEvents.StageInstanceCreate) => any): this;
  once(event: 'stageInstanceCreate', listener: (payload: GatewayClientEvents.StageInstanceCreate) => any): this;
  once(event: ClientEvents.STAGE_INSTANCE_DELETE, listener: (payload: GatewayClientEvents.StageInstanceDelete) => any): this;
  once(event: 'stageInstanceDelete', listener: (payload: GatewayClientEvents.StageInstanceDelete) => any): this;
  once(event: ClientEvents.STAGE_INSTANCE_UPDATE, listener: (payload: GatewayClientEvents.StageInstanceUpdate) => any): this;
  once(event: 'stageInstanceUpdate', listener: (payload: GatewayClientEvents.StageInstanceUpdate) => any): this;
  once(event: ClientEvents.STREAM_CREATE, listener: (payload: GatewayClientEvents.StreamCreate) => any): this;
  once(event: 'streamCreate', listener: (payload: GatewayClientEvents.StreamCreate) => any): this;
  once(event: ClientEvents.STREAM_DELETE, listener: (payload: GatewayClientEvents.StreamDelete) => any): this;
  once(event: 'streamDelete', listener: (payload: GatewayClientEvents.StreamDelete) => any): this;
  once(event: ClientEvents.STREAM_SERVER_UPDATE, listener: (payload: GatewayClientEvents.StreamServerUpdate) => any): this;
  once(event: 'streamServerUpdate', listener: (payload: GatewayClientEvents.StreamServerUpdate) => any): this;
  once(event: ClientEvents.STREAM_UPDATE, listener: (payload: GatewayClientEvents.StreamUpdate) => any): this;
  once(event: 'streamUpdate', listener: (payload: GatewayClientEvents.StreamUpdate) => any): this;
  once(event: ClientEvents.TYPING_START, listener: (payload: GatewayClientEvents.TypingStart) => any): this;
  once(event: 'typingStart', listener: (payload: GatewayClientEvents.TypingStart) => any): this;
  once(event: ClientEvents.TYPING_STOP, listener: (payload: GatewayClientEvents.TypingStop) => any): this;
  once(event: 'typingStop', listener: (payload: GatewayClientEvents.TypingStop) => any): this;
  once(event: ClientEvents.USER_ACHIEVEMENT_UPDATE, listener: (payload: GatewayClientEvents.UserAchievementUpdate) => any): this;
  once(event: 'userAchievementUpdate', listener: (payload: GatewayClientEvents.UserAchievementUpdate) => any): this;
  once(event: ClientEvents.USER_CONNECTIONS_UPDATE, listener: (payload: GatewayClientEvents.UserConnectionsUpdate) => any): this;
  once(event: 'userConnectionsUpdate', listener: (payload: GatewayClientEvents.UserConnectionsUpdate) => any): this;
  once(event: ClientEvents.USER_FEED_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  once(event: 'userFeedSettingsUpdate', listener: (payload: GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  once(event: ClientEvents.USER_GUILD_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  once(event: 'userGuildSettingsUpdate', listener: (payload: GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  once(event: ClientEvents.USER_NOTE_UPDATE, listener: (payload: GatewayClientEvents.UserNoteUpdate) => any): this;
  once(event: 'userNoteUpdate', listener: (payload: GatewayClientEvents.UserNoteUpdate) => any): this;
  once(event: ClientEvents.USER_PAYMENT_SOURCES_UPDATE, listener: (payload: GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  once(event: 'userPaymentSourcesUpdate', listener: (payload: GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  once(event: ClientEvents.USER_PAYMENTS_UPDATE, listener: (payload: GatewayClientEvents.UserPaymentsUpdate) => any): this;
  once(event: 'userPaymentsUpdate', listener: (payload: GatewayClientEvents.UserPaymentsUpdate) => any): this;
  once(event: ClientEvents.USER_REQUIRED_ACTION_UPDATE, listener: (payload: GatewayClientEvents.UserRequiredActionUpdate) => any): this;
  once(event: 'userRequiredActionUpdate', listener: (payload: GatewayClientEvents.UserRequiredActionUpdate) => any): this;
  once(event: ClientEvents.USER_UPDATE, listener: (payload: GatewayClientEvents.UserUpdate) => any): this;
  once(event: 'userUpdate', listener: (payload: GatewayClientEvents.UserUpdate) => any): this;
  once(event: ClientEvents.USERS_UPDATE, listener: (payload: GatewayClientEvents.UsersUpdate) => any): this;
  once(event: 'usersUpdate', listener: (payload: GatewayClientEvents.UsersUpdate) => any): this;
  once(event: ClientEvents.VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.VoiceServerUpdate) => any): this;
  once(event: 'voiceServerUpdate', listener: (payload: GatewayClientEvents.VoiceServerUpdate) => any): this;
  once(event: ClientEvents.VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.VoiceStateUpdate) => any): this;
  once(event: 'voiceStateUpdate', listener: (payload: GatewayClientEvents.VoiceStateUpdate) => any): this;
  once(event: ClientEvents.WEBHOOKS_UPDATE, listener: (payload: GatewayClientEvents.WebhooksUpdate) => any): this;
  once(event: 'webhooksUpdate', listener: (payload: GatewayClientEvents.WebhooksUpdate) => any): this;
  once(event: ClientEvents.RAW, listener: (payload: GatewayClientEvents.Raw) => any): this;
  once(event: 'raw', listener: (payload: GatewayClientEvents.Raw) => any): this;
  once(event: ClientEvents.REST_REQUEST, listener: (payload: GatewayClientEvents.RestRequest) => any): this;
  once(event: 'restRequest', listener: (payload: GatewayClientEvents.RestRequest) => any): this;
  once(event: ClientEvents.REST_RESPONSE, listener: (payload: GatewayClientEvents.RestResponse) => any): this;
  once(event: 'restResponse', listener: (payload: GatewayClientEvents.RestResponse) => any): this;
  once(event: ClientEvents.UNKNOWN, listener: (payload: GatewayClientEvents.Unknown) => any): this;
  once(event: 'unknown', listener: (payload: GatewayClientEvents.Unknown) => any): this;
  once(event: ClientEvents.WARN, listener: (payload: GatewayClientEvents.Warn) => any): this;
  once(event: 'warn', listener: (payload: GatewayClientEvents.Warn) => any): this;
  once(event: ClientEvents.KILLED, listener: (payload: GatewayClientEvents.Killed) => any): this;
  once(event: 'killed', listener: (payload: GatewayClientEvents.Killed) => any): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    super.once(event, listener);
    return this;
  }

  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription;
  subscribe(event: ClientEvents.ACTIVITY_JOIN_INVITE, listener: (payload: GatewayClientEvents.ActivityJoinInvite) => any): EventSubscription;
  subscribe(event: 'activityJoinInvite', listener: (payload: GatewayClientEvents.ActivityJoinInvite) => any): EventSubscription;
  subscribe(event: ClientEvents.ACTIVITY_JOIN_REQUEST, listener: (payload: GatewayClientEvents.ActivityJoinRequest) => any): EventSubscription;
  subscribe(event: 'activityJoinRequest', listener: (payload: GatewayClientEvents.ActivityJoinRequest) => any): EventSubscription;
  subscribe(event: ClientEvents.ACTIVITY_START, listener: (payload: GatewayClientEvents.ActivityStart) => any): EventSubscription;
  subscribe(event: 'activityStart', listener: (payload: GatewayClientEvents.ActivityStart) => any): EventSubscription;
  subscribe(event: ClientEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK, listener: (payload: GatewayClientEvents.BraintreePopupBridgeCallback) => any): EventSubscription;
  subscribe(event: 'braintreePopupBridgeCallback', listener: (payload: GatewayClientEvents.BraintreePopupBridgeCallback) => any): EventSubscription;
  subscribe(event: ClientEvents.CALL_CREATE, listener: (payload: GatewayClientEvents.CallCreate) => any): EventSubscription;
  subscribe(event: 'callCreate', listener: (payload: GatewayClientEvents.CallCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.CALL_DELETE, listener: (payload: GatewayClientEvents.CallDelete) => any): EventSubscription;
  subscribe(event: 'callDelete', listener: (payload: GatewayClientEvents.CallDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.CALL_UPDATE, listener: (payload: GatewayClientEvents.CallUpdate) => any): EventSubscription;
  subscribe(event: 'callUpdate', listener: (payload: GatewayClientEvents.CallUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_CREATE, listener: (payload: GatewayClientEvents.ChannelCreate) => any): EventSubscription;
  subscribe(event: 'channelCreate', listener: (payload: GatewayClientEvents.ChannelCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_DELETE, listener: (payload: GatewayClientEvents.ChannelDelete) => any): EventSubscription;
  subscribe(event: 'channelDelete', listener: (payload: GatewayClientEvents.ChannelDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_UPDATE, listener: (payload: GatewayClientEvents.ChannelUpdate) => any): EventSubscription;
  subscribe(event: 'channelUpdate', listener: (payload: GatewayClientEvents.ChannelUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_PINS_ACK, listener: (payload: GatewayClientEvents.ChannelPinsAck) => any): EventSubscription;
  subscribe(event: 'channelPinsAck', listener: (payload: GatewayClientEvents.ChannelPinsAck) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_PINS_UPDATE, listener: (payload: GatewayClientEvents.ChannelPinsUpdate) => any): EventSubscription;
  subscribe(event: 'channelPinsUpdate', listener: (payload: GatewayClientEvents.ChannelPinsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_RECIPIENT_ADD, listener: (payload: GatewayClientEvents.ChannelRecipientAdd) => any): EventSubscription;
  subscribe(event: 'channelRecipientAdd', listener: (payload: GatewayClientEvents.ChannelRecipientAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.CHANNEL_RECIPIENT_REMOVE, listener: (payload: GatewayClientEvents.ChannelRecipientRemove) => any): EventSubscription;
  subscribe(event: 'channelRecipientRemove', listener: (payload: GatewayClientEvents.ChannelRecipientRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.ENTITLEMENT_CREATE, listener: (payload: GatewayClientEvents.EntitlementCreate) => any): EventSubscription;
  subscribe(event: 'entitlementCreate', listener: (payload: GatewayClientEvents.EntitlementCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.ENTITLEMENT_DELETE, listener: (payload: GatewayClientEvents.EntitlementDelete) => any): EventSubscription;
  subscribe(event: 'entitlementDelete', listener: (payload: GatewayClientEvents.EntitlementDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.ENTITLEMENT_UPDATE, listener: (payload: GatewayClientEvents.EntitlementUpdate) => any): EventSubscription;
  subscribe(event: 'entitlementUpdate', listener: (payload: GatewayClientEvents.EntitlementUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.FRIEND_SUGGESTION_CREATE, listener: (payload: GatewayClientEvents.FriendSuggestionCreate) => any): EventSubscription;
  subscribe(event: 'friendSuggestionCreate', listener: (payload: GatewayClientEvents.FriendSuggestionCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.FRIEND_SUGGESTION_DELETE, listener: (payload: GatewayClientEvents.FriendSuggestionDelete) => any): EventSubscription;
  subscribe(event: 'friendSuggestionDelete', listener: (payload: GatewayClientEvents.FriendSuggestionDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.GATEWAY_READY, listener: (payload: GatewayClientEvents.GatewayReady) => any): EventSubscription;
  subscribe(event: 'gatewayReady', listener: (payload: GatewayClientEvents.GatewayReady) => any): EventSubscription;
  subscribe(event: ClientEvents.GATEWAY_RESUMED, listener: (payload: GatewayClientEvents.GatewayResumed) => any): EventSubscription;
  subscribe(event: 'gatewayResumed', listener: (payload: GatewayClientEvents.GatewayResumed) => any): EventSubscription;
  subscribe(event: ClientEvents.GIFT_CODE_UPDATE, listener: (payload: GatewayClientEvents.GiftCodeUpdate) => any): EventSubscription;
  subscribe(event: 'giftCodeUpdate', listener: (payload: GatewayClientEvents.GiftCodeUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_BAN_ADD, listener: (payload: GatewayClientEvents.GuildBanAdd) => any): EventSubscription;
  subscribe(event: 'guildBanAdd', listener: (payload: GatewayClientEvents.GuildBanAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_BAN_REMOVE, listener: (payload: GatewayClientEvents.GuildBanRemove) => any): EventSubscription;
  subscribe(event: 'guildBanRemove', listener: (payload: GatewayClientEvents.GuildBanRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_CREATE, listener: (payload: GatewayClientEvents.GuildCreate) => any): EventSubscription;
  subscribe(event: 'guildCreate', listener: (payload: GatewayClientEvents.GuildCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_DELETE, listener: (payload: GatewayClientEvents.GuildDelete) => any): EventSubscription;
  subscribe(event: 'guildDelete', listener: (payload: GatewayClientEvents.GuildDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_EMOJIS_UPDATE, listener: (payload: GatewayClientEvents.GuildEmojisUpdate) => any): EventSubscription;
  subscribe(event: 'guildEmojisUpdate', listener: (payload: GatewayClientEvents.GuildEmojisUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_INTEGRATIONS_UPDATE, listener: (payload: GatewayClientEvents.GuildIntegrationsUpdate) => any): EventSubscription;
  subscribe(event: 'guildIntegrationsUpdate', listener: (payload: GatewayClientEvents.GuildIntegrationsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBER_ADD, listener: (payload: GatewayClientEvents.GuildMemberAdd) => any): EventSubscription;
  subscribe(event: 'guildMemberAdd', listener: (payload: GatewayClientEvents.GuildMemberAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBER_LIST_UPDATE, listener: (payload: GatewayClientEvents.GuildMemberListUpdate) => any): EventSubscription;
  subscribe(event: 'guildMemberListUpdate', listener: (payload: GatewayClientEvents.GuildMemberListUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBER_REMOVE, listener: (payload: GatewayClientEvents.GuildMemberRemove) => any): EventSubscription;
  subscribe(event: 'guildMemberRemove', listener: (payload: GatewayClientEvents.GuildMemberRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.GuildMemberUpdate) => any): EventSubscription;
  subscribe(event: 'guildMemberUpdate', listener: (payload: GatewayClientEvents.GuildMemberUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_MEMBERS_CHUNK, listener: (payload: GatewayClientEvents.GuildMembersChunk) => any): EventSubscription;
  subscribe(event: 'guildMembersChunk', listener: (payload: GatewayClientEvents.GuildMembersChunk) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_READY, listener: (payload: GatewayClientEvents.GuildReady) => any): EventSubscription;
  subscribe(event: 'guildReady', listener: (payload: GatewayClientEvents.GuildReady) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_ROLE_CREATE, listener: (payload: GatewayClientEvents.GuildRoleCreate) => any): EventSubscription;
  subscribe(event: 'guildRoleCreate', listener: (payload: GatewayClientEvents.GuildRoleCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_ROLE_DELETE, listener: (payload: GatewayClientEvents.GuildRoleDelete) => any): EventSubscription;
  subscribe(event: 'guildRoleDelete', listener: (payload: GatewayClientEvents.GuildRoleDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_ROLE_UPDATE, listener: (payload: GatewayClientEvents.GuildRoleUpdate) => any): EventSubscription;
  subscribe(event: 'guildRoleUpdate', listener: (payload: GatewayClientEvents.GuildRoleUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.GUILD_UPDATE, listener: (payload: GatewayClientEvents.GuildUpdate) => any): EventSubscription;
  subscribe(event: 'guildUpdate', listener: (payload: GatewayClientEvents.GuildUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.INVITE_CREATE, listener: (payload: GatewayClientEvents.InviteCreate) => any): EventSubscription;
  subscribe(event: 'inviteCreate', listener: (payload: GatewayClientEvents.InviteCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.INVITE_DELETE, listener: (payload: GatewayClientEvents.InviteDelete) => any): EventSubscription;
  subscribe(event: 'inviteDelete', listener: (payload: GatewayClientEvents.InviteDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.LIBRARY_APPLICATION_UPDATE, listener: (payload: GatewayClientEvents.LibraryApplicationUpdate) => any): EventSubscription;
  subscribe(event: 'libraryApplicationUpdate', listener: (payload: GatewayClientEvents.LibraryApplicationUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_CREATE, listener: (payload: GatewayClientEvents.LobbyCreate) => any): EventSubscription;
  subscribe(event: 'lobbyCreate', listener: (payload: GatewayClientEvents.LobbyCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_DELETE, listener: (payload: GatewayClientEvents.LobbyDelete) => any): EventSubscription;
  subscribe(event: 'lobbyDelete', listener: (payload: GatewayClientEvents.LobbyDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_UPDATE, listener: (payload: GatewayClientEvents.LobbyUpdate) => any): EventSubscription;
  subscribe(event: 'lobbyUpdate', listener: (payload: GatewayClientEvents.LobbyUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_MEMBER_CONNECT, listener: (payload: GatewayClientEvents.LobbyMemberConnect) => any): EventSubscription;
  subscribe(event: 'lobbyMemberConnect', listener: (payload: GatewayClientEvents.LobbyMemberConnect) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_MEMBER_DISCONNECT, listener: (payload: GatewayClientEvents.LobbyMemberDisconnect) => any): EventSubscription;
  subscribe(event: 'lobbyMemberDisconnect', listener: (payload: GatewayClientEvents.LobbyMemberDisconnect) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_MEMBER_UPDATE, listener: (payload: GatewayClientEvents.LobbyMemberUpdate) => any): EventSubscription;
  subscribe(event: 'lobbyMemberUpdate', listener: (payload: GatewayClientEvents.LobbyMemberUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_MESSAGE, listener: (payload: GatewayClientEvents.LobbyMessage) => any): EventSubscription;
  subscribe(event: 'lobbyMessage', listener: (payload: GatewayClientEvents.LobbyMessage) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.LobbyVoiceServerUpdate) => any): EventSubscription;
  subscribe(event: 'lobbyVoiceServerUpdate', listener: (payload: GatewayClientEvents.LobbyVoiceServerUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.LOBBY_VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.LobbyVoiceStateUpdate) => any): EventSubscription;
  subscribe(event: 'lobbyVoiceStateUpdate', listener: (payload: GatewayClientEvents.LobbyVoiceStateUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_ACK, listener: (payload: GatewayClientEvents.MessageAck) => any): EventSubscription;
  subscribe(event: 'messageAck', listener: (payload: GatewayClientEvents.MessageAck) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_CREATE, listener: (payload: GatewayClientEvents.MessageCreate) => any): EventSubscription;
  subscribe(event: 'messageCreate', listener: (payload: GatewayClientEvents.MessageCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_DELETE, listener: (payload: GatewayClientEvents.MessageDelete) => any): EventSubscription;
  subscribe(event: 'messageDelete', listener: (payload: GatewayClientEvents.MessageDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_DELETE_BULK, listener: (payload: GatewayClientEvents.MessageDeleteBulk) => any): EventSubscription;
  subscribe(event: 'messageDeleteBulk', listener: (payload: GatewayClientEvents.MessageDeleteBulk) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_REACTION_ADD, listener: (payload: GatewayClientEvents.MessageReactionAdd) => any): EventSubscription;
  subscribe(event: 'messageReactionAdd', listener: (payload: GatewayClientEvents.MessageReactionAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_REACTION_REMOVE, listener: (payload: GatewayClientEvents.MessageReactionRemove) => any): EventSubscription;
  subscribe(event: 'messageReactionRemove', listener: (payload: GatewayClientEvents.MessageReactionRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_REACTION_REMOVE_ALL, listener: (payload: GatewayClientEvents.MessageReactionRemoveAll) => any): EventSubscription;
  subscribe(event: 'messageReactionRemoveAll', listener: (payload: GatewayClientEvents.MessageReactionRemoveAll) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_REACTION_REMOVE_EMOJI, listener: (payload: GatewayClientEvents.MessageReactionRemoveEmoji) => any): EventSubscription;
  subscribe(event: 'messageReactionRemoveEmoji', listener: (payload: GatewayClientEvents.MessageReactionRemoveEmoji) => any): EventSubscription;
  subscribe(event: ClientEvents.MESSAGE_UPDATE, listener: (payload: GatewayClientEvents.MessageUpdate) => any): EventSubscription;
  subscribe(event: 'messageUpdate', listener: (payload: GatewayClientEvents.MessageUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.PRESENCES_REPLACE, listener: (payload: GatewayClientEvents.PresencesReplace) => any): EventSubscription;
  subscribe(event: 'presencesReplace', listener: (payload: GatewayClientEvents.PresencesReplace) => any): EventSubscription;
  subscribe(event: ClientEvents.PRESENCE_UPDATE, listener: (payload: GatewayClientEvents.PresenceUpdate) => any): EventSubscription;
  subscribe(event: 'presenceUpdate', listener: (payload: GatewayClientEvents.PresenceUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.RECENT_MENTION_DELETE, listener: (payload: GatewayClientEvents.RecentMentionDelete) => any): EventSubscription;
  subscribe(event: 'recentMentionDelete', listener: (payload: GatewayClientEvents.RecentMentionDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.RELATIONSHIP_ADD, listener: (payload: GatewayClientEvents.RelationshipAdd) => any): EventSubscription;
  subscribe(event: 'relationshipAdd', listener: (payload: GatewayClientEvents.RelationshipAdd) => any): EventSubscription;
  subscribe(event: ClientEvents.RELATIONSHIP_REMOVE, listener: (payload: GatewayClientEvents.RelationshipRemove) => any): EventSubscription;
  subscribe(event: 'relationshipRemove', listener: (payload: GatewayClientEvents.RelationshipRemove) => any): EventSubscription;
  subscribe(event: ClientEvents.SESSIONS_REPLACE, listener: (payload: GatewayClientEvents.SessionsReplace) => any): EventSubscription;
  subscribe(event: 'sessionsReplace', listener: (payload: GatewayClientEvents.SessionsReplace) => any): EventSubscription;
  subscribe(event: ClientEvents.STAGE_INSTANCE_CREATE, listener: (payload: GatewayClientEvents.StageInstanceCreate) => any): EventSubscription;
  subscribe(event: 'stageInstanceCreate', listener: (payload: GatewayClientEvents.StageInstanceCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.STAGE_INSTANCE_DELETE, listener: (payload: GatewayClientEvents.StageInstanceDelete) => any): EventSubscription;
  subscribe(event: 'stageInstanceDelete', listener: (payload: GatewayClientEvents.StageInstanceDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.STAGE_INSTANCE_UPDATE, listener: (payload: GatewayClientEvents.StageInstanceUpdate) => any): EventSubscription;
  subscribe(event: 'stageInstanceUpdate', listener: (payload: GatewayClientEvents.StageInstanceUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.STREAM_CREATE, listener: (payload: GatewayClientEvents.StreamCreate) => any): EventSubscription;
  subscribe(event: 'streamCreate', listener: (payload: GatewayClientEvents.StreamCreate) => any): EventSubscription;
  subscribe(event: ClientEvents.STREAM_DELETE, listener: (payload: GatewayClientEvents.StreamDelete) => any): EventSubscription;
  subscribe(event: 'streamDelete', listener: (payload: GatewayClientEvents.StreamDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.STREAM_SERVER_UPDATE, listener: (payload: GatewayClientEvents.StreamServerUpdate) => any): EventSubscription;
  subscribe(event: 'streamServerUpdate', listener: (payload: GatewayClientEvents.StreamServerUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.STREAM_UPDATE, listener: (payload: GatewayClientEvents.StreamUpdate) => any): EventSubscription;
  subscribe(event: 'streamUpdate', listener: (payload: GatewayClientEvents.StreamUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.TYPING_START, listener: (payload: GatewayClientEvents.TypingStart) => any): EventSubscription;
  subscribe(event: 'typingStart', listener: (payload: GatewayClientEvents.TypingStart) => any): EventSubscription;
  subscribe(event: ClientEvents.TYPING_STOP, listener: (payload: GatewayClientEvents.TypingStop) => any): EventSubscription;
  subscribe(event: 'typingStop', listener: (payload: GatewayClientEvents.TypingStop) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_ACHIEVEMENT_UPDATE, listener: (payload: GatewayClientEvents.UserAchievementUpdate) => any): EventSubscription;
  subscribe(event: 'userAchievementUpdate', listener: (payload: GatewayClientEvents.UserAchievementUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_CONNECTIONS_UPDATE, listener: (payload: GatewayClientEvents.UserConnectionsUpdate) => any): EventSubscription;
  subscribe(event: 'userConnectionsUpdate', listener: (payload: GatewayClientEvents.UserConnectionsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_FEED_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.UserFeedSettingsUpdate) => any): EventSubscription;
  subscribe(event: 'userFeedSettingsUpdate', listener: (payload: GatewayClientEvents.UserFeedSettingsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_GUILD_SETTINGS_UPDATE, listener: (payload: GatewayClientEvents.UserGuildSettingsUpdate) => any): EventSubscription;
  subscribe(event: 'userGuildSettingsUpdate', listener: (payload: GatewayClientEvents.UserGuildSettingsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_NOTE_UPDATE, listener: (payload: GatewayClientEvents.UserNoteUpdate) => any): EventSubscription;
  subscribe(event: 'userNoteUpdate', listener: (payload: GatewayClientEvents.UserNoteUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_PAYMENT_SOURCES_UPDATE, listener: (payload: GatewayClientEvents.UserPaymentSourcesUpdate) => any): EventSubscription;
  subscribe(event: 'userPaymentSourcesUpdate', listener: (payload: GatewayClientEvents.UserPaymentSourcesUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_PAYMENTS_UPDATE, listener: (payload: GatewayClientEvents.UserPaymentsUpdate) => any): EventSubscription;
  subscribe(event: 'userPaymentsUpdate', listener: (payload: GatewayClientEvents.UserPaymentsUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_REQUIRED_ACTION_UPDATE, listener: (payload: GatewayClientEvents.UserRequiredActionUpdate) => any): EventSubscription;
  subscribe(event: 'userRequiredActionUpdate', listener: (payload: GatewayClientEvents.UserRequiredActionUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USER_UPDATE, listener: (payload: GatewayClientEvents.UserUpdate) => any): EventSubscription;
  subscribe(event: 'userUpdate', listener: (payload: GatewayClientEvents.UserUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.USERS_UPDATE, listener: (payload: GatewayClientEvents.UsersUpdate) => any): EventSubscription;
  subscribe(event: 'usersUpdate', listener: (payload: GatewayClientEvents.UsersUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.VOICE_SERVER_UPDATE, listener: (payload: GatewayClientEvents.VoiceServerUpdate) => any): EventSubscription;
  subscribe(event: 'voiceServerUpdate', listener: (payload: GatewayClientEvents.VoiceServerUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.VOICE_STATE_UPDATE, listener: (payload: GatewayClientEvents.VoiceStateUpdate) => any): EventSubscription;
  subscribe(event: 'voiceStateUpdate', listener: (payload: GatewayClientEvents.VoiceStateUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.WEBHOOKS_UPDATE, listener: (payload: GatewayClientEvents.WebhooksUpdate) => any): EventSubscription;
  subscribe(event: 'webhooksUpdate', listener: (payload: GatewayClientEvents.WebhooksUpdate) => any): EventSubscription;
  subscribe(event: ClientEvents.RAW, listener: (payload: GatewayClientEvents.Raw) => any): EventSubscription;
  subscribe(event: 'raw', listener: (payload: GatewayClientEvents.Raw) => any): EventSubscription;
  subscribe(event: ClientEvents.REST_REQUEST, listener: (payload: GatewayClientEvents.RestRequest) => any): EventSubscription;
  subscribe(event: 'restRequest', listener: (payload: GatewayClientEvents.RestRequest) => any): EventSubscription;
  subscribe(event: ClientEvents.REST_RESPONSE, listener: (payload: GatewayClientEvents.RestResponse) => any): EventSubscription;
  subscribe(event: 'restResponse', listener: (payload: GatewayClientEvents.RestResponse) => any): EventSubscription;
  subscribe(event: ClientEvents.UNKNOWN, listener: (payload: GatewayClientEvents.Unknown) => any): EventSubscription;
  subscribe(event: 'unknown', listener: (payload: GatewayClientEvents.Unknown) => any): EventSubscription;
  subscribe(event: ClientEvents.WARN, listener: (payload: GatewayClientEvents.Warn) => any): EventSubscription;
  subscribe(event: 'warn', listener: (payload: GatewayClientEvents.Warn) => any): EventSubscription;
  subscribe(event: ClientEvents.KILLED, listener: (payload: GatewayClientEvents.Killed) => any): EventSubscription;
  subscribe(event: 'killed', listener: (payload: GatewayClientEvents.Killed) => any): EventSubscription;
  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription {
    return super.subscribe(event, listener);
  }
}
