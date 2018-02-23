'use strict';

const BaseCollection = require('../Collections/BaseCollection.js');

const Structures = require('../Structures');
const Constants = require('../Utils').Constants;

class GatewayHandler
{
    constructor(gateway)
    {
        this.gateway = gateway;
        this.client = this.gateway.client;

        this.chunksLeft = new Set();
    }

    event(packet)
    {
        const handle = this[`_${packet.t.toLowerCase()}`];
        if (handle) {
            handle.call(this, packet.d);
        } else {
            console.log('UNKNOWN PACKET', packet);
        }
    }

    _ready(data)
    {
        this.gateway.sessionId = data.session_id;
        this.gateway.discordTrace = data._trace;
        this.client.user = new Structures.UserSelf(this.client, data.user);
        this.client.isBot = this.client.user.bot;
        this.client.users.update(this.client.user);

        if (this.client.channels.enabled) {
            for (let value of data['private_channels']) {
                if (this.client.channels.has(value['id'])) {
                    this.client.channels.get(value['id']).merge(value);
                } else {
                    this.client.channels.update(Structures.Channel.create(this.client, value));
                }
            }
        }

        if (this.client.guilds.enabled) {
            for (let value of data['guilds']) {
                if (this.client.guilds.has(value['id'])) {
                    this.client.guilds.get(value['id']).merge(value);
                } else {
                    this.client.guilds.update(new Structures.Guild(this.client, value));
                    if (this.gateway.loadAllMembers) {
                        this.chunksLeft.add(value['id']);
                    }
                }
            }
        }

        data.relationships.forEach((relationship) => {

        });

        data.presences.forEach((presence) => {

        });

        //data.user_settings is {}

        this.client.emit('GATEWAY_READY', {
            unavailableGuilds: this.client.guilds.filter((g) => g.unavailable).length
        });
    }

    _resumed(data)
    {
        this.gateway.discordTrace = data._trace;
        this.client.emit('GATEWAY_RESUMED', {
            raw: data
        });
    }

    _channel_create(data)
    {
        const payload = {
            channel: null
        };

        if (this.client.channels.has(data.id)) {
            payload.channel = this.client.channels.get(data.id);
            payload.channel.merge(data);
        } else {
            payload.channel = Structures.Channel.create(this.client, data);
            this.client.channels.update(payload.channel);
        }

        this.client.emit('CHANNEL_CREATE', payload);
    }

    _channel_update(data)
    {
        const payload = {
            old: null,
            new: null
        };

        if (this.client.channels.has(data.id)) {
            payload.new = this.client.channels.get(data.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = Structures.Channel.create(this.client, data);
            this.client.channels.update(payload.new);
        }

        this.client.emit('CHANNEL_UPDATE', payload);
    }

    _channel_delete(data)
    {
        const payload = {
            old: null
        };

        if (this.client.channels.has(data.id)) {
            payload.old = this.client.channels.get(data.id).clone();
            this.client.channels.delete(data.id);
        } else {
            payload.old = Structures.Channel.create(this.client, data);
        }

        this.client.emit('CHANNEL_DELETE', payload);
    }

    _channel_pins_update(data)
    {
        const payload = {
            channel: null,
            raw: data
        };

        if (this.client.channels.has(data.channel_id)) {
            payload.channel = this.client.channels.get(data.channel_id);
            payload.channel.merge({
                last_pin_timestamp: data.last_pin_timestamp
            });
        }
        
        this.client.emit('CHANNEL_PINS_UPDATE', payload);
    }

    _guild_ban_add(data)
    {
        const payload = {
            user: null,
            guild: null,
            raw: data
        };

        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
        }

        if (this.client.users.has(data.id)) {
            payload.user = this.client.users.get(data.id);
        }
        //add to guild?
        this.client.emit('GUILD_BAN_ADD', payload);
    }

    _guild_ban_remove(data)
    {
        const payload = {
            user: null,
            guild: null,
            raw: data
        };

        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
        }

        if (this.client.users.has(data.id)) {
            payload.user = this.client.users.get(data.id);
        }
        //remove from guild?
        this.client.emit('GUILD_BAN_REMOVE', payload);
    }

    _guild_create(data)
    {
        const payload = {
            guild: null,
            fromUnavailable: false
        };

        if (this.client.guilds.has(data.id)) {
            payload.guild = this.client.guilds.get(data.id);
            payload.fromUnavailable = payload.guild.unavailable;
            payload.guild.merge(data);
        } else {
            payload.guild = new Structures.Guild(this.client, data);
            this.client.guilds.update(guild);
            this.chunksLeft.add(payload.guild.id);
        }

        if (this.chunksLeft.has(payload.guild.id)) {
            if (this.gateway.loadAllMembers && this.gateway.largeThreshold < payload.guild.memberCount) {
                this.gateway.send(Constants.OpCodes.Gateway.REQUEST_GUILD_MEMBERS, {
                    guild_id: payload.guild.id,
                    query: '',
                    limit: 0
                });
            }
            this.chunksLeft.delete(payload.guild.id);
        }

        this.client.emit('GUILD_CREATE', payload);
    }

    _guild_delete(data)
    {
        const payload = {
            guild: this.client.guilds.get(data.id) || null,
            isUnavailable: Object.keys(data).includes('unavailable'),
            raw: data
        };

        if (payload.isUnavailable) {
            if (this.client.guilds.has(data.id)) {
                payload.guild = this.client.guilds.get(data.id);
                payload.guild.merge(data);
            } else {
                payload.guild = new Structures.Guild(this.client, data);
                this.client.guilds.update(payload.guild);
            }
        } else {
            this.client.guilds.delete(data.id);
        }

        this.client.emit('GUILD_DELETE', payload);
    }

    _guild_emojis_update(data)
    {
        const payload = {
            guild: null,
            old: null,
            new: null,
            raw: data
        };

        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
            payload.old = payload.guild.emojis;

            payload.guild.merge({
                emojis: data.emojis
            });

            payload.new = payload.guild.emojis;
        }

        this.client.emit('GUILD_EMOJIS_UPDATE', payload);
    }

    _guild_integrations_update(data)
    {
        const payload = {
            guild: null,
            raw: data
        };

        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
        }

        this.client.emit('GUILD_INTEGRATIONS_UPDATE', payload);
    }

    _guild_member_add(data)
    {
        const payload = {
            member: null
        };
        
        if (this.client.members.has(data.guild_id, data.user.id)) {
            payload.member = this.client.members.get(data.guild_id, data.user.id);
            payload.member.merge(data);
        } else {
            payload.member = new Structures.Member(this.client, data);
            this.client.members.update(payload.member);
        }

        this.client.emit('GUILD_MEMBER_ADD', payload);
    }

    _guild_member_remove(data)
    {
        //work on later (maybe delete user if out of scope)
        const payload = {
            guildId: data.guild_id,
            user: null
        };

        if (this.client.members.has(data.guild_id, data.user.id)) {
            this.client.members.delete(data.guild_id, data.user.id);
        }

        if (this.client.users.has(data.user.id)) {
            payload.user = this.client.users.get(data.user.id);
        } else {
            payload.user = new Structures.User(this.client, data.user);
        }

        /*
        if (this.client.members.has(data.guild_id, data.user.id)) {
            this.client.members.delete(data.guild_id, data.user.id);
        }
        if (!this.client.members.enabled || this.client.members.has(null, data.user.id)) {
            if (this.client.users.has(data.user.id)) {
                payload.user = this.client.users.get(data.user.id);
            } else {
                payload.user = new Structures.User(this.client, data.user);
                this.client.users.update(payload.user);
            }
            payload.inCache = true;

            //might be a memory leak for people who have members disabled
        } else {
            if (this.client.users.has(data.user.id)) {
                this.client.users.delete(data.user.id);
            }
            payload.user = new Structures.User(this.client, data.user);
            payload.inCache = false;
        }
        */

        this.client.emit('GUILD_MEMBER_REMOVE', payload);
    }

    _guild_member_update(data)
    {
        const payload = {
            old: null,
            new: null,
            guildId: data.guild_id
        };

        if (this.client.members.has(data.guild_id, data.user.id)) {
            payload.new = this.client.members.get(data.guild_id, data.user.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.Member(this.client, data);
            this.client.members.update(payload.new);
        }

        this.client.emit('GUILD_MEMBER_UPDATE', payload);
    }

    _guild_members_chunk(data)
    {
        if (!this.client.members.enabled) {
            return;
        }

        data.members.forEach((member) => {
            if (this.client.members.has(data.guild_id, member.user.id)) {
                this.client.members.get(data.guild_id, member.user.id).merge(member);
            } else {
                this.client.members.update(new Structures.Member(this.client, Object.assign(member, {guild_id: data.guild_id})));
            }
        });

        this.client.emit('GUILD_MEMBERS_CHUNK', {
            guildId: data.guild_id
        });
    }

    _guild_role_create(data)
    {
        const payload = {
            guild: null,
            guildId: data.guild_id,
            role: null
        };

        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
            if (payload.guild.roles.has(data.role.id)) {
                payload.role = payload.guild.roles.get(data.role.id);
                payload.role.merge(data.role);
            } else {
                payload.role = new Structures.Role(this.client, Object.assign(data.role, {guild_id: data.guild_id}));
                payload.guild.roles.set(data.role.id, payload.role);
            }
        } else {
            payload.role = new Structures.Role(this.client, Object.assign(data.role, {guild_id: data.guild_id}));
        }

        this.client.emit('GUILD_ROLE_CREATE', payload);
    }

    _guild_role_delete(data)
    {
        const payload = {
            guild: null,
            guildId: data.guild_id,
            role: null,
            roleId: data.role_id
        };

        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
            if (payload.guild.roles.has(data.role_id)) {
                payload.role = payload.guild.roles.get(data.role_id);
                payload.guild.roles.delete(data.role_id);
            }
        }

        this.client.emit('GUILD_ROLE_DELETE', payload);
    }

    _guild_role_update(data)
    {
        const payload = {
            guild: null,
            guildId: data.guild_id,
            old: null,
            new: null
        };

        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
            if (payload.guild.roles.has(data.role.id)) {
                payload.new = payload.guild.roles.get(data.role.id);
                payload.old = payload.new.clone();
                payload.new.merge(data.role);
            } else {
                payload.new = new Structures.Role(this.client, Object.assign(data.role, {guild_id: data.guild_id}));
                payload.guild.roles.set(data.role.id, payload.new);
            }
        } else {
            payload.new = new Structures.Role(this.client, Object.assign(data.role, {guild_id: data.guild_id}));
        }

        this.client.emit('GUILD_ROLE_UPDATE', payload);
    }

    _guild_update(data)
    {
        const payload = {
            old: null,
            new: null
        };

        if (this.client.guilds.has(data.id)) {
            payload.new = this.client.guilds.get(data.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.Guild(this.client, data);
            this.client.guilds.update(payload.new);
        }

        this.client.emit('GUILD_UPDATE', payload);
    }

    _message_create(data)
    {
        const payload = {
            message: null
        };

        if (this.client.messages.has(data.id)) {
            payload.message = this.client.messages.get(data.id);
            payload.message.merge(data);
        } else {
            payload.message = new Structures.Message(this.client, data);
            this.client.messages.update(payload.message);
        }

        this.client.emit('MESSAGE_CREATE', payload);
    }

    _message_delete(data)
    {
        const payload = {
            id: data.id,
            channelId: data.channel_id,
            old: null
        };

        if (this.client.messages.has(data.id)) {
            payload.old = this.client.messages.get(data.id).clone();
            this.client.messages.delete(data.id);
        }

        this.client.emit('MESSAGE_DELETE', payload);
    }

    _message_delete_bulk(data)
    {
        const payload = {
            messages: new BaseCollection(),
            channelId: data.channel_id
        };

        data.ids.forEach((messageId) => {
            if (this.client.messages.has(messageId)) {
                payload.messages.set(messageId, this.client.messages.get(messageId).clone());
                this.client.messages.delete(messageId);
            } else {
                payload.messages.set(messageId, null);
            }
        });

        this.client.emit('MESSAGE_DELETE_BULK', payload);
    }

    _message_reaction_add(data)
    {
        const payload = {
            message: null,
            user: null,
            reaction: null
        };

        if (this.client.users.has(data.user_id)) {
            payload.user = this.client.users.get(data.user_id);
        }

        if (this.client.messages.has(data.message_id)) {
            payload.message = this.client.messages.get(data.message_id);
            if (payload.message.reactions.has(data.emoji.id || data.emoji.name)) {
                payload.reaction = payload.message.reactions.get(data.emoji.id || data.emoji.name);
            }
        }

        if (!payload.reaction) {
            payload.reaction = new Structures.Reaction(this.client, {
                emoji: data.emoji,
                channel_id: data.channel_id,
                message_id: data.message_id
            });
            if (payload.message) {
                payload.message.reactions.set(data.emoji.id || data.emoji.name, payload.reaction);
            }
        }

        payload.reaction.merge({
            count: payload.reaction.count + 1,
            me: (data.user_id === this.client.user.id) || payload.reaction.me
        });

        this.client.emit('MESSAGE_REACTION_ADD', payload);
    }

    _message_reaction_remove(data)
    {
        const payload = {
            message: null,
            user: null,
            reaction: null
        };

        if (this.client.users.has(data.user_id)) {
            payload.user = this.client.users.get(data.user_id);
        }

        if (this.client.messages.has(data.message_id)) {
            payload.message = this.client.messages.get(data.message_id);
            if (payload.message.reactions.has(data.emoji.id || data.emoji.name)) {
                payload.reaction = payload.message.reactions.get(data.emoji.id || data.emoji.name);
                payload.reaction.merge({
                    count: payload.reaction.count - 1,
                    me: payload.reaction.me && data.user_id !== this.client.user.id
                });
                if (payload.reaction.count <= 0) {
                    payload.message.reactions.delete(data.emoji.id || data.emoji.name);
                }
            }
        }

        if (!payload.reaction) {
            payload.reaction = new Structures.Reaction(this.client, {
                emoji: data.emoji,
                channel_id: data.channel_id,
                message_id: data.message_id
            });
        }

        this.client.emit('MESSAGE_REACTION_REMOVE', payload);
    }

    _message_reaction_remove_all(data)
    {
        const payload = {
            message: null,
            raw: data
        };
        if (this.client.messages.has(data.message_id)) {
            payload.message = this.client.messages.get(data.message_id);
            payload.message.reactions.clear();
        }

        this.client.emit('MESSAGE_REACTION_REMOVE_ALL', payload);
    }

    _message_update(data)
    {
        const payload = {
            old: null,
            new: null
        };

        if (this.client.messages.has(data.id)) {
            payload.new = this.client.messages.get(data.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.Message(this.client, data);
            //idk its not in cache and its probably partial, maybe fetch it from the api?
        }

        this.client.emit('MESSAGE_UPDATE', payload);
    }

    _presence_update(data)
    {
        const payload = {
            old: null,
            new: null
        };
        if (this.client.presences.has(data.user.id, data.guild_id)) {
            payload.old = this.client.presences.get(data.user.id, data.guild_id).clone();
            this.client.presences.update(new Structures.Presence(this.client, data));
            payload.new = this.client.presences.get(data.user.id, data.guild_id);
        } else {
            payload.new = new Structures.Presence(this.client, data);
        }

        this.client.emit('PRESENCE_UPDATE', payload);
    }

    _typing_start(data)
    {
        //finished?
        this.client.emit('TYPING_START', {
            user: this.client.users.get(data.user_id) || null,
            channel: this.client.channels.get(data.channel_id) || null,
            timestamp: data.timestamp,
            raw: data
        });
    }

    _user_update(data)
    {
        const payload = {
            old: null,
            new: null
        };
        if (this.client.users.has(data.id)) {
            payload.new = this.client.user.get(data.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.User(this.client, data);
            this.client.users.update(payload.new);
        }
        this.client.emit('USER_UPDATE', payload);
    }

    _voice_state_update(data)
    {
        const payload = {
            old: null,
            new: null,
            leftChannel: false
        };
        if (this.client.voiceStates.has(data.guild_id, data.user_id)) {
            payload.new = this.client.voiceStates.get(data.guild_id, data.user_id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
            if (!data.channel_id) {
                this.client.voiceStates.delete(data.guild_id, data.user_id);
                payload.leftChannel = true;
            }
        } else {
            payload.new = new Structures.VoiceState(this.client, data);
            this.client.voiceStates.update(payload.new);
        }
        this.client.emit('VOICE_STATE_UPDATE', payload);
    }

    _voice_server_update(data)
    {
        console.log('voice_server_update', data);
    }

    _webhooks_update(data)
    {
        this.client.emit('WEBHOOKS_UDPATE', {
            channel: this.client.channels.get(data.channel_id) || null,
            guild: this.client.guilds.get(data.guild_id) || null,
            raw: data
        });
    }
}

module.exports = GatewayHandler;