import { Constants as RestConstants } from 'detritus-client-rest';
import { Constants as SocketConstants } from 'detritus-client-socket';

const {
  GatewayDispatchEvents,
  GatewayOpCodes,
} = SocketConstants;

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { ClientEvents } from '../constants';
import { GatewayHTTPError } from '../errors';

import {
  DEFAULT_PRESENCE_CACHE_KEY,
} from '../collections';

import {
  createChannelFromData,
  Channel,
  ChannelDM,
  Emoji,
  Guild,
  Member,
  Message,
  Presence,
  Reaction,
  Relationship,
  Role,
  Typing,
  User,
  UserMe,
  VoiceCall,
  VoiceState,
} from '../structures';

import * as Types from './types';


export interface GatewayHandlerOptions {
  emitRawEvent?: boolean,
  disabledEvents?: Array<string>,
  loadAllMembers?: boolean,
}

export interface GatewayHandlerPayload {
  data: any,
  name: string,
}


/**
 * Gateway Handler
 * @category Handler
 */
export class GatewayHandler {
  client: ShardClient;
  emitRawEvent: boolean;
  disabledEvents: Set<string>;
  loadAllMembers: boolean;
  memberChunksLeft: Set<string>;

  constructor(
    client: ShardClient,
    options: GatewayHandlerOptions = {},
  ) {
    this.client = client;
    this.client.gateway.on('packet', this.onPacket.bind(this));

    this.emitRawEvent = !!options.emitRawEvent;
    this.disabledEvents = new Set((options.disabledEvents || []).map((v) => {
      return v.toUpperCase();
    }));
    this.loadAllMembers = !!options.loadAllMembers;
    this.memberChunksLeft = new Set();
  }

  get gateway() {
    return this.client.gateway;
  }

  onPacket(packet: Types.GatewayPacket): void {
    if (packet.op !== GatewayOpCodes.DISPATCH) {
      return;
    }

    const payload: GatewayHandlerPayload = {name: packet.t, data: packet.d};
    if (this.emitRawEvent) {
      this.client.emit(ClientEvents.RAW_EVENT, payload);
    }
    if (!this.disabledEvents.has(payload.name)) {
      const handler: Function | undefined = Handlers[payload.name];
      if (handler) {
        (<Function> handler).call(this, this, payload.data);
      } else {
        this.client.emit(ClientEvents.UNKNOWN, payload);
        this.client.emit(payload.name, payload.data);
      }
    }
  }
}

export const Handlers: {[key: string]: Function} = {
  async [GatewayDispatchEvents.READY](handler: GatewayHandler, data: Types.Ready) {
    const { client, gateway } = handler;
    client.reset();

    if (client.user === null) {
      client.user = new UserMe(client, data['user']);
    } else {
      client.user.merge(data['user']);
    }
    client.users.insert(client.user); // since we reset the cache

    Object.defineProperty(client, '_isBot', {value: data['user']['bot']});
    client.rest.setAuthType((client.isBot) ? RestConstants.AuthTypes.BOT : RestConstants.AuthTypes.USER);

    if (client.channels.enabled) {
      if (data['private_channels']) {
        for (let raw of data['private_channels']) {
          if (client.channels.has(raw.id)) {
            (<Channel> client.channels.get(raw.id)).merge(raw);
          } else {
            client.channels.insert(createChannelFromData(client, raw));
          }
        }
      }
    }

    if (client.guilds.enabled) {
      for (let raw of data['guilds']) {
        let guild: Guild;
        if (client.guilds.has(raw.id)) {
          guild = <Guild> client.guilds.get(raw.id);
          guild.merge(raw);
        } else {
          guild = new Guild(client, raw);
          client.guilds.insert(guild);
        }
        if (handler.loadAllMembers) {
          if (guild.unavailable) {
            handler.memberChunksLeft.add(guild.id);
          } else {
            if (handler.memberChunksLeft.has(guild.id)) {
              if (gateway.largeThreshold < guild.memberCount) {
                gateway.requestGuildMembers(guild.id, {
                  limit: 0,
                  presences: true,
                  query: '',
                });
              }
              handler.memberChunksLeft.delete(guild.id);
            }
          }
        }
      }
    }

    if (client.notes.enabled && data['notes']) {
      for (let userId in data['notes']) {
        client.notes.insert(userId, data['notes'][userId]);
      }
    }

    if (client.presences.enabled && data['presences']) {
      for (let raw of data['presences']) {
        client.presences.add(raw);
      }
    }

    if (client.relationships.enabled && data['relationships']) {
      for (let raw of data['relationships']) {
        if (client.relationships.has(raw.id)) {
          (<Relationship> client.relationships.get(raw.id)).merge(raw);
        } else {
          client.relationships.insert(new Relationship(client, raw));
        }
      }
    }

    if (client.sessions.enabled && data['sessions']) {
      for (let raw of data['sessions']) {

      }
    }

    if (data['user_settings']) {

    }

    client.gateway.discordTrace = data['_trace'];
    client.emit(ClientEvents.GATEWAY_READY, {raw: data});

    if (client.isBot) {
      try {
        await client.rest.fetchOauth2Application();
      } catch(error) {
        client.emit('warn', new GatewayHTTPError('Failed to fetch OAuth2 Application Information', error));
      }
    } else {
      client.owners.set(client.user.id, client.user);
    }
  },

  [GatewayDispatchEvents.RESUMED]({client}: GatewayHandler, data: Types.Resumed) {
    client.gateway.discordTrace = data['_trace'];;
    client.emit(ClientEvents.GATEWAY_RESUMED, {raw: data});
  },

  [GatewayDispatchEvents.ACTIVITY_JOIN_INVITE]({client}: GatewayHandler, data: Types.ActivityJoinInvite) {

  },

  [GatewayDispatchEvents.ACTIVITY_JOIN_REQUEST]({client}: GatewayHandler, data: Types.ActivityJoinRequest) {

  },

  [GatewayDispatchEvents.ACTIVITY_START]({client}: GatewayHandler, data: Types.ActivityStart) {

  },

  [GatewayDispatchEvents.BRAINTREE_POPUP_BRIDGE_CALLBACK]({client}: GatewayHandler, data: Types.BraintreePopupBridgeCallback) {

  },

  [GatewayDispatchEvents.CALL_CREATE]({client}: GatewayHandler, data: Types.CallCreate) {
    let call: VoiceCall;
    if (client.voiceCalls.has(data['channel_id'])) {
      call = <VoiceCall> client.voiceCalls.get(data['channel_id']);
      call.merge(data);
    } else {
      call = new VoiceCall(client, data);
      client.voiceCalls.insert(call);
    }
    client.emit(ClientEvents.CALL_CREATE, {call});
  },

  [GatewayDispatchEvents.CALL_DELETE]({client}: GatewayHandler, data: Types.CallDelete) {
    if (client.voiceCalls.has(data['channel_id'])) {
      const call = <VoiceCall> client.voiceCalls.get(data['channel_id']);
      call.kill();
    }
    client.emit(ClientEvents.CALL_DELETE, {channelId: data['channel_id']});
  },

  [GatewayDispatchEvents.CALL_UPDATE]({client}: GatewayHandler, data: Types.CallUpdate) {
    let call: VoiceCall;
    let differences: any = null;
    if (client.voiceCalls.has(data['channel_id'])) {
      call = <VoiceCall> client.voiceCalls.get(data['channel_id']);
      if (client.hasEventListener(ClientEvents.CALL_UPDATE)) {
        differences = call.differences(data);
      }
      call.merge(data);
    } else {
      call = new VoiceCall(client, data);
      client.voiceCalls.insert(call);
    }
    client.emit(ClientEvents.CALL_UPDATE, {call, differences});
  },

  [GatewayDispatchEvents.CHANNEL_CREATE]({client}: GatewayHandler, data: Types.ChannelCreate) {
    let channel: Channel;
    if (client.channels.has(data['id'])) {
      channel = <Channel> client.channels.get(data['id']);
      channel.merge(data);
    } else {
      channel = createChannelFromData(client, data);
      client.channels.insert(channel);
    }
    client.emit(ClientEvents.CHANNEL_CREATE, {channel});
  },

  [GatewayDispatchEvents.CHANNEL_DELETE]({client}: GatewayHandler, data: Types.ChannelDelete) {
    let channel: Channel;
    if (client.channels.has(data['id'])) {
      channel = <Channel> client.channels.get(data['id']);
      client.channels.delete(data['id']);
    } else {
      channel = createChannelFromData(client, data);
    }
    client.emit(ClientEvents.CHANNEL_DELETE, {channel});
  },

  [GatewayDispatchEvents.CHANNEL_PINS_ACK]({client}: GatewayHandler, data: Types.ChannelPinsAck) {

  },

  [GatewayDispatchEvents.CHANNEL_PINS_UPDATE]({client}: GatewayHandler, data: Types.ChannelPinsUpdate) {
    let channel: Channel | null = null;
    if (client.channels.has(data['channel_id'])) {
      channel = <Channel> client.channels.get(data['channel_id']);
      channel.merge({
        last_pin_timestamp: data['last_pin_timestamp'],
      });
    }
    client.emit(ClientEvents.CHANNEL_DELETE, {
      channel,
      channelId: data['channel_id'],
      guildId: data['guild_id'],
      lastPinTimestamp: data['last_pin_timestamp'],
    });
  },

  [GatewayDispatchEvents.CHANNEL_UPDATE]({client}: GatewayHandler, data: Types.ChannelUpdate) {
    let channel: Channel;
    let differences: any = null;
    if (client.channels.has(data['id'])) {
      channel = <Channel> client.channels.get(data['id']);
      if (client.hasEventListener(ClientEvents.CHANNEL_UPDATE)) {
        differences = channel.differences(data);
      }
      channel.merge(data);
    } else {
      channel = createChannelFromData(client, data);
      client.channels.insert(channel);
    }
    client.emit(ClientEvents.CHANNEL_UPDATE, {channel, differences});
  },

  [GatewayDispatchEvents.CHANNEL_RECIPIENT_ADD]({client}: GatewayHandler, data: Types.ChannelRecipientAdd) {
    let channel: ChannelDM | null = null;
    const channelId = data['channel_id'];
    const nick = data['nick'];
    let user: User;

    if (client.channels.has(channelId)) {
      channel = <ChannelDM> client.channels.get(channelId);
      if (channel.recipients.has(data['user']['id'])) {
        user = <User> channel.recipients.get(data['user']['id']);
        user.merge(data);
      } else {
        user = new User(client, data['user']);
        channel.recipients.set(user.id, user);
      }
      if (nick == null) {
        channel.nicks.delete(user.id);
      } else {
        channel.nicks.set(user.id, nick);
      }
    } else {
      user = new User(client, data['user']);
      client.users.insert(user);
    }

    client.emit(ClientEvents.CHANNEL_RECIPIENT_ADD, {
      channel,
      channelId,
      nick,
      user,
    });
  },

  [GatewayDispatchEvents.CHANNEL_RECIPIENT_REMOVE]({client}: GatewayHandler, data: Types.ChannelRecipientRemove) {
    let channel: ChannelDM | null = null;
    const channelId = data['channel_id'];
    const nick = data['nick'];
    let user: User;

    if (client.channels.has(channelId)) {
      channel = <ChannelDM> client.channels.get(channelId);
      if (channel.recipients.has(data['user']['id'])) {
        user = <User> channel.recipients.get(data['user']['id']);
        user.merge(data);
        channel.recipients.delete(user.id);
      } else {
        user = new User(client, data['user']);
      }
    } else {
      user = new User(client, data['user']);
    }

    client.emit(ClientEvents.CHANNEL_RECIPIENT_REMOVE, {
      channel,
      channelId,
      nick,
      user,
    });
  },

  [GatewayDispatchEvents.ENTITLEMENT_CREATE]({client}: GatewayHandler, data: Types.EntitlementCreate) {

  },

  [GatewayDispatchEvents.ENTITLEMENT_DELETE]({client}: GatewayHandler, data: Types.EntitlementDelete) {

  },

  [GatewayDispatchEvents.ENTITLEMENT_UPDATE]({client}: GatewayHandler, data: Types.EntitlementUpdate) {

  },

  [GatewayDispatchEvents.FRIEND_SUGGESTION_CREATE]({client}: GatewayHandler, data: Types.FriendSuggestionCreate) {
    client.emit(ClientEvents.FRIEND_SUGGESTION_CREATE, {
      reasons: data.reasons.map((reason: any) => {
        return {name: reason['name'], platformType: reason['platform_type']};
      }),
      user: new User(client, data['suggested_user']),
    });
  },

  [GatewayDispatchEvents.FRIEND_SUGGESTION_DELETE]({client}: GatewayHandler, data: Types.FriendSuggestionDelete) {
    client.emit(ClientEvents.FRIEND_SUGGESTION_DELETE, {
      suggestedUserId: data['suggested_user_id'],
    });
  },

  [GatewayDispatchEvents.GIFT_CODE_UPDATE]({client}: GatewayHandler, data: Types.GiftCodeUpdate) {
    client.emit(ClientEvents.GIFT_CODE_UPDATE, {
      code: data['code'],
      uses: data['uses'],
    });
  },

  [GatewayDispatchEvents.GUILD_BAN_ADD]({client}: GatewayHandler, data: Types.GuildBanAdd) {
    const guild = client.users.get(data['guild_id']);
    const guildId = data['guild_id'];
    let user: User;

    if (client.users.has(data['user']['id'])) {
      user = <User> client.users.get(data['user']['id']);
      user.merge(data['user']);
    } else {
      user = new User(client, data['user']);
    }

    client.emit(ClientEvents.GUILD_BAN_ADD, {
      guild,
      guildId,
      user,
    });
  },

  [GatewayDispatchEvents.GUILD_BAN_REMOVE]({client}: GatewayHandler, data: Types.GuildBanRemove) {
    const guild = client.users.get(data['guild_id']);
    const guildId = data['guild_id'];
    let user: User;

    if (client.users.has(data['user']['id'])) {
      user = <User> client.users.get(data['user']['id']);
      user.merge(data['user']);
    } else {
      user = new User(client, data['user'])
    }

    client.emit(ClientEvents.GUILD_BAN_REMOVE, {
      guild,
      guildId,
      user,
    });
  },

  [GatewayDispatchEvents.GUILD_CREATE](handler: GatewayHandler, data: Types.GuildCreate) {
    const { client, gateway } = handler;

    let fromUnavailable = false;
    let guild: Guild;

    if (client.guilds.has(data['id'])) {
      guild = <Guild> client.guilds.get(data['id']);
      fromUnavailable = guild.unavailable;
      guild.merge(data);
    } else {
      guild = new Guild(client, data);
      client.guilds.insert(guild);
      handler.memberChunksLeft.add(guild.id);
    }

    if (handler.memberChunksLeft.has(guild.id)) {
      if (handler.loadAllMembers) {
        if (gateway.largeThreshold < guild.memberCount) {
          gateway.requestGuildMembers(guild.id, {
            limit: 0,
            presences: true,
            query: '',
          });
        }
      }
      handler.memberChunksLeft.delete(data.id);
    }

    client.emit(ClientEvents.GUILD_CREATE, {
      fromUnavailable,
      guild,
    });
  },

  [GatewayDispatchEvents.GUILD_DELETE]({client}: GatewayHandler, data: Types.GuildDelete) {
    let guild: Guild | null = null;
    const guildId = data['id'];
    const isUnavailable = !!data['unavailable'];

    if (isUnavailable) {
      if (client.guilds.has(data['id'])) {
        guild = <Guild> client.guilds.get(data['id']);
        guild.merge(data);
      } else {
        guild = new Guild(client, data);
        client.guilds.insert(guild);
      }
    } else {
      client.guilds.delete(data['id']);
      client.members.delete(data['id']);
      client.presences.delete(data['id']);
      client.emojis.forEach((emoji: Emoji) => {
        if (emoji.guildId === data['id']) {
          client.emojis.delete(emoji.id);
        }
      });
    }
  
    client.emit(ClientEvents.GUILD_DELETE, {
      guild,
      guildId,
      isUnavailable,
    });
  },

  [GatewayDispatchEvents.GUILD_EMOJIS_UPDATE]({client}: GatewayHandler, data: Types.GuildEmojisUpdate) {
    let emojis: BaseCollection<string, Emoji>;
    let emojisOld: BaseCollection<string, Emoji> | null = null;
    let guild: null | Guild = null;
    const guildId = data['guild_id'];

    if (client.guilds.has(guildId)) {
      guild = <Guild> client.guilds.get(guildId);
      if (client.hasEventListener(ClientEvents.GUILD_EMOJIS_UPDATE)) {
        emojisOld = guild.emojis;
      }
      guild.merge({emojis: data['emojis']});
      emojis = guild.emojis;
    } else {
      emojisOld = new BaseCollection(client.emojis.filter((emoji: Emoji) => {
        return emoji.guildId === guildId;
      }));
      for (let [id, emoji] of emojisOld) {
        if (!data['emojis'].some((e) => e.id === id)) {
          client.emojis.delete(id);
        }
      }
      emojis = new BaseCollection();
      for (let raw of data['emojis']) {
        const emojiId = <string> raw.id;
        let emoji: Emoji;
        if (client.emojis.has(emojiId)) {
          emoji = <Emoji> client.emojis.get(emojiId);
          emoji.merge(raw);
        } else {
          emoji = new Emoji(client, raw);
          emoji.guildId = guildId;
          client.emojis.insert(emoji);
        }
        emojis.set(emoji.id, emoji);
      }
    }

    client.emit(ClientEvents.GUILD_EMOJIS_UPDATE, {
      emojis,
      emojisOld,
      guild,
      guildId,
    });
  },

  [GatewayDispatchEvents.GUILD_INTEGRATIONS_UPDATE]({client}: GatewayHandler, data: Types.GuildIntegrationsUpdate) {
    client.emit(ClientEvents.GUILD_INTEGRATIONS_UPDATE, {
      guildId: data['guild_id'],
    });
  },

  [GatewayDispatchEvents.GUILD_MEMBER_ADD]({client}: GatewayHandler, data: Types.GuildMemberAdd) {
    const guildId = data['guild_id'];
    let member: Member;

    if (client.members.has(guildId, data['user']['id'])) {
      member = <Member> client.members.get(guildId, data['user']['id']);
      member.merge(data);
    } else {
      member = new Member(client, data);
      client.members.insert(member);
    }

    if (client.guilds.has(guildId)) {
      const guild = <Guild> client.guilds.get(guildId);
      guild.merge({
        member_count: guild.memberCount + 1,
      });
    }

    client.emit(ClientEvents.GUILD_MEMBER_ADD, {
      guildId,
      member,
    });
  },

  [GatewayDispatchEvents.GUILD_MEMBER_LIST_UPDATE]({client}: GatewayHandler, data: Types.GuildMemberListUpdate) {
    client.emit(ClientEvents.GUILD_MEMBER_LIST_UPDATE, {
      raw: data,
    });
  },

  [GatewayDispatchEvents.GUILD_MEMBER_REMOVE]({client}: GatewayHandler, data: Types.GuildMemberRemove) {
    const guildId = data['guild_id'];
    let user: User;

    if (client.members.has(guildId, data['user']['id'])) {
      client.members.delete(guildId, data['user']['id']);
    }

    if (client.users.has(data['user']['id'])) {
      user = <User> client.users.get(data['user']['id']);
      user.merge(data['user']);
    } else {
      user = new User(client, data['user']);
    }

    if (client.guilds.has(guildId)) {
      const guild = <Guild> client.guilds.get(guildId);
      guild.merge({
        member_count: guild.memberCount - 1,
      });
    }

    client.emit(ClientEvents.GUILD_MEMBER_REMOVE, {
      guildId,
      user,
    });
  },

  [GatewayDispatchEvents.GUILD_MEMBER_UPDATE]({client}: GatewayHandler, data: Types.GuildMemberUpdate) {
    let differences: any = null;
    const guildId = data['guild_id'];
    let member: Member;

    if (client.members.has(guildId, data['user']['id'])) {
      member = <Member> client.members.get(guildId, data['user']['id']);
      if (client.hasEventListener(ClientEvents.GUILD_MEMBER_UPDATE)) {
        differences = member.differences(data);
      }
      member.merge(data);
    } else {
      member = new Member(client, data);
      client.members.insert(member);
    }

    client.emit(ClientEvents.GUILD_MEMBER_UPDATE, {
      differences,
      guildId,
      member,
    });
  },

  [GatewayDispatchEvents.GUILD_MEMBERS_CHUNK]({client}: GatewayHandler, data: Types.GuildMembersChunk) {
    const amounts: {
      members?: number,
      notFound?: number,
      presences?: number,
    } = {};
    const guildId = data['guild_id'];

    if (data['members'] !== undefined) {
      amounts.members = data['members'].length;
      if (client.members.enabled) {
        for (let value of data['members']) {
          const user = <Types.RawUser> value.user;
          if (client.members.has(guildId, user.id)) {
            (<Member> client.members.get(guildId, user.id)).merge(value);
          } else {
            const member = new Member(client, value);
            member.guildId = guildId;
            client.members.insert(member);
          }
        }
      } else if (client.users.enabled) {
        for (let value of data['members']) {
          const user = <Types.RawUser> value.user;
          if (client.users.has(user.id)) {
            (<User> client.users.get(user.id)).merge(user);
          } else {
            client.users.insert(new User(client, user));
          }
        }
      }
    }

    if (data['not_found'] !== undefined) {
      amounts.notFound = data['not_found'].length;
    }

    if (data['presences'] !== undefined) {
      amounts.presences = data['presences'].length;
      if (client.presences.enabled) {
        for (let value of data['presences']) {
          value.guild_id = guildId;
          client.presences.add(value);
        }
      }
    }

    client.emit(ClientEvents.GUILD_MEMBERS_CHUNK, {
      amounts,
      guildId,
      raw: data,
    });
  },

  [GatewayDispatchEvents.GUILD_ROLE_CREATE]({client}: GatewayHandler, data: Types.GuildRoleCreate) {
    let guild: Guild | null = null;
    const guildId = data['guild_id'];
    let role: Role;

    if (client.guilds.has(guildId)) {
      guild = <Guild> client.guilds.get(guildId);
      if (guild.roles.has(data['role']['id'])) {
        role = <Role> guild.roles.get(data['role']['id']);
        role.merge(data['role']);
      } else {
        data['role']['guild_id'] = guildId;
        role = new Role(client, data['role']);
      }
    } else {
      data['role']['guild_id'] = guildId;
      role = new Role(client, data['role']);
    }

    client.emit(ClientEvents.GUILD_ROLE_CREATE, {
      guild,
      guildId,
      role,
    });
  },

  [GatewayDispatchEvents.GUILD_ROLE_DELETE]({client}: GatewayHandler, data: Types.GuildRoleDelete) {
    let guild: null | Guild = null;
    const guildId = data['guild_id'];
    let role: null | Role = null;
    const roleId = data['role_id'];

    if (client.guilds.has(guildId)) {
      guild = <Guild> client.guilds.get(guildId);
      if (guild.roles.has(roleId)) {
        role = <Role> guild.roles.get(roleId);
        guild.roles.delete(roleId);
      }
    }

    client.emit(ClientEvents.GUILD_ROLE_DELETE, {
      guild,
      guildId,
      role,
      roleId,
    });
  },

  [GatewayDispatchEvents.GUILD_ROLE_UPDATE]({client}: GatewayHandler, data: Types.GuildRoleUpdate) {
    let differences: any = null;
    let guild: null | Guild = null;
    const guildId = data['guild_id'];
    let role: Role;

    if (client.guilds.has(guildId)) {
      guild = <Guild> client.guilds.get(guildId);
      if (guild.roles.has(data['role']['id'])) {
        role = <Role> guild.roles.get(data['role']['id']);
        if (client.hasEventListener(ClientEvents.GUILD_ROLE_UPDATE)) {
          differences = role.differences(data['role']);
        }
        role.merge(data['role']);
      } else {
        data['role']['guild_id'] = guildId;
        role = new Role(client, data['role']);
        guild.roles.set(role.id, role);
      }
    } else {
      data['role']['guild_id'] = guildId;
      role = new Role(client, data['role']);
    }

    client.emit(ClientEvents.GUILD_ROLE_UPDATE, {
      differences,
      guild,
      guildId,
      role,
    });
  },

  [GatewayDispatchEvents.GUILD_UPDATE]({client}: GatewayHandler, data: Types.GuildUpdate) {
    let differences: any = null;
    let guild: Guild;

    if (client.guilds.has(data['id'])) {
      guild = <Guild> client.guilds.get(data['id']);
      if (client.hasEventListener(ClientEvents.GUILD_UPDATE)) {
        differences = guild.differences(data);
      }
      guild.merge(data);
    } else {
      guild = new Guild(client, data);
      client.guilds.insert(guild);
    }

    client.emit(ClientEvents.GUILD_UPDATE, {
      differences,
      guild,
    });
  },

  [GatewayDispatchEvents.LIBRARY_APPLICATION_UPDATE]({client}: GatewayHandler, data: Types.LibraryApplicationUpdate) {

  },

  [GatewayDispatchEvents.LOBBY_CREATE]({client}: GatewayHandler, data: Types.LobbyCreate) {

  },

  [GatewayDispatchEvents.LOBBY_DELETE]({client}: GatewayHandler, data: Types.LobbyDelete) {

  },

  [GatewayDispatchEvents.LOBBY_UPDATE]({client}: GatewayHandler, data: Types.LobbyUpdate) {

  },

  [GatewayDispatchEvents.LOBBY_MEMBER_CONNECT]({client}: GatewayHandler, data: Types.LobbyMemberConnect) {

  },

  [GatewayDispatchEvents.LOBBY_MEMBER_DISCONNECT]({client}: GatewayHandler, data: Types.LobbyMemberDisconnect) {

  },

  [GatewayDispatchEvents.LOBBY_MEMBER_UPDATE]({client}: GatewayHandler, data: Types.LobbyMemberUpdate) {

  },

  [GatewayDispatchEvents.LOBBY_MESSAGE]({client}: GatewayHandler, data: Types.LobbyMessage) {

  },

  [GatewayDispatchEvents.LOBBY_VOICE_SERVER_UPDATE]({client}: GatewayHandler, data: Types.LobbyVoiceServerUpdate) {

  },

  [GatewayDispatchEvents.LOBBY_VOICE_STATE_UPDATE]({client}: GatewayHandler, data: Types.LobbyVoiceStateUpdate) {

  },

  [GatewayDispatchEvents.MESSAGE_ACK]({client}: GatewayHandler, data: Types.MessageAck) {

  },

  [GatewayDispatchEvents.MESSAGE_CREATE]({client}: GatewayHandler, data: Types.MessageCreate) {
    let message: Message;

    if (client.messages.has(data['id'])) {
      message = <Message> client.messages.get(data['id']);
      message.merge(data);
    } else {
      message = new Message(client, data);
      client.messages.insert(message);
    }

    if (client.channels.has(data['channel_id'])) {
      const channel = <Channel> client.channels.get(data['channel_id']);
      channel.merge({last_message_id: data['id']});
    }

    client.emit(ClientEvents.MESSAGE_CREATE, {
      message,
    });
  },

  [GatewayDispatchEvents.MESSAGE_DELETE]({client}: GatewayHandler, data: Types.MessageDelete) {
    let message: Message | null = null;

    if (client.messages.has(data['id'])) {
      message = <Message> client.messages.get(data['id']);
      client.messages.delete(data['id']);
    }

    client.emit(ClientEvents.MESSAGE_DELETE, {
      message,
      raw: data,
    });
  },

  [GatewayDispatchEvents.MESSAGE_DELETE_BULK]({client}: GatewayHandler, data: Types.MessageDeleteBulk) {
    const amount = data['ids'].length;
    let channel: Channel | null = null;
    const channelId = data['channel_id'];
    let guild: Guild | null = null;
    const guildId = data['guild_id'];
    const messages = new BaseCollection<string, Message | null>();

    for (let messageId of data['ids']) {
      if (client.messages.has(messageId)) {
        messages.set(messageId, <Message> client.messages.get(messageId));
        client.messages.delete(messageId);
      } else {
        messages.set(messageId, null);
      }
    }

    if (client.channels.has(channelId)) {
      channel = <Channel> client.channels.get(channelId);
    }
    if (guildId !== undefined && client.guilds.has(guildId)) {
      guild = <Guild> client.guilds.get(guildId);
    }

    client.emit(ClientEvents.MESSAGE_DELETE_BULK, {
      amount,
      channel,
      channelId,
      guild,
      guildId,
      messages,
      raw: data,
    });
  },

  [GatewayDispatchEvents.MESSAGE_REACTION_ADD]({client}: GatewayHandler, data: Types.MessageReactionAdd) {
    let channel: Channel | null = null;
    const channelId = data['channel_id'];
    let guild: Guild | null = null;
    const guildId = data['guild_id'];
    let message: Message | null = null;
    const messageId = data['message_id'];
    let reaction: null | Reaction = null;
    let user: User | null = null;
    const userId = data['user_id'];

    if (client.users.has(userId)) {
      user = <User> client.users.get(userId);
    }

    const emojiId = data.emoji.id || data.emoji.name;
    if (client.messages.has(messageId)) {
      message = <Message> client.messages.get(messageId);
      if (message.reactions.has(emojiId)) {
        reaction = <Reaction> message.reactions.get(emojiId);
      }
    }

    if (reaction === null) {
      reaction = new Reaction(client, data);
      if (message) {
        message.reactions.set(emojiId, reaction);
      }
    }

    const meUserId = (client.user) ? client.user.id : null;
    reaction.merge({
      count: reaction.count + 1,
      me: (userId === meUserId) || reaction.me,
    });

    if (client.channels.has(channelId)) {
      channel = <Channel> client.channels.get(channelId);
    }
    if (guildId !== undefined && client.guilds.has(guildId)) {
      guild = <Guild> client.guilds.get(guildId);
    }

    client.emit(ClientEvents.MESSAGE_REACTION_ADD, {
      channel,
      channelId,
      guild,
      guildId,
      message,
      messageId,
      reaction,
      user,
      userId,
      raw: data,
    });
  },

  [GatewayDispatchEvents.MESSAGE_REACTION_REMOVE]({client}: GatewayHandler, data: Types.MessageReactionRemove) {
    let channel: Channel | null = null;
    const channelId = data['channel_id'];
    let guild: Guild | null = null;
    const guildId = data['guild_id'];
    let message: Message | null = null;
    const messageId = data['message_id'];
    let reaction: null | Reaction = null;
    let user: User | null = null;
    const userId = data['user_id'];

    if (client.users.has(userId)) {
      user = <User> client.users.get(userId);
    }

    const meUserId = (client.user) ? client.user.id : null;

    const emojiId = data.emoji.id || data.emoji.name;
    if (client.messages.has(messageId)) {
      message = <Message> client.messages.get(messageId);
      if (message.reactions.has(emojiId)) {
        reaction = <Reaction> message.reactions.get(emojiId);
        reaction.merge({
          count: Math.min(reaction.count - 1, 0),
          me: reaction.me && userId !== meUserId,
        });
        if (reaction.count <= 0) {
          message.reactions.delete(emojiId);
        }
      }
    }

    if (reaction === null) {
      reaction = new Reaction(client, data);
    }

    if (client.channels.has(channelId)) {
      channel = <Channel> client.channels.get(channelId);
    }
    if (guildId !== undefined && client.guilds.has(guildId)) {
      guild = <Guild> client.guilds.get(guildId);
    }

    client.emit(ClientEvents.MESSAGE_REACTION_REMOVE, {
      channel,
      channelId,
      guild,
      guildId,
      message,
      messageId,
      reaction,
      user,
      userId,
      raw: data,
    });
  },

  [GatewayDispatchEvents.MESSAGE_REACTION_REMOVE_ALL]({client}: GatewayHandler, data: Types.MessageReactionRemoveAll) {
    let channel: Channel | null = null;
    const channelId = data['channel_id'];
    let guild: Guild | null = null;
    const guildId = data['guild_id'];
    let message: Message | null = null;
    const messageId = data['message_id'];

    if (client.messages.has(messageId)) {
      message = <Message> client.messages.get(messageId);
      message.reactions.clear();
    }

    if (client.channels.has(channelId)) {
      channel = <Channel> client.channels.get(channelId);
    }
    if (guildId !== undefined && client.guilds.has(guildId)) {
      guild = <Guild> client.guilds.get(guildId);
    }

    client.emit(ClientEvents.MESSAGE_REACTION_REMOVE_ALL, {
      channel,
      channelId,
      guild,
      guildId,
      message,
      messageId,
      raw: data,
    });
  },

  [GatewayDispatchEvents.MESSAGE_UPDATE]({client}: GatewayHandler, data: Types.MessageUpdate) {
    let differences: any;
    let message: Message;

    if (client.messages.has(data['id'])) {
      message = <Message> client.messages.get(data['id']);
      if (client.hasEventListener(ClientEvents.MESSAGE_UPDATE)) {
        differences = message.differences(data);
      }
      message.merge(data);
    } else {
      message = new Message(client, data);
      client.messages.insert(message);
    }

    client.emit(ClientEvents.MESSAGE_UPDATE, {
      differences,
      message,
    });
  },

  [GatewayDispatchEvents.OAUTH2_TOKEN_REVOKE]({client}: GatewayHandler, data: Types.Oauth2TokenRevoke) {

  },

  [GatewayDispatchEvents.PRESENCE_UPDATE]({client}: GatewayHandler, data: Types.PresenceUpdate) {
    let differences: any = null;
    let isGuildPresence = !!data['guild_id'];
    let member: Member | null = null;
    let presence: Presence;

    if (client.hasEventListener(ClientEvents.PRESENCE_UPDATE)) {
      const cacheId = data['guild_id'] || DEFAULT_PRESENCE_CACHE_KEY;
      if (client.presences.has(cacheId, data['user']['id'])) {
        differences = (<Presence> client.presences.get(cacheId, data['user']['id'])).differences(data);
      }
    }
    presence = client.presences.add(data);

    if (data['guild_id']) {
      const rawMember = {
        guild_id: data['guild_id'],
        nick: data['nick'],
        premium_since: data['premium_since'],
        roles: data['roles'] || [],
        user: data['user'],
      };
      if (client.members.has(data['guild_id'], data['user']['id'])) {
        member = <Member> client.members.get(data['guild_id'], data['user']['id']);
        member.merge(rawMember);
      } else {
        member = new Member(client, rawMember);
        client.members.insert(member);
      }
    }

    client.emit(ClientEvents.PRESENCE_UPDATE, {
      differences,
      isGuildPresence,
      member,
      presence,
      guildId: data['guild_id'],
    });
  },

  [GatewayDispatchEvents.PRESENCES_REPLACE]({client}: GatewayHandler, data: Types.PresencesReplace) {
    const presences = new BaseCollection<string, Presence>();

    if (data['presences'] != null) {
      for (let raw of data['presences']) {
        // guildId is empty, use default presence cache id
        const presence = client.presences.add(raw);
        presences.set(presence.user.id, presence);
      }
    }

    client.emit(ClientEvents.PRESENCES_REPLACE, {
      presences,
    });
  },

  [GatewayDispatchEvents.RECENT_MENTION_DELETE]({client}: GatewayHandler, data: Types.RecentMentionDelete) {

  },

  [GatewayDispatchEvents.RELATIONSHIP_ADD]({client}: GatewayHandler, data: Types.RelationshipAdd) {
    let differences: any;
    let relationship: Relationship;

    if (client.relationships.has(data['id'])) {
      relationship = <Relationship> client.relationships.get(data['id']);
      if (client.hasEventListener(ClientEvents.RELATIONSHIP_ADD)) {
        differences = relationship.differences(data);
      }
      relationship.merge(data);
    } else {
      relationship = new Relationship(client, data);
      client.relationships.insert(relationship);
    }

    client.emit(ClientEvents.RELATIONSHIP_ADD, {
      differences,
      relationship,
    });
  },

  [GatewayDispatchEvents.RELATIONSHIP_REMOVE]({client}: GatewayHandler, data: Types.RelationshipRemove) {
    let relationship: Relationship;

    if (client.relationships.has(data['id'])) {
      relationship = <Relationship> client.relationships.get(data['id']);
      client.relationships.delete(data['id']);
    } else {
      relationship = new Relationship(client, data);
    }

    client.emit(ClientEvents.RELATIONSHIP_REMOVE, {
      id: data['id'],
      relationship,
      type: data['type'],
    });
  },

  [GatewayDispatchEvents.SESSIONS_UPDATE]({client}: GatewayHandler, data: Types.SessionsUpdate) {

  },

  [GatewayDispatchEvents.STREAM_CREATE]({client}: GatewayHandler, data: Types.StreamCreate) {
    client.emit(ClientEvents.STREAM_CREATE, {
      paused: data['paused'],
      region: data['region'],
      rtcServerId: data['rtc_server_id'],
      streamKey: data['stream_key'],
      viewerIds: data['viewer_ids'],
    });
  },

  [GatewayDispatchEvents.STREAM_DELETE]({client}: GatewayHandler, data: Types.StreamDelete) {
    client.emit(ClientEvents.STREAM_DELETE, {
      reason: data['reason'],
      streamKey: data['stream_key'],
      unavailable: data['unavailable'],
    });
  },

  [GatewayDispatchEvents.STREAM_SERVER_UPDATE]({client}: GatewayHandler, data: Types.StreamServerUpdate) {
    client.emit(ClientEvents.STREAM_SERVER_UPDATE, {
      endpoint: data['endpoint'],
      streamKey: data['stream_key'],
      token: data['token'],
    });
  },

  [GatewayDispatchEvents.STREAM_UPDATE]({client}: GatewayHandler, data: Types.StreamUpdate) {
    client.emit(ClientEvents.STREAM_UPDATE, {
      paused: data['paused'],
      region: data['region'],
      streamKey: data['stream_key'],
      viewerIds: data['viewer_ids'],
    });
  },

  [GatewayDispatchEvents.TYPING_START]({client}: GatewayHandler, data: Types.TypingStart) {
    const channelId = data['channel_id'];
    const guildId = data['guild_id'];
    let typing: Typing;
    const userId = data['user_id'];

    if (client.typing.has(channelId, userId)) {
      typing = <Typing> client.typing.get(channelId, userId);
      typing.merge(data);
    } else {
      typing = new Typing(client, data);
      client.typing.insert(typing);
    }

    client.emit(ClientEvents.TYPING_START, {
      channelId,
      guildId,
      typing,
      userId,
    });
  },

  [GatewayDispatchEvents.USER_ACHIEVEMENT_UPDATE]({client}: GatewayHandler, data: Types.UserAchievementUpdate) {

  },

  [GatewayDispatchEvents.USER_CONNECTIONS_UPDATE]({client}: GatewayHandler, data: Types.UserConnectionsUpdate) {
    // maybe fetch from rest api when this happens to keep cache up to date?
  },

  [GatewayDispatchEvents.USER_FEED_SETTINGS_UPDATE]({client}: GatewayHandler, data: Types.UserFeedSettingsUpdate) {

  },

  [GatewayDispatchEvents.USER_GUILD_SETTINGS_UPDATE]({client}: GatewayHandler, data: Types.UserGuildSettingsUpdate) {

  },

  [GatewayDispatchEvents.USER_NOTE_UPDATE]({client}: GatewayHandler, data: Types.UserNoteUpdate) {
    let user: null | User = null;
    if (client.users.has(data.id)) {
      user = <User> client.users.get(data.id);
    }
    client.notes.insert(data.id, data.note);

    client.emit(ClientEvents.USER_NOTE_UPDATE, {
      note: data.note,
      user,
      userId: data.id,
    });
  },

  [GatewayDispatchEvents.USER_PAYMENT_SOURCES_UPDATE]({client}: GatewayHandler, data: Types.UserPaymentSourcesUpdate) {
    // maybe fetch from rest api when this happens to keep cache up to date?
  },

  [GatewayDispatchEvents.USER_PAYMENTS_UPDATE]({client}: GatewayHandler, data: Types.UserPaymentsUpdate) {
    // maybe fetch from rest api when this happens to keep cache up to date?
  },

  [GatewayDispatchEvents.USER_REQUIRED_ACTION_UPDATE]({client}: GatewayHandler, data: Types.UserRequiredActionUpdate) {

  },

  [GatewayDispatchEvents.USER_SETTINGS_UPDATE]({client}: GatewayHandler, data: Types.UserSettingsUpdate) {
    
  },

  [GatewayDispatchEvents.USER_UPDATE]({client}: GatewayHandler, data: Types.UserUpdate) {
    // this updates client.user, us
    let differences: any = null;
    let user: UserMe;

    if (client.user) {
      user = client.user;
      if (client.hasEventListener(ClientEvents.USER_UPDATE)) {
        differences = user.differences(data);
      }
      user.merge(data);
    } else {
      user = new UserMe(client, data);
      client.user = user;
      client.users.insert(user);
    }
    client.emit(ClientEvents.USER_UPDATE, {differences, user});
  },

  [GatewayDispatchEvents.VOICE_SERVER_UPDATE]({client}: GatewayHandler, data: Types.VoiceServerUpdate) {
    client.emit(ClientEvents.VOICE_SERVER_UPDATE, {
      channelId: data['channel_id'],
      endpoint: data['endpoint'],
      guildId: data['guild_id'],
      token: data['token'],
    });
  },

  [GatewayDispatchEvents.VOICE_STATE_UPDATE]({client}: GatewayHandler, data: Types.VoiceStateUpdate) {
    let differences: any = null;
    let leftChannel = false;
    let voiceState: VoiceState;

    const serverId = data['guild_id'] || data['channel_id'];
    if (client.voiceStates.has(serverId, data['user_id'])) {
      voiceState = <VoiceState> client.voiceStates.get(serverId, data['user_id']);
      if (client.hasEventListener(ClientEvents.VOICE_STATE_UPDATE)) {
        differences = voiceState.differences(data);
      }
      voiceState.merge(data);
      if (!data['channel_id']) {
        client.voiceStates.delete(serverId, data['user_id']);
        leftChannel = true;
      }
    } else {
      voiceState = new VoiceState(client, data);
      client.voiceStates.insert(voiceState);
    }
    client.emit(ClientEvents.VOICE_STATE_UPDATE, {
      differences,
      leftChannel,
      voiceState,
    });
  },

  [GatewayDispatchEvents.WEBHOOKS_UPDATE]({client}: GatewayHandler, data: Types.WebhooksUpdate) {
    client.emit(ClientEvents.WEBHOOKS_UPDATE, {
      channelId: data['channel_id'],
      guildId: data['guild_id'],
    });
  },
};
