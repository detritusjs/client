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
import { GatewayError, GatewayHTTPError } from '../errors';

import {
  ApplicationCommand,
  createChannelFromData,
  Channel,
  ChannelDM,
  ConnectedAccount,
  Emoji,
  Guild,
  Interaction,
  Invite,
  Member,
  Message,
  Presence,
  Reaction,
  Relationship,
  Role,
  Session,
  StageInstance,
  Sticker,
  ThreadMember,
  Typing,
  User,
  UserMe,
  VoiceCall,
  VoiceState,
} from '../structures';

import { GatewayClientEvents } from './clientevents';
import { ComponentHandler } from './componenthandler';
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
  readonly _componentHandler = new ComponentHandler();

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
        try {
          (this.dispatchHandler as any)[name](data);
        } catch(error) {
          this.client.emit(ClientEvents.WARN, {error: new GatewayError(error, packet)});
        }
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
    this.client.reset(false);

    for (let [listenerId, listener] of this.handler._componentHandler.listeners) {
      if (!listener.timeout) {
        this.handler._componentHandler.listeners.delete(listenerId);
      }
    }

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
      for (let raw of data['guilds']) {
        let guild: Guild;
        if (this.client.guilds.has(raw.id)) {
          guild = this.client.guilds.get(raw.id)!;
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
          this.client.channels.get(raw.id)!.merge(raw);
        } else {
          this.client.channels.insert(createChannelFromData(this.client, raw));
        }
      }
    }

    if (this.client.relationships.enabled && data['relationships']) {
      for (let raw of data['relationships']) {
        if (this.client.relationships.has(raw.id)) {
          this.client.relationships.get(raw.id)!.merge(raw);
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

  [GatewayDispatchEvents.APPLICATION_COMMAND_CREATE](data: GatewayRawEvents.ApplicationCommandCreate) {
    const command = new ApplicationCommand(this.client, data);
    const payload: GatewayClientEvents.ApplicationCommandCreate = {_raw: data, command};
    this.client.emit(ClientEvents.APPLICATION_COMMAND_CREATE, payload);
  }

  [GatewayDispatchEvents.APPLICATION_COMMAND_DELETE](data: GatewayRawEvents.ApplicationCommandDelete) {
    const command = new ApplicationCommand(this.client, data);
    const payload: GatewayClientEvents.ApplicationCommandDelete = {_raw: data, command};
    this.client.emit(ClientEvents.APPLICATION_COMMAND_DELETE, payload);
  }

  [GatewayDispatchEvents.APPLICATION_COMMAND_UPDATE](data: GatewayRawEvents.ApplicationCommandUpdate) {
    const command = new ApplicationCommand(this.client, data);
    const payload: GatewayClientEvents.ApplicationCommandUpdate = {_raw: data, command};
    this.client.emit(ClientEvents.APPLICATION_COMMAND_UPDATE, payload);
  }

  [GatewayDispatchEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK](data: GatewayRawEvents.BraintreePopupBridgeCallback) {

  }

  [GatewayDispatchEvents.CALL_CREATE](data: GatewayRawEvents.CallCreate) {
    let call: VoiceCall;
    if (this.client.voiceCalls.has(data['channel_id'])) {
      call = this.client.voiceCalls.get(data['channel_id'])!;
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
      const call = this.client.voiceCalls.get(channelId)!;
      call.kill();
    }

    const payload: GatewayClientEvents.CallDelete = {channelId};
    this.client.emit(ClientEvents.CALL_DELETE, payload);
  }

  [GatewayDispatchEvents.CALL_UPDATE](data: GatewayRawEvents.CallUpdate) {
    let call: VoiceCall;
    let channelId: string = data['channel_id'];
    let differences: GatewayClientEvents.Differences = null;
    if (this.client.voiceCalls.has(data['channel_id'])) {
      call = this.client.voiceCalls.get(data['channel_id'])!;
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
      channel = this.client.channels.get(data['id'])!;
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
      this.client.channels.insert(channel);
    }

    const guild = channel.guild;
    if (guild) {
      guild._channelIds.add(channel.id);
    }

    const payload: GatewayClientEvents.ChannelCreate = {channel};
    this.client.emit(ClientEvents.CHANNEL_CREATE, payload);
  }

  [GatewayDispatchEvents.CHANNEL_DELETE](data: GatewayRawEvents.ChannelDelete) {
    let channel: Channel;
    if (this.client.channels.has(data['id'])) {
      channel = this.client.channels.get(data['id'])!;
      this.client.channels.delete(data['id']);
    } else {
      channel = createChannelFromData(this.client, data);
    }
    channel.deleted = true;

    if (channel.isText) {
      for (let [messageId, message] of this.client.messages) {
        if (message.channelId === channel.id) {
          message.deleted = true;
          this.client.messages.delete(messageId);
        }
        this.handler._componentHandler.delete(messageId);
      }
    }

    const guild = channel.guild;
    if (guild) {
      guild.channels.delete(channel.id);
    }

    const payload: GatewayClientEvents.ChannelDelete = {channel};
    this.client.emit(ClientEvents.CHANNEL_DELETE, payload);
  }

  [GatewayDispatchEvents.CHANNEL_PINS_ACK](data: GatewayRawEvents.ChannelPinsAck) {

  }

  [GatewayDispatchEvents.CHANNEL_PINS_UPDATE](data: GatewayRawEvents.ChannelPinsUpdate) {
    let channel: Channel | null = null;
    if (this.client.channels.has(data['channel_id'])) {
      channel = this.client.channels.get(data['channel_id'])!;
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
    let differences: GatewayClientEvents.Differences = null;
    let old: Channel | null = null;

    const isListening = this.client.hasEventListener(ClientEvents.CHANNEL_UPDATE);
    if (this.client.channels.has(data['id'])) {
      channel = this.client.channels.get(data['id'])!;
      if (isListening) {
        differences = channel.differences(data);
        old = channel.clone();
      }
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
      this.client.channels.insert(channel);
    }

    const payload: GatewayClientEvents.ChannelUpdate = {channel, differences, old};
    this.client.emit(ClientEvents.CHANNEL_UPDATE, payload);
  }

  [GatewayDispatchEvents.CHANNEL_RECIPIENT_ADD](data: GatewayRawEvents.ChannelRecipientAdd) {
    let channel: ChannelDM | null = null;
    const channelId = data['channel_id'];
    const nick = data['nick'] || null;
    let user: User;

    if (this.client.users.has(data['user']['id'])) {
      user = this.client.users.get(data['user']['id'])!;
      user.merge(data);
    } else {
      user = new User(this.client, data);
      this.client.users.insert(user);
    }

    if (this.client.channels.has(channelId)) {
      channel = this.client.channels.get(channelId) as ChannelDM;
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
      user = this.client.users.get(data['user']['id'])!;
      user.merge(data);
    } else {
      user = new User(this.client, data);
      this.client.users.insert(user);
    }

    if (this.client.channels.has(channelId)) {
      channel = this.client.channels.get(channelId) as ChannelDM;
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
      user = this.client.users.get(data['user']['id'])!;
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
      user = this.client.users.get(data['user']['id'])!;
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
      guild = this.client.guilds.get(data['id'])!;
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
      guild = this.client.guilds.get(data['id'])!;
      guild.merge(data);
      isNew = false;
    } else {
      guild = new Guild(this.client, data);
      this.client.guilds.insert(guild);
      isNew = true;
    }

    if (!isUnavailable) {
      guild.left = true;
      const me = guild.me;
      if (me) {
        me.left = true;
      }
      for (let [interactionId, interaction] of this.client.interactions) {
        if (interaction.guildId === guildId) {
          Object.defineProperty(interaction, '_deleted', {value: true});
          this.client.interactions.delete(interactionId);
        }
      }
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
              const typings = this.client.typings.get(channelId)!;
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
          message.deleted = true;
          this.client.messages.delete(messageId);
          this.handler._componentHandler.delete(messageId);
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
    let differences: {
      created: BaseCollection<string, Emoji>,
      deleted: BaseCollection<string, Emoji>,
      updated: BaseCollection<string, {emoji: Emoji, old: Emoji}>,
    } | null = null;
    let emojis: BaseCollection<string, Emoji>;
    let guild: Guild | null = null;
    const guildId = data['guild_id'];

    if (this.client.guilds.has(guildId)) {
      guild = this.client.guilds.get(guildId)!;
      if (this.client.hasEventListener(ClientEvents.GUILD_EMOJIS_UPDATE)) {
        differences = {
          created: new BaseCollection<string, Emoji>(),
          deleted: new BaseCollection<string, Emoji>(),
          updated: new BaseCollection<string, {emoji: Emoji, old: Emoji}>(),
        };
        const unchanged = new BaseSet<string>();

        // go through each one
        for (let raw of data['emojis']) {
          Object.assign(raw, {guild_id: guildId});
          const emojiId = raw.id!;

          if (guild.emojis.has(emojiId)) {
            // updated
            const emoji = guild.emojis.get(emojiId)!;
            if (emoji.hasDifferences(raw)) {
              differences.updated.set(emojiId, {
                emoji,
                old: emoji.clone(),
              });
              emoji.merge(raw);
            } else {
              unchanged.add(emojiId);
            }
          } else {
            // created
            differences.created.set(emojiId, new Emoji(this.client, raw));
          }
        }
        for (let [emojiId, emoji] of guild.emojis) {
          if (!unchanged.has(emojiId) && !differences.updated.has(emojiId)) {
            differences.deleted.set(emojiId, emoji);
            guild.emojis.delete(emojiId);
          }
        }
        for (let [emojiId, emoji] of differences.created) {
          guild.emojis.set(emojiId, emoji);
        }
      } else {
        guild.merge({emojis: data['emojis']});
      }
      emojis = guild.emojis;
    } else {
      emojis = new BaseCollection();
      for (let raw of data['emojis']) {
        Object.assign(raw, {guild_id: guildId});
        const emojiId = raw.id!;

        const emoji = new Emoji(this.client, raw);
        emojis.set(emojiId, emoji);
      }
    }

    const payload: GatewayClientEvents.GuildEmojisUpdate = {differences, emojis, guild, guildId};
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
      member = this.client.members.get(guildId, userId)!;
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
          const guild = this.client.guilds.get(guildId)!;
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
      user = this.client.users.get(userId)!;
      user.merge(data['user']);
    } else {
      user = new User(this.client, data['user']);
    }

    if (this.client.members.has(guildId, userId)) {
      member = this.client.members.get(guildId, userId)!;
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
          const guild = this.client.guilds.get(guildId)!;
          guild.memberCount--;
        }
      }
      this.handler.duplicateMemberEventsCache.set(key, GatewayDispatchEvents.GUILD_MEMBER_REMOVE);
    }

    if (this.client.presences.has(userId)) {
      const presence = this.client.presences.get(userId)!;
      presence._deleteGuildId(guildId);
      if (!presence.guildIds.length) {
        this.client.presences.delete(userId);
      }
    }

    for (let [cacheId, cache] of this.client.typings.caches) {
      if (cache.has(userId)) {
        const typing = cache.get(userId)!;
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
    let differences: GatewayClientEvents.Differences = null;
    let member: Member;
    let old: Member | null = null;
    let oldUser: User | null = null;

    const guildId: string = data['guild_id'];
    const userId: string = data['user']['id'];

    if (this.client.hasEventListener(ClientEvents.USERS_UPDATE)) {
      if (this.client.users.has(userId)) {
        const user = this.client.users.get(userId)!;
        const userDifferences = user.differences(data['user']);
        if (userDifferences) {
          differences = {user: userDifferences};
          oldUser = user.clone();
        }
      }
    }

    const isListening = this.client.hasEventListener(ClientEvents.GUILD_MEMBER_UPDATE);
    if (this.client.members.has(guildId, userId)) {
      member = this.client.members.get(guildId, userId)!;
      if (isListening) {
        const memberDifferences = member.differences(data);
        if (differences) {
          Object.assign(differences, memberDifferences);
        } else {
          differences = memberDifferences;
        }
        old = member.clone();
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
        old: oldUser,
        user: member.user,
      };
      this.client.emit(ClientEvents.USERS_UPDATE, payload);
    }

    const payload: GatewayClientEvents.GuildMemberUpdate = {differences, guildId, member, old, userId};
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
          let rawUser = value.user as GatewayRawEvents.RawUser;
          let member: Member;
          if (this.client.members.has(guildId, rawUser.id)) {
            member = this.client.members.get(guildId, rawUser.id)!;
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
          let raw = value.user as GatewayRawEvents.RawUser;
          let user: User;
          if (this.client.users.has(raw.id)) {
            user = this.client.users.get(raw.id)!;
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
      guild = this.client.guilds.get(guildId)!;
      if (guild.roles.has(data['role']['id'])) {
        role = guild.roles.get(data['role']['id'])!;
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
      guild = this.client.guilds.get(guildId)!;
      if (guild.roles.has(roleId)) {
        role = guild.roles.get(roleId)!;
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
    let differences: GatewayClientEvents.Differences = null;
    let guild: Guild | null = null;
    let old: Role | null = null;
    let role: Role;

    const guildId = data['guild_id'];
    const roleId = data['role']['id'];

    const isListening = this.client.hasEventListener(ClientEvents.GUILD_ROLE_UPDATE);
    if (this.client.guilds.has(guildId)) {
      guild = this.client.guilds.get(guildId)!;
      if (guild.roles.has(roleId)) {
        role = guild.roles.get(roleId)!;
        if (isListening) {
          differences = role.differences(data['role']);
          old = role.clone();
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

    const payload: GatewayClientEvents.GuildRoleUpdate = {differences, guild, guildId, old, role};
    this.client.emit(ClientEvents.GUILD_ROLE_UPDATE, payload);
  }

  [GatewayDispatchEvents.GUILD_STICKERS_UPDATE](data: GatewayRawEvents.GuildStickersUpdate) {
    let differences: {
      created: BaseCollection<string, Sticker>,
      deleted: BaseCollection<string, Sticker>,
      updated: BaseCollection<string, {sticker: Sticker, old: Sticker}>,
    } | null = null;
    let stickers: BaseCollection<string, Sticker>;
    let guild: Guild | null = null;
    const guildId = data['guild_id'];

    if (this.client.guilds.has(guildId)) {
      guild = this.client.guilds.get(guildId)!;
      if (this.client.hasEventListener(ClientEvents.GUILD_STICKERS_UPDATE)) {
        differences = {
          created: new BaseCollection<string, Sticker>(),
          deleted: new BaseCollection<string, Sticker>(),
          updated: new BaseCollection<string, {sticker: Sticker, old: Sticker}>(),
        };
        const unchanged = new BaseSet<string>();

        // go through each one
        for (let raw of data['stickers']) {
          if (guild.stickers.has(raw.id)) {
            // updated
            const sticker = guild.stickers.get(raw.id)!;
            if (sticker.hasDifferences(raw)) {
              differences.updated.set(sticker.id, {
                sticker,
                old: sticker.clone(),
              });
              sticker.merge(raw);
            } else {
              unchanged.add(sticker.id);
            }
          } else {
            // created
            differences.created.set(raw.id, new Sticker(this.client, raw));
          }
        }
        for (let [stickerId, sticker] of guild.stickers) {
          if (!unchanged.has(stickerId) && !differences.updated.has(stickerId)) {
            differences.deleted.set(stickerId, sticker);
            guild.stickers.delete(stickerId);
          }
        }
        for (let [stickerId, sticker] of differences.created) {
          guild.stickers.set(stickerId, sticker);
        }
      } else {
        guild.merge({stickers: data['stickers']});
      }
      stickers = guild.stickers;
    } else {
      stickers = new BaseCollection();
      for (let raw of data['stickers']) {
        const sticker = new Sticker(this.client, raw);
        stickers.set(sticker.id, sticker);
      }
    }

    const payload: GatewayClientEvents.GuildStickersUpdate = {differences, stickers, guild, guildId};
    this.client.emit(ClientEvents.GUILD_STICKERS_UPDATE, payload);
  }

  [GatewayDispatchEvents.GUILD_UPDATE](data: GatewayRawEvents.GuildUpdate) {
    let differences: GatewayClientEvents.Differences = null;
    let guild: Guild;
    let old: Guild | null = null;

    const isListening = this.client.hasEventListener(ClientEvents.GUILD_UPDATE);
    if (this.client.guilds.has(data['id'])) {
      guild = this.client.guilds.get(data['id'])!;
      if (isListening) {
        differences = guild.differences(data);
        old = guild.clone();
      }
      guild.merge(data);
    } else {
      guild = new Guild(this.client, data);
      this.client.guilds.insert(guild);
    }
    guild.hasMetadata = true;

    const payload: GatewayClientEvents.GuildUpdate = {differences, guild, old};
    this.client.emit(ClientEvents.GUILD_UPDATE, payload);
  }

  [GatewayDispatchEvents.INTERACTION_CREATE](data: GatewayRawEvents.InteractionCreate) {
    const interaction = new Interaction(this.client, data);
    this.client.interactions.insert(interaction);

    if (interaction.message && interaction.message.interaction) {
      this.handler._componentHandler.replaceId(interaction.message.interaction.id, interaction.message.id);
    }

    const payload: GatewayClientEvents.InteractionCreate = {_raw: data, interaction};
    this.client.emit(ClientEvents.INTERACTION_CREATE, payload);

    if (interaction.isFromMessageComponent) {
      this.handler._componentHandler.execute(interaction);
    }
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
      message = this.client.messages.get(data['id'])!;
      message.merge(data);
    } else {
      message = new Message(this.client, data);
      this.client.messages.insert(message);
    }

    if (this.client.channels.has(message.channelId)) {
      const channel = this.client.channels.get(message.channelId)!;
      channel.merge({last_message_id: message.id});
    }

    if (this.client.typings.has(message.channelId)) {
      const typings = this.client.typings.get(message.channelId)!;
      if (typings.has(message.author.id)) {
        typing = typings.get(message.author.id)!;
        typing._stop();
      }
    }

    if (message.interaction) {
      if (this.client.interactions.has(message.interaction.id)) {
        const interaction = this.client.interactions.get(message.interaction.id)!;
        interaction.responseId = message.id;
      }
      this.handler._componentHandler.replaceId(message.interaction.id, message.id);
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
      message = this.client.messages.get(messageId)!;
      message.deleted = true;
      this.client.messages.delete(messageId);

      if (message.interaction && this.client.interactions.has(message.interaction.id)) {
        const interaction = this.client.interactions.get(message.interaction.id)!;
        interaction.responseDeleted = true;
        interaction.responseId = messageId;
      }
    } else {
      for (let [interactionId, interaction] of this.client.interactions) {
        if (interaction.responseId === messageId) {
          interaction.responseDeleted = true;
          break;
        }
      }
    }

    this.handler._componentHandler.delete(messageId);

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
        const message = this.client.messages.get(messageId)!;
        message.deleted = true;
        messages.set(messageId, message);
        this.client.messages.delete(messageId);
      } else {
        messages.set(messageId, null);
      }
      this.handler._componentHandler.delete(messageId);
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
      user = this.client.users.get(userId)!;
    }

    if (data.member) {
      if (this.client.members.has(guildId, userId)) {
        member = this.client.members.get(guildId, userId)!;
        member.merge(data.member);
      } else {
        member = new Member(this.client, data.member);
        this.client.members.insert(member);
      }
    }

    const emojiId = data.emoji.id || data.emoji.name;
    if (this.client.messages.has(messageId)) {
      message = this.client.messages.get(messageId)!;
      if (message._reactions && message._reactions.has(emojiId)) {
        reaction = message._reactions.get(emojiId)!;
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
      user = this.client.users.get(userId)!;
    }

    const emojiId = data.emoji.id || data.emoji.name;
    if (this.client.messages.has(messageId)) {
      message = this.client.messages.get(messageId)!;
      if (message._reactions && message._reactions.has(emojiId)) {
        reaction = message._reactions.get(emojiId)!;
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
      message = this.client.messages.get(messageId)!;
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
      message = this.client.messages.get(messageId)!;
      if (message._reactions && message._reactions.has(emojiId)) {
        reaction = message._reactions.get(emojiId)!;
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
    let differences: GatewayClientEvents.Differences = null;
    let guildId = data['guild_id'];
    let isEmbedUpdate: boolean = false;
    let message: Message | null = null;
    let old: Message | null = null;

    const messageId = data['id'];

    if (!data['author']) {
      // an embed update from Discord (URL was unfurled for example)
      isEmbedUpdate = true;
    }

    const isListening = this.client.hasEventListener(ClientEvents.MESSAGE_UPDATE);
    if (this.client.messages.has(messageId)) {
      message = this.client.messages.get(messageId)!;
      if (isListening) {
        differences = message.differences(data);
        old = message.clone();
      }
      message.merge(data);
    } else {
      if (!isEmbedUpdate) {
        // we cannot create a message object from an embed update
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
      old,
      raw: data,
    };
    this.client.emit(ClientEvents.MESSAGE_UPDATE, payload);
  }

  [GatewayDispatchEvents.OAUTH2_TOKEN_REMOVE](data: GatewayRawEvents.Oauth2TokenRemove) {

  }

  [GatewayDispatchEvents.PRESENCE_UPDATE](data: GatewayRawEvents.PresenceUpdate) {
    let differences: GatewayClientEvents.Differences = null;
    const guildId = data['guild_id'] || null;
    let isGuildPresence = !!guildId;
    let member: Member | null = null;
    let old: Presence | null = null;
    let oldUser: User | null = null;
    let presence: Presence;
    let userId = data['user']['id'];
    let wentOffline: boolean = data['status'] === PresenceStatuses.OFFLINE;

    if (this.client.hasEventListener(ClientEvents.USERS_UPDATE)) {
      if (this.client.users.has(userId)) {
        const user = this.client.users.get(userId)!;
        oldUser = user.clone();
        const userDifferences = user.differences(data['user']);
        if (userDifferences) {
          differences = {user: userDifferences};
        }
      }
    }

    if (this.client.hasEventListener(ClientEvents.PRESENCE_UPDATE)) {
      if (this.client.presences.has(userId)) {
        const oldPresence = this.client.presences.get(userId)!;
        const presenceDifferences = oldPresence.differences(data);
        if (differences) {
          Object.assign(differences, presenceDifferences);
        } else {
          differences = presenceDifferences;
        }
        old = oldPresence.clone();
      }
    }
    presence = this.client.presences.insert(data);

    if (guildId) {
      if (this.client.members.has(guildId, userId)) {
        member = this.client.members.get(guildId, userId)!;
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
        old: oldUser,
        user: presence.user,
      };
      this.client.emit(ClientEvents.USERS_UPDATE, payload);
    }

    const payload: GatewayClientEvents.PresenceUpdate = {differences, guildId, isGuildPresence, member, presence, userId, wentOffline};
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
    let differences: GatewayClientEvents.Differences = null;
    let relationship: Relationship;
    let old: Relationship | null = null;
    const userId = data['id'];

    if (this.client.relationships.has(userId)) {
      relationship = this.client.relationships.get(userId)!;
      if (this.client.hasEventListener(ClientEvents.RELATIONSHIP_ADD)) {
        differences = relationship.differences(data);
        old = relationship.clone();
      }
      relationship.merge(data);
    } else {
      relationship = new Relationship(this.client, data);
      this.client.relationships.insert(relationship);
    }

    const payload: GatewayClientEvents.RelationshipAdd = {differences, old, relationship, userId};
    this.client.emit(ClientEvents.RELATIONSHIP_ADD, payload);
  }

  [GatewayDispatchEvents.RELATIONSHIP_REMOVE](data: GatewayRawEvents.RelationshipRemove) {
    let relationship: Relationship;
    const userId = data['id'];

    if (this.client.relationships.has(data['id'])) {
      relationship = this.client.relationships.get(data['id'])!;
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

  [GatewayDispatchEvents.STAGE_INSTANCE_CREATE](data: GatewayRawEvents.StageInstanceCreate) {
    const stageInstance = new StageInstance(this.client, data);

    const payload: GatewayClientEvents.StageInstanceCreate = {stageInstance};
    this.client.emit(ClientEvents.STAGE_INSTANCE_CREATE, payload);
  }

  [GatewayDispatchEvents.STAGE_INSTANCE_DELETE](data: GatewayRawEvents.StageInstanceDelete) {
    let stageInstance: StageInstance;
    if (this.client.stageInstances.has(data['guild_id'], data['id'])) {
      stageInstance = this.client.stageInstances.get(data['guild_id'], data['id'])!;
      this.client.stageInstances.delete(data['guild_id'], data['id']);
    } else {
      stageInstance = new StageInstance(this.client, data);
    }
    stageInstance.deleted = true;

    const payload: GatewayClientEvents.StageInstanceDelete = {stageInstance};
    this.client.emit(ClientEvents.STAGE_INSTANCE_DELETE, payload);
  }

  [GatewayDispatchEvents.STAGE_INSTANCE_UPDATE](data: GatewayRawEvents.StageInstanceUpdate) {
    let differences: GatewayClientEvents.Differences = null;
    let old: StageInstance | null = null;
    let stageInstance: StageInstance;

    if (this.client.stageInstances.has(data['guild_id'], data['id'])) {
      stageInstance = this.client.stageInstances.get(data['guild_id'], data['id'])!;
      if (this.client.hasEventListener(ClientEvents.STAGE_INSTANCE_UPDATE)) {
        differences = stageInstance.differences(data);
        old = stageInstance.clone();
      }
      stageInstance.merge(data);
    } else {
      stageInstance = new StageInstance(this.client, data);
      this.client.stageInstances.insert(stageInstance);
    }

    const payload: GatewayClientEvents.StageInstanceUpdate = {differences, old, stageInstance};
    this.client.emit(ClientEvents.STAGE_INSTANCE_UPDATE, payload);
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

  [GatewayDispatchEvents.THREAD_CREATE](data: GatewayRawEvents.ThreadCreate) {
    let thread: Channel;
    if (this.client.channels.has(data['id'])) {
      thread = this.client.channels.get(data['id'])!;
      thread.merge(data);
    } else {
      thread = createChannelFromData(this.client, data);
      this.client.channels.insert(thread);
    }

    const guild = thread.guild;
    if (guild) {
      guild._threadIds.add(thread.id);
    }

    const payload: GatewayClientEvents.ThreadCreate = {thread};
    this.client.emit(ClientEvents.THREAD_CREATE, payload);
  }

  [GatewayDispatchEvents.THREAD_DELETE](data: GatewayRawEvents.ThreadDelete) {
    let thread: Channel | null = null;
    if (this.client.channels.has(data['id'])) {
      thread = this.client.channels.get(data['id'])!;
      thread.deleted = true;
    }

    const payload: GatewayClientEvents.ThreadDelete = {
      guildId: data['guild_id'],
      id: data['id'],
      parentId: data['parent_id'],
      thread,
      type: data['type'],
    };
    this.client.emit(ClientEvents.THREAD_DELETE, payload);
  }

  [GatewayDispatchEvents.THREAD_LIST_SYNC](data: GatewayRawEvents.ThreadListSync) {

  }

  [GatewayDispatchEvents.THREAD_MEMBER_UPDATE](data: GatewayRawEvents.ThreadMemberUpdate) {
    const isListening = this.client.hasEventListener(ClientEvents.THREAD_MEMBER_UPDATE);

    let differences: GatewayClientEvents.Differences = null;
    let old: ThreadMember | null = null;
    let threadMember: ThreadMember;

    if (this.client.channels.has(data['id'])) {
      const thread = this.client.channels.get(data['id'])!;
      if (thread.member) {
        threadMember = thread.member;
        if (isListening) {
          differences = threadMember.differences(data);
          old = threadMember.clone();
        }
        threadMember.merge(data);
      } else {
        thread.merge({member: data});
        threadMember = thread.member as unknown as ThreadMember;
      }
    } else {
      threadMember = new ThreadMember(this.client, data);
    }

    const payload: GatewayClientEvents.ThreadMemberUpdate = {differences, old, threadMember};
    this.client.emit(ClientEvents.THREAD_MEMBER_UPDATE, payload);
  }

  [GatewayDispatchEvents.THREAD_MEMBERS_UPDATE](data: GatewayRawEvents.ThreadMembersUpdate) {
    
  }

  [GatewayDispatchEvents.THREAD_UPDATE](data: GatewayRawEvents.ThreadUpdate) {
    let thread: Channel;
    let differences: GatewayClientEvents.Differences = null;
    let old: Channel | null = null;

    const isListening = this.client.hasEventListener(ClientEvents.THREAD_UPDATE);
    if (this.client.channels.has(data['id'])) {
      thread = this.client.channels.get(data['id'])!;
      if (isListening) {
        differences = thread.differences(data);
        old = thread.clone();
      }
      thread.merge(data);
    } else {
      thread = createChannelFromData(this.client, data);
      this.client.channels.insert(thread);
    }

    const payload: GatewayClientEvents.ThreadUpdate = {differences, old, thread};
    this.client.emit(ClientEvents.THREAD_UPDATE, payload);
  }

  [GatewayDispatchEvents.TYPING_START](data: GatewayRawEvents.TypingStart) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    let typing: Typing;
    const userId = data['user_id'];

    if (this.client.typings.has(channelId, userId)) {
      typing = this.client.typings.get(channelId, userId)!;
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
      user = this.client.users.get(userId)!;
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
    let differences: GatewayClientEvents.Differences = null;
    let old: UserMe | null = null;
    let user: UserMe;

    if (this.client.user) {
      user = this.client.user;
      if (this.client.hasEventListener(ClientEvents.USER_UPDATE)) {
        differences = user.differences(data);
        old = user.clone();
      }
      user.merge(data);
    } else {
      user = new UserMe(this.client, data);
      this.client.user = user;
      this.client.users.insert(user);
    }

    const payload: GatewayClientEvents.UserUpdate = {differences, old, user};
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
    let differences: GatewayClientEvents.Differences = null;
    let joinedChannel = false;
    let leftChannel = false;
    let old: VoiceState | null = null;
    let voiceState: VoiceState;

    const serverId = data['guild_id'] || data['channel_id'];
    if (this.client.voiceStates.has(serverId, data['user_id'])) {
      voiceState = this.client.voiceStates.get(serverId, data['user_id'])!;
      if (this.client.hasEventListener(ClientEvents.VOICE_STATE_UPDATE)) {
        differences = voiceState.differences(data);
        old = voiceState.clone();
      }
      voiceState.merge(data);
      if (!data['channel_id']) {
        this.client.voiceStates.delete(serverId, data['user_id']);
        leftChannel = true;
      }
    } else {
      joinedChannel = true;
      voiceState = new VoiceState(this.client, data);
      this.client.voiceStates.insert(voiceState);
    }

    const payload: GatewayClientEvents.VoiceStateUpdate = {differences, joinedChannel, leftChannel, old, voiceState};
    this.client.emit(ClientEvents.VOICE_STATE_UPDATE, payload);
  }

  [GatewayDispatchEvents.WEBHOOKS_UPDATE](data: GatewayRawEvents.WebhooksUpdate) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];

    const payload: GatewayClientEvents.WebhooksUpdate = {channelId, guildId};
    this.client.emit(ClientEvents.WEBHOOKS_UPDATE, payload);
  }
}
