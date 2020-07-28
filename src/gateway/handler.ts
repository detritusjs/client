import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  AuthTypes,
  ClientEvents,
  GatewayDispatchEvents,
  GatewayOpCodes,
  PresenceStatuses,
} from '../constants';
import { GatewayHTTPError } from '../errors';

import {
  createChannelFromData,
  Channel,
  ChannelDM,
  ConnectedAccount,
  Emoji,
  Guild,
  Invite,
  Member,
  Message,
  Presence,
  Reaction,
  Relationship,
  Role,
  Session,
  Typing,
  User,
  UserMe,
  VoiceCall,
  VoiceState,
} from '../structures';

import { GatewayClientEvents } from './clientevents';
import { GatewayRawEvents } from './rawevents';


export interface GatewayHandlerOptions {
  disabledEvents?: Array<string>,
  loadAllMembers?: boolean,
  whitelistedEvents?: Array<string>,
}

export interface ChunkWaiting {
  members: BaseCollection<string, Member>,
  notFound: BaseSet<string>,
  presences: BaseCollection<string, Presence>,
  promise: {reject: Function, resolve: Function, wait: Promise<unknown>},
  waiting: number,
}

/**
 * Gateway Handler
 * @category Handler
 */
export class GatewayHandler {
  readonly client: ShardClient;
  readonly _chunksWaiting = new BaseCollection<string, ChunkWaiting>();

  disabledEvents: BaseSet<string>;
  dispatchHandler: GatewayDispatchHandler;
  loadAllMembers: boolean = false;

  // I've witnessed some duplicate events happening with almost a second in between
  // Some member add/remove events might not even happen due to "State Repair"
  duplicateMemberEventsCache = new BaseCollection<string, string>({expire: 2000});

  constructor(
    client: ShardClient,
    options: GatewayHandlerOptions = {},
  ) {
    this.client = client;
    this.client.gateway.on('killed', this.onKilled.bind(this));
    this.client.gateway.on('packet', this.onPacket.bind(this));

    this.dispatchHandler = new GatewayDispatchHandler(this);
    this.disabledEvents = new BaseSet((options.disabledEvents || []).map((v) => {
      return v.toUpperCase();
    }));
    this.loadAllMembers = !!options.loadAllMembers;

    if (options.whitelistedEvents) {
      this.disabledEvents.clear();
      for (let event of Object.values(GatewayDispatchEvents)) {
        this.disabledEvents.add(event);
      }
      for (let event of options.whitelistedEvents) {
        this.disabledEvents.delete(event.toUpperCase());
      }
    }
    this.disabledEvents.delete(GatewayDispatchEvents.READY);
  }

  get shouldLoadAllMembers(): boolean {
    return this.loadAllMembers && this.client.gateway.guildSubscriptions;
  }

  onKilled(payload: {error?: Error}): void {
    this.client.kill(payload.error);
  }

  onPacket(packet: GatewayRawEvents.GatewayPacket): void {
    if (packet.op !== GatewayOpCodes.DISPATCH) {
      return;
    }
    const { d: data, t: name} = packet;

    if (this.client.hasEventListener(ClientEvents.RAW)) {
      this.client.emit(ClientEvents.RAW, packet);
    }
    if (!this.disabledEvents.has(name)) {
      if (name in this.dispatchHandler) {
        (<any> this.dispatchHandler)[name](data);
      } else {
        this.client.emit(ClientEvents.UNKNOWN, packet);
      }
    }
  }
}


/**
 * Gateway Dispatch Handler Function
 * @category Handlers
 */
export type GatewayDispatchHandlerFunction = (data: any) => void;


/**
 * Gateway Dispatch Handler
 * @category Handlers
 */
export class GatewayDispatchHandler {
  handler: GatewayHandler;

  constructor(handler: GatewayHandler) {
    this.handler = handler;
  }

  get client() {
    return this.handler.client;
  }

  /* Dispatch Events */
  async [GatewayDispatchEvents.READY](data: GatewayRawEvents.Ready) {
    this.client.reset();

    for (let [nonce, cache] of this.handler._chunksWaiting) {
      cache.promise.reject(new Error('Gateway re-identified before a result came.'));
    }
    this.handler._chunksWaiting.clear();

    let me: UserMe;
    if (this.client.user) {
      me = this.client.user;
      me.merge(data['user']);
    } else {
      me = new UserMe(this.client, data['user']);
      this.client.user = me;
    }
    this.client.users.insert(me); // since we reset the cache

    Object.defineProperty(this.client, '_isBot', {value: me.bot});
    const authType = (this.client.isBot) ? AuthTypes.BOT : AuthTypes.USER;
    this.client.rest.setAuthType(authType);

    // data['analytics_token']
    if (this.client.connectedAccounts.enabled && data['connected_accounts']) {
      for (let raw of data['connected_accounts']) {
        const account = new ConnectedAccount(this.client, raw);
        this.client.connectedAccounts.insert(account);
      }
    }

    if (this.client.guilds.enabled) {
      const requestChunksNow: Array<string> = [];
      for (let raw of data['guilds']) {
        let guild: Guild;
        if (this.client.guilds.has(raw.id)) {
          guild = <Guild> this.client.guilds.get(raw.id);
          guild.merge(raw);
        } else {
          guild = new Guild(this.client, raw);
          this.client.guilds.insert(guild);
        }
        guild.isReady = guild.memberCount === guild.members.length;
        if (guild.isReady) {
          // emit guild ready
        } else {
          if (this.handler.shouldLoadAllMembers) {
            this.client.gateway.requestGuildMembers(guild.id, {
              limit: 0,
              presences: true,
              query: '',
            });
          }
        }
      }
    }

    if (this.client.notes.enabled && data['notes']) {
      for (let userId in data['notes']) {
        this.client.notes.insert(userId, data['notes'][userId]);
      }
    }

    if (this.client.presences.enabled && data['presences']) {
      for (let raw of data['presences']) {
        this.client.presences.insert(raw);
      }
    }

    if (this.client.channels.enabled && data['private_channels']) {
      for (let raw of data['private_channels']) {
        if (this.client.channels.has(raw.id)) {
          (<Channel> this.client.channels.get(raw.id)).merge(raw);
        } else {
          this.client.channels.insert(createChannelFromData(this.client, raw));
        }
      }
    }

    if (this.client.relationships.enabled && data['relationships']) {
      for (let raw of data['relationships']) {
        if (this.client.relationships.has(raw.id)) {
          (<Relationship> this.client.relationships.get(raw.id)).merge(raw);
        } else {
          this.client.relationships.insert(new Relationship(this.client, raw));
        }
      }
    }

    if (this.client.sessions.enabled && data['sessions']) {
      for (let raw of data['sessions']) {
        this.client.sessions.insert(new Session(this.client, raw));
      }
    }

    if (data['user_settings']) {

    }

    if (this.client.isBot) {
      try {
        if (this.client.cluster) {
          await this.client.cluster.fillOauth2Application();
        } else {
          await this.client.rest.fetchOauth2Application();
        }
      } catch(error) {
        const payload: GatewayClientEvents.Warn = {error: new GatewayHTTPError('Failed to fetch OAuth2 Application Information', error)};
        this.client.emit(ClientEvents.WARN, payload);
      }
    } else {
      this.client.owners.set(me.id, me);
      this.client.requiredAction = data['required_action'];
    }

    try {
      if (this.client.cluster) {
        await this.client.cluster.fillApplications();
      } else {
        await this.client.applications.fill();
      }
    } catch(error) {
      const payload: GatewayClientEvents.Warn = {error: new GatewayHTTPError('Failed to fetch Applications', error)};
      this.client.emit(ClientEvents.WARN, payload);
    }

    const payload: GatewayClientEvents.GatewayReady = {raw: data};
    this.client.emit(ClientEvents.GATEWAY_READY, payload);
  }

  [GatewayDispatchEvents.RESUMED](data: GatewayRawEvents.Resumed) {
    this.client.gateway.discordTrace = data['_trace'];

    const payload: GatewayClientEvents.GatewayResumed = {raw: data};
    this.client.emit(ClientEvents.GATEWAY_RESUMED, payload);
  }

  [GatewayDispatchEvents.ACTIVITY_JOIN_INVITE](data: GatewayRawEvents.ActivityJoinInvite) {

  }

  [GatewayDispatchEvents.ACTIVITY_JOIN_REQUEST](data: GatewayRawEvents.ActivityJoinRequest) {

  }

  [GatewayDispatchEvents.ACTIVITY_START](data: GatewayRawEvents.ActivityStart) {

  }

  [GatewayDispatchEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK](data: GatewayRawEvents.BraintreePopupBridgeCallback) {

  }

  [GatewayDispatchEvents.CALL_CREATE](data: GatewayRawEvents.CallCreate) {
    let call: VoiceCall;
    if (this.client.voiceCalls.has(data['channel_id'])) {
      call = <VoiceCall> this.client.voiceCalls.get(data['channel_id']);
      call.merge(data);
    } else {
      call = new VoiceCall(this.client, data);
      this.client.voiceCalls.insert(call);
    }

    const payload: GatewayClientEvents.CallCreate = {call};
    this.client.emit(ClientEvents.CALL_CREATE, payload);
  }

  [GatewayDispatchEvents.CALL_DELETE](data: GatewayRawEvents.CallDelete) {
    let channelId: string = data['channel_id'];
    if (this.client.voiceCalls.has(channelId)) {
      const call = <VoiceCall> this.client.voiceCalls.get(channelId);
      call.kill();
    }

    const payload: GatewayClientEvents.CallDelete = {channelId};
    this.client.emit(ClientEvents.CALL_DELETE, payload);
  }

  [GatewayDispatchEvents.CALL_UPDATE](data: GatewayRawEvents.CallUpdate) {
    let call: VoiceCall;
    let channelId: string = data['channel_id'];
    let differences: any = null;
    if (this.client.voiceCalls.has(data['channel_id'])) {
      call = <VoiceCall> this.client.voiceCalls.get(data['channel_id']);
      if (this.client.hasEventListener(ClientEvents.CALL_UPDATE)) {
        differences = call.differences(data);
      }
      call.merge(data);
    } else {
      call = new VoiceCall(this.client, data);
      this.client.voiceCalls.insert(call);
    }

    const payload: GatewayClientEvents.CallUpdate = {call, channelId, differences};
    this.client.emit(ClientEvents.CALL_UPDATE, payload);
  }

  [GatewayDispatchEvents.CHANNEL_CREATE](data: GatewayRawEvents.ChannelCreate) {
    let channel: Channel;
    if (this.client.channels.has(data['id'])) {
      channel = <Channel> this.client.channels.get(data['id']);
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
      this.client.channels.insert(channel);
    }

    const payload: GatewayClientEvents.ChannelCreate = {channel};
    this.client.emit(ClientEvents.CHANNEL_CREATE, payload);
  }

  [GatewayDispatchEvents.CHANNEL_DELETE](data: GatewayRawEvents.ChannelDelete) {
    let channel: Channel;
    if (this.client.channels.has(data['id'])) {
      channel = <Channel> this.client.channels.get(data['id']);
      this.client.channels.delete(data['id']);
    } else {
      channel = createChannelFromData(this.client, data);
    }
    channel.deleted = true;

    if (channel.isText) {
      for (let [messageId, message] of this.client.messages) {
        if (message.channelId === channel.id) {
          this.client.messages.delete(messageId);
        }
      }
    }

    const payload: GatewayClientEvents.ChannelDelete = {channel};
    this.client.emit(ClientEvents.CHANNEL_DELETE, payload);
  }

  [GatewayDispatchEvents.CHANNEL_PINS_ACK](data: GatewayRawEvents.ChannelPinsAck) {

  }

  [GatewayDispatchEvents.CHANNEL_PINS_UPDATE](data: GatewayRawEvents.ChannelPinsUpdate) {
    let channel: Channel | null = null;
    if (this.client.channels.has(data['channel_id'])) {
      channel = <Channel> this.client.channels.get(data['channel_id']);
      channel.merge({
        last_pin_timestamp: data['last_pin_timestamp'],
      });
    }

    const payload: GatewayClientEvents.ChannelPinsUpdate = {
      channel,
      channelId: data['channel_id'],
      guildId: data['guild_id'],
      lastPinTimestamp: data['last_pin_timestamp'],
    };
    this.client.emit(ClientEvents.CHANNEL_PINS_UPDATE, payload);
  }

  [GatewayDispatchEvents.CHANNEL_UPDATE](data: GatewayRawEvents.ChannelUpdate) {
    let channel: Channel;
    let differences: any = null;
    if (this.client.channels.has(data['id'])) {
      channel = <Channel> this.client.channels.get(data['id']);
      if (this.client.hasEventListener(ClientEvents.CHANNEL_UPDATE)) {
        differences = channel.differences(data);
      }
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
      this.client.channels.insert(channel);
    }

    const payload: GatewayClientEvents.ChannelUpdate = {channel, differences};
    this.client.emit(ClientEvents.CHANNEL_UPDATE, payload);
  }

  [GatewayDispatchEvents.CHANNEL_RECIPIENT_ADD](data: GatewayRawEvents.ChannelRecipientAdd) {
    let channel: ChannelDM | null = null;
    const channelId = data['channel_id'];
    const nick = data['nick'] || null;
    let user: User;

    if (this.client.users.has(data['user']['id'])) {
      user = <User> this.client.users.get(data['user']['id']);
      user.merge(data);
    } else {
      user = new User(this.client, data);
      this.client.users.insert(user);
    }

    if (this.client.channels.has(channelId)) {
      channel = <ChannelDM> this.client.channels.get(channelId);
      channel.recipients.set(user.id, user);
      if (nick) {
        channel.nicks.set(user.id, nick);
      } else {
        channel.nicks.delete(user.id);
      }
    }

    const payload: GatewayClientEvents.ChannelRecipientAdd = {
      channel,
      channelId,
      nick,
      user,
    };
    this.client.emit(ClientEvents.CHANNEL_RECIPIENT_ADD, payload);
  }

  [GatewayDispatchEvents.CHANNEL_RECIPIENT_REMOVE](data: GatewayRawEvents.ChannelRecipientRemove) {
    let channel: ChannelDM | null = null;
    const channelId = data['channel_id'];
    const nick = data['nick'] || null;
    let user: User;

    if (this.client.users.has(data['user']['id'])) {
      user = <User> this.client.users.get(data['user']['id']);
      user.merge(data);
    } else {
      user = new User(this.client, data);
      this.client.users.insert(user);
    }

    if (this.client.channels.has(channelId)) {
      channel = <ChannelDM> this.client.channels.get(channelId);
      channel.recipients.delete(user.id);
      channel.nicks.delete(user.id);
    }

    const payload: GatewayClientEvents.ChannelRecipientRemove = {
      channel,
      channelId,
      nick,
      user,
    };
    this.client.emit(ClientEvents.CHANNEL_RECIPIENT_REMOVE, payload);
  }

  [GatewayDispatchEvents.ENTITLEMENT_CREATE](data: GatewayRawEvents.EntitlementCreate) {

  }

  [GatewayDispatchEvents.ENTITLEMENT_DELETE](data: GatewayRawEvents.EntitlementDelete) {

  }

  [GatewayDispatchEvents.ENTITLEMENT_UPDATE](data: GatewayRawEvents.EntitlementUpdate) {

  }

  [GatewayDispatchEvents.FRIEND_SUGGESTION_CREATE](data: GatewayRawEvents.FriendSuggestionCreate) {
    this.client.emit(ClientEvents.FRIEND_SUGGESTION_CREATE, {
      reasons: data.reasons.map((reason: any) => {
        return {name: reason['name'], platformType: reason['platform_type']};
      }),
      user: new User(this.client, data['suggested_user']),
    });
  }

  [GatewayDispatchEvents.FRIEND_SUGGESTION_DELETE](data: GatewayRawEvents.FriendSuggestionDelete) {
    this.client.emit(ClientEvents.FRIEND_SUGGESTION_DELETE, {
      suggestedUserId: data['suggested_user_id'],
    });
  }

  [GatewayDispatchEvents.GIFT_CODE_UPDATE](data: GatewayRawEvents.GiftCodeUpdate) {
    this.client.emit(ClientEvents.GIFT_CODE_UPDATE, {
      code: data['code'],
      uses: data['uses'],
    });
  }

  [GatewayDispatchEvents.GUILD_BAN_ADD](data: GatewayRawEvents.GuildBanAdd) {
    const guild = this.client.guilds.get(data['guild_id']);
    const guildId = data['guild_id'];
    let user: User;

    if (this.client.users.has(data['user']['id'])) {
      user = <User> this.client.users.get(data['user']['id']);
      user.merge(data['user']);
    } else {
      user = new User(this.client, data['user']);
    }

    this.client.emit(ClientEvents.GUILD_BAN_ADD, {
      guild,
      guildId,
      user,
    });
  }

  [GatewayDispatchEvents.GUILD_BAN_REMOVE](data: GatewayRawEvents.GuildBanRemove) {
    const guild = this.client.guilds.get(data['guild_id']);
    const guildId = data['guild_id'];
    let user: User;

    if (this.client.users.has(data['user']['id'])) {
      user = <User> this.client.users.get(data['user']['id']);
      user.merge(data['user']);
    } else {
      user = new User(this.client, data['user'])
    }

    this.client.emit(ClientEvents.GUILD_BAN_REMOVE, {
      guild,
      guildId,
      user,
    });
  }

  [GatewayDispatchEvents.GUILD_CREATE](data: GatewayRawEvents.GuildCreate) {
    let fromUnavailable = false;
    let guild: Guild;

    if (this.client.guilds.has(data['id'])) {
      guild = <Guild> this.client.guilds.get(data['id']);
      fromUnavailable = guild.unavailable;
      guild.merge(data);
    } else {
      guild = new Guild(this.client, data);
      this.client.guilds.insert(guild);
    }
    guild.isReady = guild.memberCount === guild.members.length;

    if (guild.isReady) {
      // emit GUILD_READY
    } else {
      if (this.handler.shouldLoadAllMembers) {
        this.client.gateway.requestGuildMembers(guild.id, {
          limit: 0,
          presences: true,
          query: '',
        });
      }
    }

    const payload: GatewayClientEvents.GuildCreate = {fromUnavailable, guild};
    this.client.emit(ClientEvents.GUILD_CREATE, payload);
  }

  [GatewayDispatchEvents.GUILD_DELETE](data: GatewayRawEvents.GuildDelete) {
    let channels: BaseCollection<string, Channel> | null = null;
    let guild: Guild | null = null;
    const guildId = data['id'];
    const isUnavailable = !!data['unavailable'];

    let isNew: boolean;
    if (this.client.guilds.has(data['id'])) {
      guild = <Guild> this.client.guilds.get(data['id']);
      guild.merge(data);
      isNew = false;
    } else {
      guild = new Guild(this.client, data);
      this.client.guilds.insert(guild);
      isNew = true;
    }

    if (!isUnavailable) {
      guild.left = true;
    }

    if (!isNew || !this.client.guilds.enabled) {
      if (this.client.hasEventListener(ClientEvents.GUILD_DELETE)) {
        channels = new BaseCollection<string, Channel>();
      }

      for (let [channelId, channel] of this.client.channels) {
        if (channel.guildId === guildId) {
          if (channels) {
            channels.set(channel.id, channel);
          }
          this.client.channels.delete(channelId);

          if (channel.isText) {
            if (this.client.typings.get(channelId)) {
              const typings = <BaseCollection<string, Typing>> this.client.typings.get(channelId);
              for (let [userId, typing] of typings) {
                typing.timeout.stop();
                typings.delete(userId);
              }
              typings.clear();
            }
          }
        }
      }

      for (let [messageId, message] of this.client.messages) {
        if (message.guildId === guildId) {
          this.client.messages.delete(messageId);
        }
      }

      this.client.presences.clearGuildId(guildId);
      this.client.voiceStates.delete(guildId);

      guild.emojis.clear();
      guild.members.clear(); // should we check each member and see if we should clear the user obj from cache too?
      guild.roles.clear();
      guild.isReady = false;
    }

    if (!isUnavailable) {
      this.client.guilds.delete(guildId);
    }

    const payload: GatewayClientEvents.GuildDelete = {channels, guild, guildId, isUnavailable};
    this.client.emit(ClientEvents.GUILD_DELETE, payload);
  }

  [GatewayDispatchEvents.GUILD_EMOJIS_UPDATE](data: GatewayRawEvents.GuildEmojisUpdate) {
    let emojis: BaseCollection<string, Emoji>;
    let emojisOld: BaseCollection<string, Emoji> | null = null;
    let guild: Guild | null = null;
    const guildId = data['guild_id'];

    if (this.client.guilds.has(guildId)) {
      guild = <Guild> this.client.guilds.get(guildId);
      if (this.client.hasEventListener(ClientEvents.GUILD_EMOJIS_UPDATE)) {
        emojisOld = guild.emojis.clone();
      }
      guild.merge({emojis: data['emojis']});
      emojis = guild.emojis;
    } else {
      emojisOld = new BaseCollection();

      emojis = new BaseCollection();
      for (let raw of data['emojis']) {
        const emojiId = <string> raw.id;

        let emoji: Emoji;
        if (this.client.emojis.has(guildId, emojiId)) {
          emoji = <Emoji> this.client.emojis.get(guildId, emojiId);
          emoji.merge(raw);
        } else {
          Object.assign(raw, {guild_id: guildId});
          emoji = new Emoji(this.client, raw);
        }
        emojis.set(emojiId, emoji);
      }
    }

    const payload: GatewayClientEvents.GuildEmojisUpdate = {emojis, emojisOld, guild, guildId};
    this.client.emit(ClientEvents.GUILD_EMOJIS_UPDATE, payload);
  }

  [GatewayDispatchEvents.GUILD_INTEGRATIONS_UPDATE](data: GatewayRawEvents.GuildIntegrationsUpdate) {
    this.client.emit(ClientEvents.GUILD_INTEGRATIONS_UPDATE, {
      guildId: data['guild_id'],
    });
  }

  [GatewayDispatchEvents.GUILD_MEMBER_ADD](data: GatewayRawEvents.GuildMemberAdd) {
    const guildId: string = data['guild_id'];
    let isDuplicate: boolean = false;
    let member: Member;
    const userId: string = data['user']['id'];

    if (this.client.members.has(guildId, userId)) {
      member = <Member> this.client.members.get(guildId, userId);
      member.merge(data);
    } else {
      member = new Member(this.client, data);
      this.client.members.insert(member);
    }

    // Discord can send us a duplicate `GUILD_MEMBER_ADD` event sometimes, like during a guild raid
    const isListening = this.client.hasEventListener(ClientEvents.GUILD_MEMBER_ADD);
    if (isListening || this.client.guilds.has(guildId)) {
      const key = `${guildId}.${userId}`;
      const event = this.handler.duplicateMemberEventsCache.get(key);
      if (event === GatewayDispatchEvents.GUILD_MEMBER_ADD) {
        isDuplicate = true;
      } else {
        if (this.client.guilds.has(guildId)) {
          const guild = <Guild> this.client.guilds.get(guildId);
          guild.memberCount++;
        }
      }
      this.handler.duplicateMemberEventsCache.set(key, GatewayDispatchEvents.GUILD_MEMBER_ADD);
    }

    const payload: GatewayClientEvents.GuildMemberAdd = {guildId, isDuplicate, member, userId};
    this.client.emit(ClientEvents.GUILD_MEMBER_ADD, payload);
  }

  [GatewayDispatchEvents.GUILD_MEMBER_LIST_UPDATE](data: GatewayRawEvents.GuildMemberListUpdate) {
    this.client.emit(ClientEvents.GUILD_MEMBER_LIST_UPDATE, {
      raw: data,
    });
  }

  [GatewayDispatchEvents.GUILD_MEMBER_REMOVE](data: GatewayRawEvents.GuildMemberRemove) {
    const guildId = data['guild_id'];
    let isDuplicate: boolean = false;
    let member: Member | null = null;
    let user: User;
    const userId: string = data['user']['id'];

    if (this.client.users.has(userId)) {
      user = <User> this.client.users.get(userId);
      user.merge(data['user']);
    } else {
      user = new User(this.client, data['user']);
    }

    if (this.client.members.has(guildId, userId)) {
      member = <Member> this.client.members.get(guildId, userId);
      member.left = true;
    }
    this.client.members.delete(guildId, userId);

    // Discord can send us a duplicate `GUILD_MEMBER_ADD` event sometimes, just in case check _REMOVE too
    const isListening = this.client.hasEventListener(ClientEvents.GUILD_MEMBER_REMOVE);
    if (isListening || this.client.guilds.has(guildId)) {
      const key = `${guildId}.${userId}`;
      const event = this.handler.duplicateMemberEventsCache.get(key);
      if (event === GatewayDispatchEvents.GUILD_MEMBER_REMOVE) {
        isDuplicate = true;
      } else {
        if (this.client.guilds.has(guildId)) {
          const guild = <Guild> this.client.guilds.get(guildId);
          guild.memberCount--;
        }
      }
      this.handler.duplicateMemberEventsCache.set(key, GatewayDispatchEvents.GUILD_MEMBER_REMOVE);
    }

    if (this.client.presences.has(userId)) {
      const presence = <Presence> this.client.presences.get(userId);
      presence._deleteGuildId(guildId);
      if (!presence.guildIds.length) {
        this.client.presences.delete(userId);
      }
    }

    for (let [cacheId, cache] of this.client.typings.caches) {
      if (cache.has(userId)) {
        const typing = <Typing> cache.get(userId);
        typing._stop(false);
      }
    }

    this.client.voiceStates.delete(guildId, userId);

    // do a guild sweep for mutual guilds
    const sharesGuilds = this.client.guilds.some((guild) => guild.members.has(userId));
    if (!sharesGuilds) {
      // do a channel sweep for mutual dms
      const sharesDms = this.client.channels.some((channel) => channel.recipients.has(userId));
      if (!sharesDms) {
        // relationship check
        if (!this.client.relationships.has(userId)) {
          this.client.users.delete(userId);
        }
      }
    }

    const payload: GatewayClientEvents.GuildMemberRemove = {guildId, isDuplicate, member, user, userId};
    this.client.emit(ClientEvents.GUILD_MEMBER_REMOVE, payload);
  }

  [GatewayDispatchEvents.GUILD_MEMBER_UPDATE](data: GatewayRawEvents.GuildMemberUpdate) {
    let differences: any = null;
    const guildId: string = data['guild_id'];
    let member: Member;
    const userId: string = data['user']['id'];

    const isListening = this.client.hasEventListener(ClientEvents.GUILD_MEMBER_UPDATE) || this.client.hasEventListener(ClientEvents.USERS_UPDATE);

    if (this.client.members.has(guildId, userId)) {
      member = <Member> this.client.members.get(guildId, userId);
      if (isListening) {
        differences = member.differences(data);
      }
      member.merge(data);
    } else {
      member = new Member(this.client, data);
      this.client.members.insert(member);
    }

    if (differences && differences.user) {
      const payload: GatewayClientEvents.UsersUpdate = {
        differences: differences.user,
        from: ClientEvents.GUILD_MEMBER_UPDATE,
        user: member.user,
      };
      this.client.emit(ClientEvents.USERS_UPDATE, payload);
    }

    const payload: GatewayClientEvents.GuildMemberUpdate = {differences, guildId, member, userId};
    this.client.emit(ClientEvents.GUILD_MEMBER_UPDATE, payload);
  }

  [GatewayDispatchEvents.GUILD_MEMBERS_CHUNK](data: GatewayRawEvents.GuildMembersChunk) {
    const chunkCount = data['chunk_count'];
    const chunkIndex = data['chunk_index'];
    const guildId = data['guild_id'];
    const nonce = data['nonce'] || null;

    let guild: Guild | null = this.client.guilds.get(guildId) || null;
    let members: BaseCollection<string, Member> | null = null;
    let notFound: Array<string> | null = null;
    let presences: BaseCollection<string, Presence> | null = null;

    const isListening = (
      this.client.hasEventListener(ClientEvents.GUILD_MEMBERS_CHUNK) ||
      !!(nonce && this.handler._chunksWaiting.has(nonce))
    );
    let cache = nonce && this.handler._chunksWaiting.get(nonce);

    // do presences first since the members cache might depend on it (storeOffline = false)
    if (data['presences']) {
      presences = new BaseCollection<string, Presence>();
      if (this.client.presences.enabled || isListening) {
        for (let value of data['presences']) {
          value.guild_id = guildId;
          const presence = this.client.presences.insert(value);
          if (isListening) {
            presences.set(presence.user.id, presence);
          }
          if (cache) {
            cache.presences.set(presence.user.id, presence);
          }
        }
      }
    }

    if (data['members']) {
      // we (the bot user) won't be in the chunk anyways, right?
      if (this.client.members.enabled || isListening) {
        members = new BaseCollection<string, Member>();
        for (let value of data['members']) {
          let rawUser = <GatewayRawEvents.RawUser> value.user;
          let member: Member;
          if (this.client.members.has(guildId, rawUser.id)) {
            member = <Member> this.client.members.get(guildId, rawUser.id);
            member.merge(value);
          } else {
            member = new Member(this.client, Object.assign(value, {guild_id: guildId}));
            this.client.members.insert(member);
          }

          if (isListening) {
            members.set(member.id, member);
          }
          if (cache) {
            cache.members.set(member.id, member);
          }
        }
      } else if (this.client.presences.enabled || this.client.users.enabled) {
        for (let value of data['members']) {
          let raw = <GatewayRawEvents.RawUser> value.user;
          let user: User;
          if (this.client.users.has(raw.id)) {
            user = <User> this.client.users.get(raw.id);
            user.merge(raw);
          } else {
            user = new User(this.client, raw);
            this.client.users.insert(user);
          }
        }
      }
    }

    if (data['not_found']) {
      // user ids
      // if the userId is not a big int, it'll be an integer..
      notFound = data['not_found'].map((userId) => String(userId));
      if (cache) {
        for (let userId of notFound) {
          cache.notFound.add(userId);
        }
      }
    }

    if (guild && !guild.isReady && guild.memberCount === guild.members.length) {
      guild.isReady = true;
      const payload: GatewayClientEvents.GuildReady = {guild};
      this.client.emit(ClientEvents.GUILD_READY, payload);
    }

    if (cache && chunkIndex + 1 === chunkCount) {
      cache.promise.resolve();
    }

    const payload: GatewayClientEvents.GuildMembersChunk = {
      chunkCount,
      chunkIndex,
      guild,
      guildId,
      members,
      nonce,
      notFound,
      presences,
    };
    this.client.emit(ClientEvents.GUILD_MEMBERS_CHUNK, payload);
  }

  [GatewayDispatchEvents.GUILD_ROLE_CREATE](data: GatewayRawEvents.GuildRoleCreate) {
    let guild: Guild | null = null;
    const guildId = data['guild_id'];
    let role: Role;

    if (this.client.guilds.has(guildId)) {
      guild = <Guild> this.client.guilds.get(guildId);
      if (guild.roles.has(data['role']['id'])) {
        role = <Role> guild.roles.get(data['role']['id']);
        role.merge(data['role']);
      } else {
        data['role']['guild_id'] = guildId;
        role = new Role(this.client, data['role']);
        guild.roles.set(role.id, role);
      }
    } else {
      data['role']['guild_id'] = guildId;
      role = new Role(this.client, data['role']);
    }

    const payload: GatewayClientEvents.GuildRoleCreate = {guild, guildId, role};
    this.client.emit(ClientEvents.GUILD_ROLE_CREATE, payload);
  }

  [GatewayDispatchEvents.GUILD_ROLE_DELETE](data: GatewayRawEvents.GuildRoleDelete) {
    let guild: Guild | null = null;
    const guildId = data['guild_id'];
    let role: null | Role = null;
    const roleId = data['role_id'];

    if (this.client.guilds.has(guildId)) {
      guild = <Guild> this.client.guilds.get(guildId);
      if (guild.roles.has(roleId)) {
        role = <Role> guild.roles.get(roleId);
        guild.roles.delete(roleId);
      }

      for (let [userId, member] of guild.members) {
        if (member._roles) {
          const index = member._roles.indexOf(roleId);
          if (index !== -1) {
            member._roles.splice(index, 1);
          }
        }
      }
    }

    const payload: GatewayClientEvents.GuildRoleDelete = {guild, guildId, role, roleId};
    this.client.emit(ClientEvents.GUILD_ROLE_DELETE, payload);
  }

  [GatewayDispatchEvents.GUILD_ROLE_UPDATE](data: GatewayRawEvents.GuildRoleUpdate) {
    let differences: any = null;
    let guild: Guild | null = null;
    const guildId = data['guild_id'];
    let role: Role;

    if (this.client.guilds.has(guildId)) {
      guild = <Guild> this.client.guilds.get(guildId);
      if (guild.roles.has(data['role']['id'])) {
        role = <Role> guild.roles.get(data['role']['id']);
        if (this.client.hasEventListener(ClientEvents.GUILD_ROLE_UPDATE)) {
          differences = role.differences(data['role']);
        }
        role.merge(data['role']);
      } else {
        data['role']['guild_id'] = guildId;
        role = new Role(this.client, data['role']);
        guild.roles.set(role.id, role);
      }
    } else {
      data['role']['guild_id'] = guildId;
      role = new Role(this.client, data['role']);
    }

    const payload: GatewayClientEvents.GuildRoleUpdate = {differences, guild, guildId, role};
    this.client.emit(ClientEvents.GUILD_ROLE_UPDATE, payload);
  }

  [GatewayDispatchEvents.GUILD_UPDATE](data: GatewayRawEvents.GuildUpdate) {
    let differences: any = null;
    let guild: Guild;

    if (this.client.guilds.has(data['id'])) {
      guild = <Guild> this.client.guilds.get(data['id']);
      if (this.client.hasEventListener(ClientEvents.GUILD_UPDATE)) {
        differences = guild.differences(data);
      }
      guild.merge(data);
    } else {
      guild = new Guild(this.client, data);
      this.client.guilds.insert(guild);
    }
    guild.hasMetadata = true;

    const payload: GatewayClientEvents.GuildUpdate = {differences, guild};
    this.client.emit(ClientEvents.GUILD_UPDATE, payload);
  }

  [GatewayDispatchEvents.INVITE_CREATE](data: GatewayRawEvents.InviteCreate) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    const invite = new Invite(this.client, data);

    const payload: GatewayClientEvents.InviteCreate = {channelId, guildId, invite};
    this.client.emit(ClientEvents.INVITE_CREATE, payload);
  }

  [GatewayDispatchEvents.INVITE_DELETE](data: GatewayRawEvents.InviteDelete) {
    const channelId = data['channel_id'];
    const code = data['code'];
    const guildId = data['guild_id'];

    const payload: GatewayClientEvents.InviteDelete = {channelId, code, guildId};
    this.client.emit(ClientEvents.INVITE_DELETE, payload);
  }

  [GatewayDispatchEvents.LIBRARY_APPLICATION_UPDATE](data: GatewayRawEvents.LibraryApplicationUpdate) {

  }

  [GatewayDispatchEvents.LOBBY_CREATE](data: GatewayRawEvents.LobbyCreate) {

  }

  [GatewayDispatchEvents.LOBBY_DELETE](data: GatewayRawEvents.LobbyDelete) {

  }

  [GatewayDispatchEvents.LOBBY_UPDATE](data: GatewayRawEvents.LobbyUpdate) {

  }

  [GatewayDispatchEvents.LOBBY_MEMBER_CONNECT](data: GatewayRawEvents.LobbyMemberConnect) {

  }

  [GatewayDispatchEvents.LOBBY_MEMBER_DISCONNECT](data: GatewayRawEvents.LobbyMemberDisconnect) {

  }

  [GatewayDispatchEvents.LOBBY_MEMBER_UPDATE](data: GatewayRawEvents.LobbyMemberUpdate) {

  }

  [GatewayDispatchEvents.LOBBY_MESSAGE](data: GatewayRawEvents.LobbyMessage) {

  }

  [GatewayDispatchEvents.LOBBY_VOICE_SERVER_UPDATE](data: GatewayRawEvents.LobbyVoiceServerUpdate) {

  }

  [GatewayDispatchEvents.LOBBY_VOICE_STATE_UPDATE](data: GatewayRawEvents.LobbyVoiceStateUpdate) {

  }

  [GatewayDispatchEvents.MESSAGE_ACK](data: GatewayRawEvents.MessageAck) {

  }

  [GatewayDispatchEvents.MESSAGE_CREATE](data: GatewayRawEvents.MessageCreate) {
    let message: Message;
    let typing: null | Typing = null;

    if (this.client.messages.has(data['id'])) {
      message = <Message> this.client.messages.get(data['id']);
      message.merge(data);
    } else {
      message = new Message(this.client, data);
      this.client.messages.insert(message);
    }

    if (this.client.channels.has(message.channelId)) {
      const channel = <Channel> this.client.channels.get(message.channelId);
      channel.merge({last_message_id: message.id});
    }

    if (this.client.typings.has(message.channelId)) {
      const typings = <BaseCollection<string, Typing>> this.client.typings.get(message.channelId);
      if (typings.has(message.author.id)) {
        typing = <Typing> typings.get(message.author.id);
        typing._stop();
      }
    }

    const payload: GatewayClientEvents.MessageCreate = {message, typing};
    this.client.emit(ClientEvents.MESSAGE_CREATE, payload);
  }

  [GatewayDispatchEvents.MESSAGE_DELETE](data: GatewayRawEvents.MessageDelete) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    let message: Message | null = null;
    const messageId = data['id'];

    if (this.client.messages.has(messageId)) {
      message = this.client.messages.get(messageId) as Message;
      message.deleted = true;
      this.client.messages.delete(messageId);
    }

    const payload: GatewayClientEvents.MessageDelete = {channelId, guildId, message, messageId, raw: data};
    this.client.emit(ClientEvents.MESSAGE_DELETE, payload);
  }

  [GatewayDispatchEvents.MESSAGE_DELETE_BULK](data: GatewayRawEvents.MessageDeleteBulk) {
    const amount = data['ids'].length;
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    const messages = new BaseCollection<string, Message | null>();

    for (let messageId of data['ids']) {
      if (this.client.messages.has(messageId)) {
        const message = <Message> this.client.messages.get(messageId);
        message.deleted = true;
        messages.set(messageId, message);
        this.client.messages.delete(messageId);
      } else {
        messages.set(messageId, null);
      }
    }

    const payload: GatewayClientEvents.MessageDeleteBulk = {amount, channelId, guildId, messages, raw: data};
    this.client.emit(ClientEvents.MESSAGE_DELETE_BULK, payload);
  }

  [GatewayDispatchEvents.MESSAGE_REACTION_ADD](data: GatewayRawEvents.MessageReactionAdd) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    let member: Member | null = null;
    let message: Message | null = null;
    const messageId = data['message_id'];
    let reaction: null | Reaction = null;
    let user: User | null = null;
    const userId = data['user_id'];

    if (this.client.users.has(userId)) {
      user = <User> this.client.users.get(userId);
    }

    if (data.member) {
      if (this.client.members.has(guildId, userId)) {
        member = <Member> this.client.members.get(guildId, userId);
        member.merge(data.member);
      } else {
        member = new Member(this.client, data.member);
        this.client.members.insert(member);
      }
    }

    const emojiId = data.emoji.id || data.emoji.name;
    if (this.client.messages.has(messageId)) {
      message = <Message> this.client.messages.get(messageId);
      if (message._reactions && message._reactions.has(emojiId)) {
        reaction = <Reaction> message._reactions.get(emojiId);
      }
    }

    if (!reaction) {
      // https://github.com/discordapp/discord-api-docs/issues/812
      Object.assign(data, {is_partial: true});
      reaction = new Reaction(this.client, data);
      if (message) {
        if (!message._reactions) {
          message._reactions = new BaseCollection<string, Reaction>();
        }
        message._reactions.set(emojiId, reaction);
        reaction.isPartial = false;
      }
    }

    reaction.count += 1;
    reaction.me = (userId === this.client.userId) || reaction.me;

    const payload: GatewayClientEvents.MessageReactionAdd = {
      channelId,
      guildId,
      member,
      message,
      messageId,
      reaction,
      user,
      userId,
      raw: data,
    };
    this.client.emit(ClientEvents.MESSAGE_REACTION_ADD, payload);
  }

  [GatewayDispatchEvents.MESSAGE_REACTION_REMOVE](data: GatewayRawEvents.MessageReactionRemove) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    let message: Message | null = null;
    const messageId = data['message_id'];
    let reaction: null | Reaction = null;
    let user: User | null = null;
    const userId = data['user_id'];

    if (this.client.users.has(userId)) {
      user = <User> this.client.users.get(userId);
    }

    const emojiId = data.emoji.id || data.emoji.name;
    if (this.client.messages.has(messageId)) {
      message = <Message> this.client.messages.get(messageId);
      if (message._reactions && message._reactions.has(emojiId)) {
        reaction = <Reaction> message._reactions.get(emojiId);
        reaction.count = Math.min(reaction.count - 1, 0);
        reaction.me = reaction.me && userId !== this.client.userId;

        if (reaction.count <= 0) {
          message._reactions.delete(emojiId);
          if (!message._reactions.length) {
            message._reactions = undefined;
          }
        }
      }
    }

    if (!reaction) {
      // https://github.com/discordapp/discord-api-docs/issues/812
      Object.assign(data, {is_partial: true});
      reaction = new Reaction(this.client, data);
    }

    const payload: GatewayClientEvents.MessageReactionRemove = {
      channelId,
      guildId,
      message,
      messageId,
      reaction,
      user,
      userId,
      raw: data,
    };
    this.client.emit(ClientEvents.MESSAGE_REACTION_REMOVE, payload);
  }

  [GatewayDispatchEvents.MESSAGE_REACTION_REMOVE_ALL](data: GatewayRawEvents.MessageReactionRemoveAll) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    let message: Message | null = null;
    const messageId = data['message_id'];

    if (this.client.messages.has(messageId)) {
      message = <Message> this.client.messages.get(messageId);
      if (message._reactions) {
        message._reactions.clear();
        message._reactions = undefined;
      }
    }

    const payload: GatewayClientEvents.MessageReactionRemoveAll = {
      channelId,
      guildId,
      message,
      messageId,
    };
    this.client.emit(ClientEvents.MESSAGE_REACTION_REMOVE_ALL, payload);
  }

  [GatewayDispatchEvents.MESSAGE_REACTION_REMOVE_EMOJI](data: GatewayRawEvents.MessageReactionRemoveEmoji) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    let message: Message | null = null;
    const messageId = data['message_id'];
    let reaction: null | Reaction = null;

    const emojiId = data.emoji.id || data.emoji.name;
    if (this.client.messages.has(messageId)) {
      message = <Message> this.client.messages.get(messageId);
      if (message._reactions && message._reactions.has(emojiId)) {
        reaction = <Reaction> message._reactions.get(emojiId);
        message._reactions.delete(emojiId);
        if (!message._reactions.length) {
          message._reactions = undefined;
        }
      }
    }

    if (!reaction) {
      // https://github.com/discordapp/discord-api-docs/issues/812
      Object.assign(data, {is_partial: true});
      reaction = new Reaction(this.client, data);
    }

    const payload: GatewayClientEvents.MessageReactionRemoveEmoji = {
      channelId,
      guildId,
      message,
      messageId,
      reaction,
      raw: data,
    };
    this.client.emit(ClientEvents.MESSAGE_REACTION_REMOVE_EMOJI, payload);
  }

  [GatewayDispatchEvents.MESSAGE_UPDATE](data: GatewayRawEvents.MessageUpdate) {
    let channelId = data['channel_id'];
    let differences: any = null;
    let guildId = data['guild_id'];
    let isEmbedUpdate: boolean = false;
    let message: Message | null = null;
    let messageId = data['id'];

    if (!data['author']) {
      isEmbedUpdate = true;
    }

    if (this.client.messages.has(data['id'])) {
      message = <Message> this.client.messages.get(data['id']);
      if (this.client.hasEventListener(ClientEvents.MESSAGE_UPDATE)) {
        differences = message.differences(data);
      }
      message.merge(data);
    } else {
      if (data['author']) {
        // else it's an embed update and we dont have it in cache
        // only embed updates we cannot create a message object
        message = new Message(this.client, data);
        this.client.messages.insert(message);
      }
    }

    const payload: GatewayClientEvents.MessageUpdate = {
      channelId,
      differences,
      guildId,
      isEmbedUpdate,
      message,
      messageId,
      raw: data,
    };
    this.client.emit(ClientEvents.MESSAGE_UPDATE, payload);
  }

  [GatewayDispatchEvents.OAUTH2_TOKEN_REVOKE](data: GatewayRawEvents.Oauth2TokenRevoke) {

  }

  [GatewayDispatchEvents.PRESENCE_UPDATE](data: GatewayRawEvents.PresenceUpdate) {
    let differences: any = null;
    const guildId = data['guild_id'] || null;
    let isGuildPresence = !!guildId;
    let member: Member | null = null;
    let presence: Presence;
    let wentOffline: boolean = data['status'] === PresenceStatuses.OFFLINE;

    if (this.client.hasEventListener(ClientEvents.PRESENCE_UPDATE) || this.client.hasEventListener(ClientEvents.USERS_UPDATE)) {
      if (this.client.presences.has(data['user']['id'])) {
        differences = (<Presence> this.client.presences.get(data['user']['id'])).differences(data);
      }
    }
    presence = this.client.presences.insert(data);

    if (guildId) {
      if (this.client.members.has(guildId, data['user']['id'])) {
        member = <Member> this.client.members.get(guildId, data['user']['id']);
        member.merge(data);
      } else {
        member = new Member(this.client, data);
        this.client.members.insert(member);
      }
    }

    if (differences && differences.user) {
      const payload: GatewayClientEvents.UsersUpdate = {
        differences: differences.user,
        from: ClientEvents.PRESENCE_UPDATE,
        user: presence.user,
      };
      this.client.emit(ClientEvents.USERS_UPDATE, payload);
    }

    const payload: GatewayClientEvents.PresenceUpdate = {differences, guildId, isGuildPresence, member, presence, wentOffline};
    this.client.emit(ClientEvents.PRESENCE_UPDATE, payload);
  }

  [GatewayDispatchEvents.PRESENCES_REPLACE](data: GatewayRawEvents.PresencesReplace) {
    const presences = new BaseCollection<string, Presence>();

    if (data['presences']) {
      for (let raw of data['presences']) {
        // guildId is empty, use default presence cache id
        const presence = this.client.presences.insert(raw);
        presences.set(presence.user.id, presence);
      }
    }

    const payload: GatewayClientEvents.PresencesReplace = {presences};
    this.client.emit(ClientEvents.PRESENCES_REPLACE, payload);
  }

  [GatewayDispatchEvents.RECENT_MENTION_DELETE](data: GatewayRawEvents.RecentMentionDelete) {

  }

  [GatewayDispatchEvents.RELATIONSHIP_ADD](data: GatewayRawEvents.RelationshipAdd) {
    let differences: any = null;
    let relationship: Relationship;
    const userId = data['id'];

    if (this.client.relationships.has(userId)) {
      relationship = <Relationship> this.client.relationships.get(userId);
      if (this.client.hasEventListener(ClientEvents.RELATIONSHIP_ADD)) {
        differences = relationship.differences(data);
      }
      relationship.merge(data);
    } else {
      relationship = new Relationship(this.client, data);
      this.client.relationships.insert(relationship);
    }

    const payload: GatewayClientEvents.RelationshipAdd = {differences, relationship, userId};
    this.client.emit(ClientEvents.RELATIONSHIP_ADD, payload);
  }

  [GatewayDispatchEvents.RELATIONSHIP_REMOVE](data: GatewayRawEvents.RelationshipRemove) {
    let relationship: Relationship;
    const userId = data['id'];

    if (this.client.relationships.has(data['id'])) {
      relationship = <Relationship> this.client.relationships.get(data['id']);
      this.client.relationships.delete(data['id']);
    } else {
      relationship = new Relationship(this.client, data);
    }

    const payload: GatewayClientEvents.RelationshipRemove = {relationship, userId};
    this.client.emit(ClientEvents.RELATIONSHIP_REMOVE, payload);
  }

  [GatewayDispatchEvents.SESSIONS_REPLACE](data: GatewayRawEvents.SessionsReplace) {
    const old = this.client.sessions.clone();

    // maybe return an array of differences instead?
    if (this.client.sessions.enabled) {
      this.client.sessions.clear();
      for (let raw of data) {
        this.client.sessions.insert(new Session(this.client, raw));
      }
    }

    const payload: GatewayClientEvents.SessionsReplace = {old, raw: data};
    this.client.emit(ClientEvents.SESSIONS_REPLACE, payload);
  }

  [GatewayDispatchEvents.STREAM_CREATE](data: GatewayRawEvents.StreamCreate) {
    this.client.emit(ClientEvents.STREAM_CREATE, {
      paused: data['paused'],
      region: data['region'],
      rtcServerId: data['rtc_server_id'],
      streamKey: data['stream_key'],
      viewerIds: data['viewer_ids'],
    });
  }

  [GatewayDispatchEvents.STREAM_DELETE](data: GatewayRawEvents.StreamDelete) {
    this.client.emit(ClientEvents.STREAM_DELETE, {
      reason: data['reason'],
      streamKey: data['stream_key'],
      unavailable: data['unavailable'],
    });
  }

  [GatewayDispatchEvents.STREAM_SERVER_UPDATE](data: GatewayRawEvents.StreamServerUpdate) {
    this.client.emit(ClientEvents.STREAM_SERVER_UPDATE, {
      endpoint: data['endpoint'],
      streamKey: data['stream_key'],
      token: data['token'],
    });
  }

  [GatewayDispatchEvents.STREAM_UPDATE](data: GatewayRawEvents.StreamUpdate) {
    this.client.emit(ClientEvents.STREAM_UPDATE, {
      paused: data['paused'],
      region: data['region'],
      streamKey: data['stream_key'],
      viewerIds: data['viewer_ids'],
    });
  }

  [GatewayDispatchEvents.TYPING_START](data: GatewayRawEvents.TypingStart) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    let typing: Typing;
    const userId = data['user_id'];

    if (this.client.typings.has(channelId, userId)) {
      typing = <Typing> this.client.typings.get(channelId, userId);
      typing.merge(data);
    } else {
      typing = new Typing(this.client, data);
      this.client.typings.insert(typing);
    }

    const payload: GatewayClientEvents.TypingStart = {channelId, guildId, typing, userId};
    this.client.emit(ClientEvents.TYPING_START, payload);
  }

  [GatewayDispatchEvents.USER_ACHIEVEMENT_UPDATE](data: GatewayRawEvents.UserAchievementUpdate) {

  }

  async [GatewayDispatchEvents.USER_CONNECTIONS_UPDATE](data: GatewayRawEvents.UserConnectionsUpdate) {
    // maybe fetch from rest api when this happens to keep cache up to date?

    try {
      await this.client.connectedAccounts.fill();
    } catch(error) {
      const payload: GatewayClientEvents.Warn = {error: new GatewayHTTPError('Failed to fetch Connected Accounts', error)};
      this.client.emit(ClientEvents.WARN, payload);
    }

    const payload: GatewayClientEvents.UserConnectionsUpdate = {};
    this.client.emit(ClientEvents.USER_CONNECTIONS_UPDATE, payload);
  }

  [GatewayDispatchEvents.USER_FEED_SETTINGS_UPDATE](data: GatewayRawEvents.UserFeedSettingsUpdate) {

  }

  [GatewayDispatchEvents.USER_GUILD_SETTINGS_UPDATE](data: GatewayRawEvents.UserGuildSettingsUpdate) {

  }

  [GatewayDispatchEvents.USER_NOTE_UPDATE](data: GatewayRawEvents.UserNoteUpdate) {
    const note = data['note'];
    let user: null | User = null;
    const userId = data['id'];

    if (this.client.users.has(userId)) {
      user = <User> this.client.users.get(userId);
    }
    this.client.notes.insert(userId, note);

    const payload: GatewayClientEvents.UserNoteUpdate = {note, user, userId};
    this.client.emit(ClientEvents.USER_NOTE_UPDATE, payload);
  }

  [GatewayDispatchEvents.USER_PAYMENT_SOURCES_UPDATE](data: GatewayRawEvents.UserPaymentSourcesUpdate) {
    // maybe fetch from rest api when this happens to keep cache up to date?
  }

  [GatewayDispatchEvents.USER_PAYMENTS_UPDATE](data: GatewayRawEvents.UserPaymentsUpdate) {
    // maybe fetch from rest api when this happens to keep cache up to date?
  }

  [GatewayDispatchEvents.USER_REQUIRED_ACTION_UPDATE](data: GatewayRawEvents.UserRequiredActionUpdate) {
    const requiredAction = this.client.requiredAction;
    this.client.requiredAction = data['required_action'];

    const payload: GatewayClientEvents.UserRequiredActionUpdate = {
      differences: {requiredAction},
      requiredAction: this.client.requiredAction,
    };
    this.client.emit(ClientEvents.USER_REQUIRED_ACTION_UPDATE, payload);
  }

  [GatewayDispatchEvents.USER_SETTINGS_UPDATE](data: GatewayRawEvents.UserSettingsUpdate) {
    
  }

  [GatewayDispatchEvents.USER_UPDATE](data: GatewayRawEvents.UserUpdate) {
    // this updates this.client.user, us
    let differences: any = null;
    let user: UserMe;

    if (this.client.user) {
      user = this.client.user;
      if (this.client.hasEventListener(ClientEvents.USER_UPDATE)) {
        differences = user.differences(data);
      }
      user.merge(data);
    } else {
      user = new UserMe(this.client, data);
      this.client.user = user;
      this.client.users.insert(user);
    }

    const payload: GatewayClientEvents.UserUpdate = {differences, user};
    this.client.emit(ClientEvents.USER_UPDATE, payload);
  }

  [GatewayDispatchEvents.VOICE_SERVER_UPDATE](data: GatewayRawEvents.VoiceServerUpdate) {
    this.client.emit(ClientEvents.VOICE_SERVER_UPDATE, {
      channelId: data['channel_id'],
      endpoint: data['endpoint'],
      guildId: data['guild_id'],
      token: data['token'],
    });
  }

  [GatewayDispatchEvents.VOICE_STATE_UPDATE](data: GatewayRawEvents.VoiceStateUpdate) {
    let differences: any = null;
    let leftChannel = false;
    let voiceState: VoiceState;

    const serverId = data['guild_id'] || data['channel_id'];
    if (this.client.voiceStates.has(serverId, data['user_id'])) {
      voiceState = <VoiceState> this.client.voiceStates.get(serverId, data['user_id']);
      if (this.client.hasEventListener(ClientEvents.VOICE_STATE_UPDATE)) {
        differences = voiceState.differences(data);
      }
      voiceState.merge(data);
      if (!data['channel_id']) {
        this.client.voiceStates.delete(serverId, data['user_id']);
        leftChannel = true;
      }
    } else {
      voiceState = new VoiceState(this.client, data);
      this.client.voiceStates.insert(voiceState);
    }

    const payload: GatewayClientEvents.VoiceStateUpdate = {differences, leftChannel, voiceState};
    this.client.emit(ClientEvents.VOICE_STATE_UPDATE, payload);
  }

  [GatewayDispatchEvents.WEBHOOKS_UPDATE](data: GatewayRawEvents.WebhooksUpdate) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];

    const payload: GatewayClientEvents.WebhooksUpdate = {channelId, guildId};
    this.client.emit(ClientEvents.WEBHOOKS_UPDATE, payload);
  }
}
