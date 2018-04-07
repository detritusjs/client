'use strict';

const BaseCollection = require('../Collections/BaseCollection.js');

const Structures = require('../Structures');
const Constants = require('../Utils').Constants;

class GatewayHandler
{
    constructor(gateway, disabledEvents)
    {
        this.gateway = gateway;
        this.client = this.gateway.client;

        this.disabledEvents = new Set(disabledEvents || []);
        this.memberChunksLeft = new Set();
    }

    event(packet)
    {
        if (this.disabledEvents.has(packet.t)) {return;}
        const handle = this[`_${packet.t.toLowerCase()}`];
        if (handle) {
            handle.call(this, packet.t, packet.d);
        } else {
            this.unknown(packet.t, packet.d);
            console.log('UNKNOWN PACKET', packet);
        }
    }

    unknown(name, data)
    {
        this.client.emit(name, data);
    }

    _ready(name, data)
    {
        this.gateway.sessionId = data['session_id'];
        this.gateway.discordTrace = data['_trace'];
        this.client.user = new Structures.UserSelf(this.client, data.user);
        this.client.isBot = this.client.user.bot;
        this.client.users.update(this.client.user);

        if (this.client.channels.enabled) {
            for (let raw of data['private_channels']) {
                if (this.client.channels.has(raw.id)) {
                    this.client.channels.get(raw.id).merge(raw);
                } else {
                    this.client.channels.update(Structures.Channel.create(this.client, raw));
                }
            }
        }

        if (this.client.guilds.enabled) {
            for (let raw of data.guilds) {
                if (this.client.guilds.has(raw.id)) {
                    this.client.guilds.get(raw.id).merge(raw);
                } else {
                    this.client.guilds.update(new Structures.Guild(this.client, raw));
                    if (this.gateway.loadAllMembers) {
                        this.memberChunksLeft.add(raw.id);
                    }
                }
            }
        }

        data['relationships'].forEach((relationship) => {

        });

        data['presences'].forEach((presence) => {

        });

        //data['user_settings'] is {}

        this.client.emit(`GATEWAY_${name}`, {
            unavailableGuilds: this.client.guilds.filter((g) => g.unavailable).length
        });
    }

    _resumed(name, data)
    {
        this.gateway.discordTrace = data['_trace'];
        this.client.emit(`GATEWAY_${name}`, {
            raw: data
        });
    }

    _channel_create(name, data)
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

        this.client.emit(name, payload);
    }

    _channel_update(name, data)
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

        this.client.emit(name, payload);
    }

    _channel_delete(name, data)
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

        this.client.emit(name, payload);
    }

    _channel_pins_update(name, data)
    {
        const payload = {
            channel: null,
            raw: data
        };

        if (this.client.channels.has(data['channel_id'])) {
            payload.channel = this.client.channels.get(data['channel_id']);
            payload.channel.merge({
                'last_pin_timestamp': data['last_pin_timestamp']
            });
        }
        
        this.client.emit(name, payload);
    }

    _guild_ban_add(name, data)
    {
        const payload = {
            user: null,
            guild: null,
            raw: data
        };

        if (this.client.guilds.has(data['guild_id'])) {
            payload.guild = this.client.guilds.get(data['guild_id']);
        }

        if (this.client.users.has(data.id)) {
            payload.user = this.client.users.get(data.id);
        }
        //add to guild?
        this.client.emit(name, payload);
    }

    _guild_ban_remove(name, data)
    {
        const payload = {
            user: null,
            guild: null,
            raw: data
        };

        if (this.client.guilds.has(data['guild_id'])) {
            payload.guild = this.client.guilds.get(data['guild_id']);
        }

        if (this.client.users.has(data.id)) {
            payload.user = this.client.users.get(data.id);
        }
        //remove from guild?
        this.client.emit(name, payload);
    }

    _guild_create(name, data)
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
            this.client.guilds.update(payload.guild);
            this.memberChunksLeft.add(payload.guild.id);
        }

        if (this.memberChunksLeft.has(payload.guild.id)) {
            if (this.gateway.loadAllMembers && this.gateway.largeThreshold < payload.guild.memberCount) {
                this.gateway.send(Constants.OpCodes.Gateway.REQUEST_GUILD_MEMBERS, {
                    'guild_id': payload.guild.id,
                    query: '',
                    limit: 0
                });
            }
            this.memberChunksLeft.delete(payload.guild.id);
        }

        this.client.emit(name, payload);
    }

    _guild_delete(name, data)
    {
        const payload = {
            guild: null,
            isUnavailable: ('unavailable' in data),
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
            this.client.members.delete(data.id);
            this.client.presences.delete(null, data.id);
            this.client.emojis.forEach((emoji) => {
                if (emoji.guildId !== data.id) {return;}
                this.client.emojis.delete(emoji.id);
            });
        }

        this.client.emit(name, payload);
    }

    _guild_emojis_update(name, data)
    {
        const payload = {
            guild: null,
            old: null,
            new: null,
            raw: data
        };

        if (this.client.guilds.has(data['guild_id'])) {
            payload.guild = this.client.guilds.get(data['guild_id']);
            payload.old = payload.guild.emojis;

            payload.guild.merge({
                'emojis': data['emojis']
            });

            payload.new = payload.guild.emojis;
        }

        this.client.emit(name, payload);
    }

    _guild_integrations_update(name, data)
    {
        const payload = {
            guild: null,
            raw: data
        };

        if (this.client.guilds.has(data['guild_id'])) {
            payload.guild = this.client.guilds.get(data['guild_id']);
        }

        this.client.emit(name, payload);
    }

    _guild_member_add(name, data)
    {
        const payload = {
            member: null
        };
        
        if (this.client.members.has(data['guild_id'], data.user.id)) {
            payload.member = this.client.members.get(data['guild_id'], data.user.id);
            payload.member.merge(data);
        } else {
            payload.member = new Structures.Member(this.client, data);
            this.client.members.update(payload.member);
        }

        this.client.emit(name, payload);
    }

    _guild_member_remove(name, data)
    {
        //work on later (maybe delete user if out of scope)
        const payload = {
            guildId: data['guild_id'],
            user: null
        };

        if (this.client.members.has(data['guild_id'], data.user.id)) {
            this.client.members.delete(data['guild_id'], data.user.id);
        }

        if (this.client.users.has(data.user.id)) {
            payload.user = this.client.users.get(data.user.id);
        } else {
            payload.user = new Structures.User(this.client, data.user);
        }

        this.client.emit(name, payload);
    }

    _guild_member_update(name, data)
    {
        const payload = {
            old: null,
            new: null,
            guildId: data['guild_id']
        };

        if (this.client.members.has(data['guild_id'], data.user.id)) {
            payload.new = this.client.members.get(data['guild_id'], data.user.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.Member(this.client, data);
            this.client.members.update(payload.new);
        }

        this.client.emit(name, payload);
    }

    _guild_members_chunk(name, data)
    {
        if (!this.client.members.enabled && !this.client.users.enabled) {
            return;
        }

		if (this.client.members.enabled) {
			for (let value of data.members) {
				if (this.client.members.has(data['guild_id'], value.user.id)) { 
					this.client.members.get(data['guild_id'], value.user.id).merge(value);
				} else {
					Object.assign(value, {'guild_id': data['guild_id']});
					this.client.members.update(new Structures.Member(this.client, value));
				}
			}
		} else {
			for (let value of data.members) {
				if (this.client.users.has(value.user.id)) { 
					this.client.users.get(value.user.id).merge(value.user);
				} else {
					this.client.users.update(new Structures.User(this.client, value.user));
				}
			}
		}

        this.client.emit(name, {
            guildId: data['guild_id']
        });
    }

    _guild_role_create(name, data)
    {
        const payload = {
            guild: null,
            guildId: data['guild_id'],
            role: null
        };

        if (this.client.guilds.has(data['guild_id'])) {
            payload.guild = this.client.guilds.get(data['guild_id']);
            if (payload.guild.roles.has(data['role']['id'])) {
                payload.role = payload.guild.roles.get(data['role']['id']);
                payload.role.merge(data['role']);
            } else {
                payload.role = new Structures.Role(this.client, Object.assign(data['role'], {guild_id: data['guild_id']}));
                payload.guild.roles.set(data['role']['id'], payload.role);
            }
        } else {
            payload.role = new Structures.Role(this.client, Object.assign(data['role'], {guild_id: data['guild_id']}));
        }

        this.client.emit(name, payload);
    }

    _guild_role_delete(name, data)
    {
        const payload = {
            guild: null,
            guildId: data['guild_id'],
            role: null,
            roleId: data['role_id']
        };

        if (this.client.guilds.has(data['guild_id'])) {
            payload.guild = this.client.guilds.get(data['guild_id']);
            if (payload.guild.roles.has(data['role_id'])) {
                payload.role = payload.guild.roles.get(data['role_id']);
                payload.guild.roles.delete(data['role_id']);
            }
        }

        this.client.emit(name, payload);
    }

    _guild_role_update(name, data)
    {
        const payload = {
            guild: null,
            guildId: data['guild_id'],
            old: null,
            new: null
        };

        if (this.client.guilds.has(data['guild_id'])) {
            payload.guild = this.client.guilds.get(data['guild_id']);
            if (payload.guild.roles.has(data['role']['id'])) {
                payload.new = payload.guild.roles.get(data['role']['id']);
                payload.old = payload.new.clone();
                payload.new.merge(data['role']);
            } else {
                payload.new = new Structures.Role(this.client, Object.assign(data['role'], {guild_id: data['guild_id']}));
                payload.guild.roles.set(data['role']['id'], payload.new);
            }
        } else {
            payload.new = new Structures.Role(this.client, Object.assign(data['role'], {guild_id: data['guild_id']}));
        }

        this.client.emit(name, payload);
    }

    _guild_update(name, data)
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

        this.client.emit(name, payload);
    }

    _message_create(name, data)
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

        this.client.emit(name, payload);
    }

    _message_delete(name, data)
    {
        const payload = {
            id: data.id,
            channelId: data['channel_id'],
            old: null
        };

        if (this.client.messages.has(data.id)) {
            payload.old = this.client.messages.get(data.id).clone();
            this.client.messages.delete(data.id);
        }

        this.client.emit(name, payload);
    }

    _message_delete_bulk(name, data)
    {
        const payload = {
            messages: new BaseCollection(),
            channelId: data['channel_id']
        };

        data['ids'].forEach((messageId) => {
            if (this.client.messages.has(messageId)) {
                payload.messages.set(messageId, this.client.messages.get(messageId).clone());
                this.client.messages.delete(messageId);
            } else {
                payload.messages.set(messageId, null);
            }
        });

        this.client.emit(name, payload);
    }

    _message_reaction_add(name, data)
    {
        const payload = {
            message: null,
            user: null,
            reaction: null
        };

        if (this.client.users.has(data['user_id'])) {
            payload.user = this.client.users.get(data['user_id']);
        }

        if (this.client.messages.has(data['message_id'])) {
            payload.message = this.client.messages.get(data['message_id']);
            if (payload.message.reactions.has(data['emoji']['id'] || data['emoji']['name'])) {
                payload.reaction = payload.message.reactions.get(data['emoji']['id'] || data['emoji']['name']);
            }
        }

        if (!payload.reaction) {
            payload.reaction = new Structures.Reaction(this.client, {
                'emoji': data['emoji'],
                'channel_id': data['channel_id'],
                'message_id': data['message_id']
            });
            if (payload.message) {
                payload.message.reactions.set(data['emoji']['id'] || data['emoji']['name'], payload.reaction);
            }
        }

        payload.reaction.merge({
            'count': payload.reaction.count + 1,
            'me': (data['user_id'] === this.client.user.id) || payload.reaction.me
        });

        this.client.emit(name, payload);
    }

    _message_reaction_remove(name, data)
    {
        const payload = {
            message: null,
            user: null,
            reaction: null
        };

        if (this.client.users.has(data['user_id'])) {
            payload.user = this.client.users.get(data['user_id']);
        }

        if (this.client.messages.has(data['message_id'])) {
            payload.message = this.client.messages.get(data['message_id']);
            if (payload.message.reactions.has(data['emoji']['id'] || data['emoji']['name'])) {
                payload.reaction = payload.message.reactions.get(data['emoji']['id'] || data['emoji']['name']);
                payload.reaction.merge({
                    'count': payload.reaction.count - 1,
                    'me': payload.reaction.me && data['user_id'] !== this.client.user.id
                });
                if (payload.reaction.count <= 0) {
                    payload.message.reactions.delete(data['emoji']['id'] || data['emoji']['name']);
                }
            }
        }

        if (!payload.reaction) {
            payload.reaction = new Structures.Reaction(this.client, {
                'emoji': data['emoji'],
                'channel_id': data['channel_id'],
                'message_id': data['message_id']
            });
        }

        this.client.emit(name, payload);
    }

    _message_reaction_remove_all(name, data)
    {
        const payload = {
            message: null,
            raw: data
        };
        if (this.client.messages.has(data['message_id'])) {
            payload.message = this.client.messages.get(data['message_id']);
            payload.message.reactions.clear();
        }

        this.client.emit(name, payload);
    }

    _message_update(name, data)
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

        this.client.emit(name, payload);
    }

    _presence_update(name, data)
    {
        const payload = {
            guildId: data['guild_id'],
            user: null,
            old: null,
            new: null
        };
        if (this.client.users.has(data.user.id)) {
            payload.user = this.client.users.get(data.user.id);
        } else {
            payload.user = new Structures.User(this.client, data.user);
            this.client.users.update(payload.user);
        }
        if (this.client.presences.has(data['guild_id'], data.user.id)) {
            payload.old = this.client.presences.get(data['guild_id'], data.user.id).clone();
        }

        payload.new = new Structures.Presence(this.client, data);
        if (this.client.presences.enabled) {
            this.client.presences.update(data['guild_id'], data.user.id, payload.new);
            if (this.client.presences.storeOffline) {
                payload.new = this.client.presences.get(data['guild_id'], data.user.id);
            } else {
                payload.new = this.client.presences.defaults.OFFLINE;
            }
        }

        //add roles to the member objects

        this.client.emit(name, payload);
    }

    _typing_start(name, data)
    {
        //finished?
        this.client.emit('TYPING_START', {
            user: this.client.users.get(data['user_id']) || null,
            channel: this.client.channels.get(data['channel_id']) || null,
            timestamp: data.timestamp,
            raw: data
        });
    }

    _user_update(name, data)
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
        this.client.emit(name, payload);
    }

    _voice_state_update(name, data)
    {
        const payload = {
            old: null,
            new: null,
            leftChannel: false
        };
        if (this.client.voiceStates.has(data['guild_id'], data['user_id'])) {
            payload.new = this.client.voiceStates.get(data['guild_id'], data['user_id']);
            payload.old = payload.new.clone();
            payload.new.merge(data);
            if (!data['channel_id']) {
                this.client.voiceStates.delete(data['guild_id'], data['user_id']);
                payload.leftChannel = true;
            }
        } else {
            payload.new = new Structures.VoiceState(this.client, data);
            this.client.voiceStates.update(payload.new);
		}
		
		if (payload.new.userId === this.client.user.id && this.client.voiceConnections.has(data['guild_id'])) {
			this.client.voiceConnections.get(data['guild_id'])._state(payload.new);
		}
        this.client.emit(name, payload);
    }

    _voice_server_update(name, data)
    {
		if (this.client.voiceConnections.has(data['guild_id'])) {
			const voiceConnection = this.client.voiceConnections.get(data['guild_id']);
			voiceConnection._connect(data.token, data.endpoint);
		}
		this.client.emit(name, data);
    }

    _webhooks_update(name, data)
    {
        this.client.emit(name, {
            channel: this.client.channels.get(data['channel_id']) || null,
            guild: this.client.guilds.get(data['guild_id']) || null,
            raw: data
        });
    }
}

module.exports = GatewayHandler;