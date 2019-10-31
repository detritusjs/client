import { ClientOptions as RestOptions, Endpoints } from 'detritus-client-rest';
import { Gateway } from 'detritus-client-socket';
import { EventSpewer } from 'detritus-utils';


import { ClusterClient } from './clusterclient';
import { CommandClient } from './commandclient';
import {
  AuthTypes,
  ClientEvents,
  ImageFormats,
  IMAGE_FORMATS,
} from './constants';
import { GatewayHandler, GatewayHandlerOptions } from './gateway/handler';
import { GatewayClientEvents } from './gateway/clientevents';
import { RestClient } from './rest';

import { BaseCollection } from './collections/basecollection';
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
  Oauth2Application,
  User,
  UserMe,
} from './structures';


interface GatewayOptions extends Gateway.SocketOptions, GatewayHandlerOptions {

}

export interface ShardClientOptions {
  cache?: {
    applications?: ApplicationsOptions,
    channels?: ChannelsOptions,
    connectedAccounts?: ConnectedAccountsOptions,
    emojis?: EmojisOptions,
    guilds?: GuildsOptions,
    members?: MembersOptions,
    messages?: MessagesOptions,
    notes?: NotesOptions,
    presences?: PresencesOptions,
    relationships?: RelationshipsOptions,
    roles?: RolesOptions,
    sessions?: SessionsOptions,
    typings?: TypingOptions,
    users?: UsersOptions,
    voiceCalls?: VoiceCallsOptions,
    voiceConnections?: VoiceConnectionsOptions,
    voiceStates?: VoiceStatesOptions,
  } | boolean,
  gateway?: GatewayOptions,
  imageFormat?: ImageFormats,
  isBot?: boolean,
  rest?: RestOptions,
  pass?: {
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
    typings?: TypingCollection,
    users?: Users,
    voiceCalls?: VoiceCalls,
    voiceConnections?: VoiceConnections,
    voiceStates?: VoiceStates,
  },
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
      options.imageFormat = <ImageFormats> <unknown> options.imageFormat.toLowerCase();
      if (!IMAGE_FORMATS.includes(options.imageFormat)) {
        throw new Error(`Image format must be one of ${JSON.stringify(IMAGE_FORMATS)}`);
      }
      this.imageFormat = options.imageFormat;
    }

    Object.defineProperties(this, {
      _isBot: {configurable: true, enumerable: false, writable: false},
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
    return this.gateway.killed;
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

  isOwner(userId: string): boolean {
    return this.owners.has(userId);
  }

  kill(error?: Error): void {
    if (!this.killed) {
      this.gateway.kill(error);
      this.reset();
      if (this.cluster) {
        // must be a better way to handle this
        // maybe kill the entire cluster?
        this.cluster.shards.delete(this.shardId);
      }
      this.emit(ClientEvents.KILLED, {error});
      this.rest.removeAllListeners();
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

  reset(): void {
    this.owners.clear();

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
      await new Promise((resolve) => {
        this.once(ClientEvents.GATEWAY_READY, resolve);
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
    const serverId = <string> (guildId || channelId);
    if (gateway) {
      if (this.voiceConnections.has(serverId)) {
        return {
          connection: <VoiceConnection> this.voiceConnections.get(serverId),
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
        (<VoiceConnection> this.voiceConnections.get(serverId)).kill();
      }
    }
    return null;
  }

  toString(): string {
    return `Detritus Client (Shard ${this.shardId})`;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: 'activityJoinInvite', listener: (payload: GatewayClientEvents.ActivityJoinInvite) => any): this;
  on(event: 'activityJoinRequest', listener: (payload: GatewayClientEvents.ActivityJoinRequest) => any): this;
  on(event: 'activityStart', listener: (payload: GatewayClientEvents.ActivityStart) => any): this;
  on(event: 'braintreePopupBridgeCallback', listener: (payload: GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  on(event: 'callCreate', listener: (payload: GatewayClientEvents.CallCreate) => any): this;
  on(event: 'callDelete', listener: (payload: GatewayClientEvents.CallDelete) => any): this;
  on(event: 'callUpdate', listener: (payload: GatewayClientEvents.CallUpdate) => any): this;
  on(event: 'channelCreate', listener: (payload: GatewayClientEvents.ChannelCreate) => any): this;
  on(event: 'channelDelete', listener: (payload: GatewayClientEvents.ChannelDelete) => any): this;
  on(event: 'channelPinsAck', listener: (payload: GatewayClientEvents.ChannelPinsAck) => any): this;
  on(event: 'channelPinsUpdate', listener: (payload: GatewayClientEvents.ChannelPinsUpdate) => any): this;
  on(event: 'channelUpdate', listener: (payload: GatewayClientEvents.ChannelUpdate) => any): this;
  on(event: 'channelRecipientAdd', listener: (payload: GatewayClientEvents.ChannelRecipientAdd) => any): this;
  on(event: 'channelRecipientRemove', listener: (payload: GatewayClientEvents.ChannelRecipientRemove) => any): this;
  on(event: 'entitlementCreate', listener: (payload: GatewayClientEvents.EntitlementCreate) => any): this;
  on(event: 'entitlementDelete', listener: (payload: GatewayClientEvents.EntitlementDelete) => any): this;
  on(event: 'entitlementUpdate', listener: (payload: GatewayClientEvents.EntitlementUpdate) => any): this;
  on(event: 'friendSuggestionCreate', listener: (payload: GatewayClientEvents.FriendSuggestionCreate) => any): this;
  on(event: 'friendSuggestionDelete', listener: (payload: GatewayClientEvents.FriendSuggestionDelete) => any): this;
  on(event: 'gatewayReady', listener: (payload: GatewayClientEvents.GatewayReady) => any): this;
  on(event: 'gatewayResumed', listener: (payload: GatewayClientEvents.GatewayResumed) => any): this;
  on(event: 'giftCodeUpdate', listener: (payload: GatewayClientEvents.GiftCodeUpdate) => any): this;
  on(event: 'guildBanAdd', listener: (payload: GatewayClientEvents.GuildBanAdd) => any): this;
  on(event: 'guildBanRemove', listener: (payload: GatewayClientEvents.GuildBanRemove) => any): this;
  on(event: 'guildCreate', listener: (payload: GatewayClientEvents.GuildCreate) => any): this;
  on(event: 'guildDelete', listener: (payload: GatewayClientEvents.GuildDelete) => any): this;
  on(event: 'guildEmojisUpdate', listener: (payload: GatewayClientEvents.GuildEmojisUpdate) => any): this;
  on(event: 'guildIntegrationsUpdate', listener: (payload: GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  on(event: 'guildMemberAdd', listener: (payload: GatewayClientEvents.GuildMemberAdd) => any): this;
  on(event: 'guildMemberListUpdate', listener: (payload: GatewayClientEvents.GuildMemberListUpdate) => any): this;
  on(event: 'guildMemberRemove', listener: (payload: GatewayClientEvents.GuildMemberRemove) => any): this;
  on(event: 'guildMemberUpdate', listener: (payload: GatewayClientEvents.GuildMemberUpdate) => any): this;
  on(event: 'guildMembersChunk', listener: (payload: GatewayClientEvents.GuildMembersChunk) => any): this;
  on(event: 'guildRoleCreate', listener: (payload: GatewayClientEvents.GuildRoleCreate) => any): this;
  on(event: 'guildRoleDelete', listener: (payload: GatewayClientEvents.GuildRoleDelete) => any): this;
  on(event: 'guildRoleUpdate', listener: (payload: GatewayClientEvents.GuildRoleUpdate) => any): this;
  on(event: 'guildUpdate', listener: (payload: GatewayClientEvents.GuildUpdate) => any): this;
  on(event: 'libraryApplicationUpdate', listener: (payload: GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  on(event: 'lobbyCreate', listener: (payload: GatewayClientEvents.LobbyCreate) => any): this;
  on(event: 'lobbyDelete', listener: (payload: GatewayClientEvents.LobbyDelete) => any): this;
  on(event: 'lobbyUpdate', listener: (payload: GatewayClientEvents.LobbyUpdate) => any): this;
  on(event: 'lobbyMemberDisconnect', listener: (payload: GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  on(event: 'lobbyMemberUpdate', listener: (payload: GatewayClientEvents.LobbyMemberUpdate) => any): this;
  on(event: 'lobbyMessage', listener: (payload: GatewayClientEvents.LobbyMessage) => any): this;
  on(event: 'lobbyVoiceServerUpdate', listener: (payload: GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  on(event: 'lobbyVoiceStateUpdate', listener: (payload: GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  on(event: 'messageAck', listener: (payload: GatewayClientEvents.MessageAck) => any): this;
  on(event: 'messageCreate', listener: (payload: GatewayClientEvents.MessageCreate) => any): this;
  on(event: 'messageDelete', listener: (payload: GatewayClientEvents.MessageDelete) => any): this;
  on(event: 'messageDeleteBulk', listener: (payload: GatewayClientEvents.MessageDeleteBulk) => any): this;
  on(event: 'messageReactionAdd', listener: (payload: GatewayClientEvents.MessageReactionAdd) => any): this;
  on(event: 'messageReactionRemove', listener: (payload: GatewayClientEvents.MessageReactionRemove) => any): this;
  on(event: 'messageReactionRemoveAll', listener: (payload: GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  on(event: 'messageUpdate', listener: (payload: GatewayClientEvents.MessageUpdate) => any): this;
  on(event: 'oauth2TokenRevoke', listener: (payload: GatewayClientEvents.Oauth2TokenRevoke) => any): this;
  on(event: 'presenceUpdate', listener: (payload: GatewayClientEvents.PresenceUpdate) => any): this;
  on(event: 'presencesReplace', listener: (payload: GatewayClientEvents.PresencesReplace) => any): this;
  on(event: 'recentMentionDelete', listener: (payload: GatewayClientEvents.RecentMentionDelete) => any): this;
  on(event: 'relationshipAdd', listener: (payload: GatewayClientEvents.RelationshipAdd) => any): this;
  on(event: 'relationshipRemove', listener: (payload: GatewayClientEvents.RelationshipRemove) => any): this;
  on(event: 'sessionsReplace', listener: (payload: GatewayClientEvents.SessionsReplace) => any): this;
  on(event: 'streamCreate', listener: (payload: GatewayClientEvents.StreamCreate) => any): this;
  on(event: 'streamDelete', listener: (payload: GatewayClientEvents.StreamDelete) => any): this;
  on(event: 'streamServerUpdate', listener: (payload: GatewayClientEvents.StreamServerUpdate) => any): this;
  on(event: 'streamUpdate', listener: (payload: GatewayClientEvents.StreamUpdate) => any): this;
  on(event: 'typingStart', listener: (payload: GatewayClientEvents.TypingStart) => any): this;
  on(event: 'typingStop', listener: (payload: GatewayClientEvents.TypingStop) => any): this;
  on(event: 'userAchievementUpdate', listener: (payload: GatewayClientEvents.UserAchievementUpdate) => any): this;
  on(event: 'userConnectionsUpdate', listener: (payload: GatewayClientEvents.UserConnectionsUpdate) => any): this;
  on(event: 'userFeedSettingsUpdate', listener: (payload: GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  on(event: 'userGuildSettingsUpdate', listener: (payload: GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  on(event: 'userNoteUpdate', listener: (payload: GatewayClientEvents.UserNoteUpdate) => any): this;
  on(event: 'userPaymentSourcesUpdate', listener: (payload: GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  on(event: 'userPaymentsUpdate', listener: (payload: GatewayClientEvents.UserPaymentsUpdate) => any): this;
  on(event: 'userUpdate', listener: (payload: GatewayClientEvents.UserUpdate) => any): this;
  on(event: 'voiceServerUpdate', listener: (payload: GatewayClientEvents.VoiceServerUpdate) => any): this;
  on(event: 'voiceStateUpdate', listener: (payload: GatewayClientEvents.VoiceStateUpdate) => any): this;
  on(event: 'webhooksUpdate', listener: (payload: GatewayClientEvents.WebhooksUpdate) => any): this;
  on(event: 'raw', listener: (payload: GatewayClientEvents.Raw) => any): this;
  on(event: 'restRequest', listener: (payload: GatewayClientEvents.RestRequest) => any): this;
  on(event: 'restResponse', listener: (payload: GatewayClientEvents.RestResponse) => any): this;
  on(event: 'unknown', listener: (payload: GatewayClientEvents.Unknown) => any): this;
  on(event: 'warn', listener: (payload: GatewayClientEvents.Warn) => any): this;
  on(event: 'killed', listener: (payload: GatewayClientEvents.Killed) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
