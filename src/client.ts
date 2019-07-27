import {
  ClientOptions as RestOptions,
  Constants as RestConstants,
  Endpoints,
} from 'detritus-client-rest';
import { Gateway } from 'detritus-client-socket';

import {
  ClientEvents,
  ImageFormats,
  IMAGE_FORMATS,
} from './constants';
import EventEmitter from './eventemitter';
import {
  Handler as GatewayHandler,
  HandlerOptions as GatewayHandlerOptions,
} from './gateway/handler';
import { Client as RestClient } from './rest';

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

export interface ClientOptions {
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

export interface ClientRunOptions {
  applications?: boolean,
  url?: string,
  wait?: boolean,
}

const defaults = {
  imageFormat: ImageFormats.PNG,
  isBot: true,
};

export class Client extends EventEmitter {
  _isBot: boolean = defaults.isBot;
  cluster: null = null;
  imageFormat: string = defaults.imageFormat;
  gateway: Gateway.Socket;
  gatewayHandler: GatewayHandler;
  owners = new BaseCollection<string, User>();
  ran: boolean = false;
  rest: RestClient;
  token: string;
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
    options: ClientOptions = {},
  ) {
    super();

    options = Object.assign({}, defaults, options);
    if (options.cache === undefined) {
      options.cache = {};
    }
    if (options.pass === undefined) {
      options.pass = {};
    }
    this.cluster = null;
    this.gateway = new Gateway.Socket(token, options.gateway);
    this.gatewayHandler = new GatewayHandler(this, options.gateway);
    this.rest = new RestClient(token, Object.assign({
      authType: (options.isBot) ? RestConstants.AuthTypes.BOT : RestConstants.AuthTypes.USER,
    }, options.rest), this);

    options.imageFormat = (<string> options.imageFormat).toLowerCase();
    if (!IMAGE_FORMATS.includes(options.imageFormat)) {
      throw new Error(`Image format must be one of ${JSON.stringify(IMAGE_FORMATS)}`);
    }
  
    this._isBot = !!options.isBot;
    this.imageFormat = options.imageFormat;
    this.token = token;

    Object.defineProperties(this, {
      _isBot: {configurable: true, enumerable: false, writable: false},
      cluster: {enumerable: false, writable: false},
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
    if (this.user === null) {
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
    options: ClientRunOptions = {},
  ): Promise<Client> {
    const fetchApplications = options.applications || options.applications === undefined;
    const wait = options.wait || options.wait === undefined;

    let url: string;
    if (options.url) {
      url = <string> options.url;
    } else {
      url = <string> (await this.rest.fetchGateway()).url;
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
