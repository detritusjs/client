import {
  ClientOptions as RestOptions,
  Constants as RestConstants,
  Endpoints,
} from 'detritus-client-rest';
import { Gateway } from 'detritus-client-socket';


import { ClusterClient } from './clusterclient';
import { CommandClient } from './commandclient';
import {
  ClientEvents,
  ImageFormats,
  IMAGE_FORMATS,
} from './constants';
import EventEmitter from './eventemitter';
import {
  GatewayHandler,
  GatewayHandlerOptions,
} from './gateway/handler';
import { GatewayClientEvents } from './gateway/clientevents';
import { RestClient } from './rest';

import { BaseCollection } from './collections/basecollection';
import {
  Applications,
  ApplicationsOptions,
  Channels,
  ChannelsOptions,
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
  User,
  UserMe,
} from './structures';


interface GatewayOptions extends Gateway.SocketOptions, GatewayHandlerOptions {

}

export interface ShardClientOptions {
  cache?: {
    applications?: ApplicationsOptions,
    channels?: ChannelsOptions,
    emojis?: EmojisOptions,
    guilds?: GuildsOptions,
    members?: MembersOptions,
    messages?: MessagesOptions,
    notes?: NotesOptions,
    presences?: PresencesOptions,
    relationships?: RelationshipsOptions,
    sessions?: SessionsOptions,
    typing?: TypingOptions,
    users?: UsersOptions,
    voiceCalls?: VoiceCallsOptions,
    voiceConnections?: VoiceConnectionsOptions,
    voiceStates?: VoiceStatesOptions,
  },
  gateway?: GatewayOptions,
  imageFormat?: string,
  isBot?: boolean,
  rest?: RestOptions,
  pass?: {
    cluster?: ClusterClient,
    commandClient?: CommandClient,
    applications?: Applications,
    channels?: Channels,
    emojis?: Emojis,
    guilds?: Guilds,
    members?: Members,
    messages?: Messages,
    notes?: Notes,
    presences?: Presences,
    relationships?: Relationships,
    sessions?: Sessions,
    typing?: TypingCollection,
    users?: Users,
    voiceCalls?: VoiceCalls,
    voiceConnections?: VoiceConnections,
    voiceStates?: VoiceStates,
  },
}

export interface ShardClientRunOptions {
  applications?: boolean,
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
export class ShardClient extends EventEmitter {
  /**
   * @ignore
   */
  _isBot: boolean = true;

  cluster: ClusterClient | null = null;
  commandClient: CommandClient | null = null;

  /** Default Image Format to use for any url getters*/
  imageFormat: string = ImageFormats.PNG;

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

  /** `detritus-client-rest`'s Rest Client, but wrapped over */
  rest: RestClient;

  /** our token */
  token: string;

  /** Us, only fills once we received the Ready payload from the gateway */
  user: null | UserMe = null;

  readonly applications: Applications;
  readonly channels: Channels;
  readonly emojis: Emojis;
  readonly guilds: Guilds;
  readonly members: Members;
  readonly messages: Messages;
  readonly notes: Notes;
  readonly presences: Presences;
  readonly relationships: Relationships;
  readonly sessions: Sessions;
  readonly typing: TypingCollection;
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
      authType: (options.isBot) ? RestConstants.AuthTypes.BOT : RestConstants.AuthTypes.USER,
    }, options.rest), this);

    if (options.isBot !== undefined) {
      this._isBot = !!options.isBot;
    }
    if (options.imageFormat !== undefined) {
      options.imageFormat = (<string> options.imageFormat).toLowerCase();
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

    this.applications = options.pass.applications || new Applications(this, options.cache.applications);
    this.channels = options.pass.channels || new Channels(this, options.cache.channels);
    this.emojis = options.pass.emojis || new Emojis(this, options.cache.emojis);
    this.guilds = options.pass.guilds || new Guilds(this, options.cache.guilds);
    this.members = options.pass.members || new Members(this, options.cache.members);
    this.messages = options.pass.messages || new Messages(this, options.cache.messages);
    this.notes = options.pass.notes || new Notes(this, options.cache.notes);
    this.presences = options.pass.presences || new Presences(this, options.cache.presences);
    this.relationships = options.pass.relationships || new Relationships(this, options.cache.relationships);
    this.sessions = options.pass.sessions || new Sessions(this, options.cache.sessions);
    this.typing = options.pass.typing || new TypingCollection(this, options.cache.typing);
    this.users = options.pass.users || new Users(this, options.cache.users);
    this.voiceCalls = options.pass.voiceCalls || new VoiceCalls(this, options.cache.voiceCalls);
    this.voiceConnections = options.pass.voiceConnections || new VoiceConnections(this, options.cache.voiceConnections);
    this.voiceStates = options.pass.voiceStates || new VoiceStates(this, options.cache.voiceStates);
  }

  get isBot(): boolean {
    if (this.user == null) {
      return this._isBot;
    }
    return this.user.bot;
  }

  get shardCount(): number {
    return this.gateway.shardCount;
  }

  get shardId(): number {
    return this.gateway.shardId;
  }

  isOwner(userId: string): boolean {
    return this.owners.has(userId);
  }

  kill(): void {
    this.gateway.kill();
    this.reset();
    if (this.cluster !== null) {
      // TODO remove
      //this.cluster.shards.delete(this.shardId);
    }
    this.emit('killed');
    this.clearListeners();
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
    this.channels.clear(this.shardId);
    this.emojis.clear(this.shardId);
    this.guilds.clear(this.shardId);
    this.members.clear(this.shardId);
    this.messages.clear(this.shardId);
    this.notes.clear(this.shardId);
    this.presences.clear(this.shardId);
    this.relationships.clear(this.shardId);
    this.sessions.clear(this.shardId);
    this.users.clear(this.shardId);
    this.voiceConnections.clear(this.shardId);
    this.voiceStates.clear(this.shardId);
  }

  async run(
    options: ShardClientRunOptions = {},
  ): Promise<ShardClient> {
    const fetchApplications = options.applications || options.applications === undefined;
    const wait = options.wait || options.wait === undefined;

    let url: string;
    if (options.url) {
      url = <string> options.url;
    } else {
      const data = await this.rest.fetchGateway();
      url = data.url;
    }

    this.gateway.connect(url);
    return new Promise((resolve) => {
      if (wait) {
        this.once(ClientEvents.GATEWAY_READY, resolve);
      } else {
        resolve();
      }
    }).then(() => {
      Object.defineProperty(this, 'ran', {value: true});
      if (fetchApplications) {
        this.applications.fill().catch((error: any) => {
          this.emit('warn', error);
        });
      }
      return this;
    });
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

  on(event: string, listener: Function): this;
  on(event: 'ACTIVITY_JOIN_INVITE', listener: (payload: GatewayClientEvents.ActivityJoinInvite) => any): this;
  on(event: 'ACTIVITY_JOIN_REQUEST', listener: (payload: GatewayClientEvents.ActivityJoinRequest) => any): this;
  on(event: 'ACTIVITY_START', listener: (payload: GatewayClientEvents.ActivityStart) => any): this;
  on(event: 'BRAINTREE_POPUP_BRIDGE_CALLBACK', listener: (payload: GatewayClientEvents.BraintreePopupBridgeCallback) => any): this;
  on(event: 'CALL_CREATE', listener: (payload: GatewayClientEvents.CallCreate) => any): this;
  on(event: 'CALL_DELETE', listener: (payload: GatewayClientEvents.CallDelete) => any): this;
  on(event: 'CALL_UPDATE', listener: (payload: GatewayClientEvents.CallUpdate) => any): this;
  on(event: 'CHANNEL_CREATE', listener: (payload: GatewayClientEvents.ChannelCreate) => any): this;
  on(event: 'CHANNEL_DELETE', listener: (payload: GatewayClientEvents.ChannelDelete) => any): this;
  on(event: 'CHANNEL_PINS_ACK', listener: (payload: GatewayClientEvents.ChannelPinsAck) => any): this;
  on(event: 'CHANNEL_PINS_UPDATE', listener: (payload: GatewayClientEvents.ChannelPinsUpdate) => any): this;
  on(event: 'CHANNEL_UPDATE', listener: (payload: GatewayClientEvents.ChannelUpdate) => any): this;
  on(event: 'CHANNEL_RECIPIENT_ADD', listener: (payload: GatewayClientEvents.ChannelRecipientAdd) => any): this;
  on(event: 'CHANNEL_RECIPIENT_REMOVE', listener: (payload: GatewayClientEvents.ChannelRecipientRemove) => any): this;
  on(event: 'ENTITLEMENT_CREATE', listener: (payload: GatewayClientEvents.EntitlementCreate) => any): this;
  on(event: 'ENTITLEMENT_DELETE', listener: (payload: GatewayClientEvents.EntitlementDelete) => any): this;
  on(event: 'ENTITLEMENT_UPDATE', listener: (payload: GatewayClientEvents.EntitlementUpdate) => any): this;
  on(event: 'FRIEND_SUGGESTION_CREATE', listener: (payload: GatewayClientEvents.FriendSuggestionCreate) => any): this;
  on(event: 'FRIEND_SUGGESTION_DELETE', listener: (payload: GatewayClientEvents.FriendSuggestionDelete) => any): this;
  on(event: 'GATEWAY_READY', listener: (payload: GatewayClientEvents.GatewayReady) => any): this;
  on(event: 'GATEWAY_RESUMED', listener: (payload: GatewayClientEvents.GatewayResumed) => any): this;
  on(event: 'GIFT_CODE_UPDATE', listener: (payload: GatewayClientEvents.GiftCodeUpdate) => any): this;
  on(event: 'GUILD_BAN_ADD', listener: (payload: GatewayClientEvents.GuildBanAdd) => any): this;
  on(event: 'GUILD_BAN_REMOVE', listener: (payload: GatewayClientEvents.GuildBanRemove) => any): this;
  on(event: 'GUILD_CREATE', listener: (payload: GatewayClientEvents.GuildCreate) => any): this;
  on(event: 'GUILD_DELETE', listener: (payload: GatewayClientEvents.GuildDelete) => any): this;
  on(event: 'GUILD_EMOJIS_UPDATE', listener: (payload: GatewayClientEvents.GuildEmojisUpdate) => any): this;
  on(event: 'GUILD_INTEGRATIONS_UPDATE', listener: (payload: GatewayClientEvents.GuildIntegrationsUpdate) => any): this;
  on(event: 'GUILD_MEMBER_ADD', listener: (payload: GatewayClientEvents.GuildMemberAdd) => any): this;
  on(event: 'GUILD_MEMBER_LIST_UPDATE', listener: (payload: GatewayClientEvents.GuildMemberListUpdate) => any): this;
  on(event: 'GUILD_MEMBER_REMOVE', listener: (payload: GatewayClientEvents.GuildMemberRemove) => any): this;
  on(event: 'GUILD_MEMBER_UPDATE', listener: (payload: GatewayClientEvents.GuildMemberUpdate) => any): this;
  on(event: 'GUILD_MEMBERS_CHUNK', listener: (payload: GatewayClientEvents.GuildMembersChunk) => any): this;
  on(event: 'GUILD_ROLE_CREATE', listener: (payload: GatewayClientEvents.GuildRoleCreate) => any): this;
  on(event: 'GUILD_ROLE_DELETE', listener: (payload: GatewayClientEvents.GuildRoleDelete) => any): this;
  on(event: 'GUILD_ROLE_UPDATE', listener: (payload: GatewayClientEvents.GuildRoleUpdate) => any): this;
  on(event: 'GUILD_UPDATE', listener: (payload: GatewayClientEvents.GuildUpdate) => any): this;
  on(event: 'LIBRARY_APPLICATION_UPDATE', listener: (payload: GatewayClientEvents.LibraryApplicationUpdate) => any): this;
  on(event: 'LOBBY_CREATE', listener: (payload: GatewayClientEvents.LobbyCreate) => any): this;
  on(event: 'LOBBY_DELETE', listener: (payload: GatewayClientEvents.LobbyDelete) => any): this;
  on(event: 'LOBBY_UPDATE', listener: (payload: GatewayClientEvents.LobbyUpdate) => any): this;
  on(event: 'LOBBY_MEMBER_DISCONNECT', listener: (payload: GatewayClientEvents.LobbyMemberDisconnect) => any): this;
  on(event: 'LOBBY_MEMBER_UPDATE', listener: (payload: GatewayClientEvents.LobbyMemberUpdate) => any): this;
  on(event: 'LOBBY_MESSAGE', listener: (payload: GatewayClientEvents.LobbyMessage) => any): this;
  on(event: 'LOBBY_VOICE_SERVER_UPDATE', listener: (payload: GatewayClientEvents.LobbyVoiceServerUpdate) => any): this;
  on(event: 'LOBBY_VOICE_STATE_UPDATE', listener: (payload: GatewayClientEvents.LobbyVoiceStateUpdate) => any): this;
  on(event: 'MESSAGE_ACK', listener: (payload: GatewayClientEvents.MessageAck) => any): this;
  on(event: 'MESSAGE_CREATE', listener: (payload: GatewayClientEvents.MessageCreate) => any): this;
  on(event: 'MESSAGE_DELETE', listener: (payload: GatewayClientEvents.MessageDelete) => any): this;
  on(event: 'MESSAGE_DELETE_BULK', listener: (payload: GatewayClientEvents.MessageDeleteBulk) => any): this;
  on(event: 'MESSAGE_REACTION_ADD', listener: (payload: GatewayClientEvents.MessageReactionAdd) => any): this;
  on(event: 'MESSAGE_REACTION_REMOVE', listener: (payload: GatewayClientEvents.MessageReactionRemove) => any): this;
  on(event: 'MESSAGE_REACTION_REMOVE_ALL', listener: (payload: GatewayClientEvents.MessageReactionRemoveAll) => any): this;
  on(event: 'MESSAGE_UPDATE', listener: (payload: GatewayClientEvents.MessageUpdate) => any): this;
  on(event: 'OAUTH2_TOKEN_REVOKE', listener: (payload: GatewayClientEvents.Oauth2TokenRevoke) => any): this;
  on(event: 'PRESENCE_UPDATE', listener: (payload: GatewayClientEvents.PresenceUpdate) => any): this;
  on(event: 'PRESENCES_REPLACE', listener: (payload: GatewayClientEvents.PresencesReplace) => any): this;
  on(event: 'RECENT_MENTION_DELETE', listener: (payload: GatewayClientEvents.RecentMentionDelete) => any): this;
  on(event: 'RELATIONSHIP_ADD', listener: (payload: GatewayClientEvents.RelationshipAdd) => any): this;
  on(event: 'RELATIONSHIP_REMOVE', listener: (payload: GatewayClientEvents.RelationshipRemove) => any): this;
  on(event: 'SESSIONS_UPDATE', listener: (payload: GatewayClientEvents.SessionsUpdate) => any): this;
  on(event: 'STREAM_CREATE', listener: (payload: GatewayClientEvents.StreamCreate) => any): this;
  on(event: 'STREAM_DELETE', listener: (payload: GatewayClientEvents.StreamDelete) => any): this;
  on(event: 'STREAM_SERVER_UPDATE', listener: (payload: GatewayClientEvents.StreamServerUpdate) => any): this;
  on(event: 'STREAM_UPDATE', listener: (payload: GatewayClientEvents.StreamUpdate) => any): this;
  on(event: 'TYPING_START', listener: (payload: GatewayClientEvents.TypingStart) => any): this;
  on(event: 'USER_ACHIEVEMENT_UPDATE', listener: (payload: GatewayClientEvents.UserAchievementUpdate) => any): this;
  on(event: 'USER_CONNECTIONS_UPDATE', listener: (payload: GatewayClientEvents.UserConnectionsUpdate) => any): this;
  on(event: 'USER_FEED_SETTINGS_UPDATE', listener: (payload: GatewayClientEvents.UserFeedSettingsUpdate) => any): this;
  on(event: 'USER_GUILD_SETTINGS_UPDATE', listener: (payload: GatewayClientEvents.UserGuildSettingsUpdate) => any): this;
  on(event: 'USER_NOTE_UPDATE', listener: (payload: GatewayClientEvents.UserNoteUpdate) => any): this;
  on(event: 'USER_PAYMENT_SOURCES_UPDATE', listener: (payload: GatewayClientEvents.UserPaymentSourcesUpdate) => any): this;
  on(event: 'USER_PAYMENTS_UPDATE', listener: (payload: GatewayClientEvents.UserPaymentsUpdate) => any): this;
  on(event: 'USER_UPDATE', listener: (payload: GatewayClientEvents.UserUpdate) => any): this;
  on(event: 'VOICE_SERVER_UPDATE', listener: (payload: GatewayClientEvents.VoiceServerUpdate) => any): this;
  on(event: 'VOICE_STATE_UPDATE', listener: (payload: GatewayClientEvents.VoiceStateUpdate) => any): this;
  on(event: 'WEBHOOKS_UPDATE', listener: (payload: GatewayClientEvents.WebhooksUpdate) => any): this;
  on(event: string, listener: Function): this {
    super.on(event, listener);
    return this;
  }
}
