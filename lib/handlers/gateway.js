const Socket = require('detritus-websocket');
const OpCodes = Socket.Utils.Constants.OpCodes.Gateway;

const BaseCollection = require('../collections').BaseCollection;
const Structures = require('../structures');

const defaults = {
	disabledEvents: [],
	loadAllMembers: false,
	emitRawEvent: false
};

class GatewayHandler {
	constructor(client, options) {
		this.client = client;
		this.gateway = this.client.gateway;

		this.gateway.on('packet', this.handle.bind(this));

		options = Object.assign({}, defaults, options);

		Object.defineProperties(this, {
			disabledEvents: {enumerable: true, value: new Set((options.disabledEvents).map((v) => v.toUpperCase()))},
			memberChunksLeft: {value: new Set()},
			loadAllMembers: {enumerable: true, value: !!options.loadAllMembers},
			emitRawEvent: {enumerable: true, value: !!options.emitRawEvent}
		});
	}

	handle(packet) {
		if (packet.op !== OpCodes.DISPATCH) {return;}

		if (this.emitRawEvent) {
			this.client.emit('RAW_EVENT', {name: packet.t, data: packet.d});
		}

		if (this.disabledEvents.has(packet.t)) {return;}

		const handle = this[`_${packet.t.toLowerCase()}`];
		if (handle) {
			handle.call(this, packet.t, packet.d);
		} else {
			this.unknown(packet.t, packet.d);
		}
	}

	unknown(name, data) {
		this.client.emit('UNKNOWN', {name, data});
		this.client.emit(name, data);
	}

	_ready(name, data) {
		this.client.reset();

		if (this.client.user) {
			this.client.user.merge(data.user);
		} else {
			Object.defineProperty(this.client, 'user', {
				enumerable: true,
				value: new Structures.UserFull(this.client, data.user)
			});
		}

		this.client.options.isBot = data.user.bot;
		this.client.rest.setAuthType((this.client.isBot) ? 'bot': 'user');
		this.client.users.insert(this.client.user);

		if (this.client.channels.enabled) {
			for (let raw of data.private_channels) {
				if (this.client.channels.has(raw.id)) {
					this.client.channels.get(raw.id).merge(raw);
				} else {
					this.client.channels.insert(Structures.Channel.create(this.client, raw));
				}
			}
		}

		if (this.client.guilds.enabled) {
			for (let raw of data.guilds) {
				if (this.client.guilds.has(raw.id)) {
					this.client.guilds.get(raw.id).merge(raw);
				} else {
					this.client.guilds.insert(new Structures.Guild(this.client, raw));
				}
				if (raw.unavailable && this.loadAllMembers) {
					this.memberChunksLeft.add(raw.id);
				}
			}
		}

		//for (let raw of data.relationships) {}
		//for (let raw of data.presences) {}
		//data.user_settings;

		this.client.emit(`GATEWAY_${name}`, {raw: data});
	}

	_resumed(name, data) {
		this.gateway.discordTrace = data._trace;
		this.client.emit(`GATEWAY_${name}`, {raw: data});
	}

	_channel_create(name, data) {
		const payload = {channel: null};

		if (this.client.channels.has(data.id)) {
			payload.channel = this.client.channels.get(data.id);
			payload.channel.merge(data);
		} else {
			payload.channel = Structures.Channel.create(this.client, data);
			this.client.channels.insert(payload.channel);
		}

		this.client.emit(name, payload);
	}

	_channel_update(name, data) {
		const payload = {channel: null, differences: null};

		if (this.client.channels.has(data.id)) {
			payload.channel = this.client.channels.get(data.id);
			payload.differences = payload.channel.differences(data);
			payload.channel.merge(data);
		} else {
			payload.channel = Structures.Channel.create(this.client, data);
			this.client.channels.insert(payload.channel);
		}

		this.client.emit(name, payload);
	}

	_channel_delete(name, data) {
		const payload = {channel: null};

		if (this.client.channels.has(data.id)) {
			payload.channel = this.client.channels.get(data.id);
			this.client.channels.delete(data.id);
		} else {
			payload.channel = Structures.Channel.create(this.client, data);
		}

		this.client.emit(name, payload);
	}

	_channel_pins_update(name, data) {
		const payload = {channel: null, raw: data};

		if (this.client.channels.has(data.channel_id)) {
			payload.channel = this.client.channels.get(data.channel_id);
			payload.channel.merge({last_pin_timestamp: data.last_pin_timestamp});
		}

		this.client.emit(name, payload);
	}

	_guild_ban_add(name, data) {
		this.client.emit(name, {
			guild: this.client.guilds.get(data.guild_id),
			user: this.client.users.get(data.id),
			raw: data
		});
	}

	_guild_ban_remove(name, data) {
		this.client.emit(name, {
			guild: this.client.guilds.get(data.guild_id),
			user: this.client.users.get(data.id),
			raw: data
		});
	}

	_guild_create(name, data) {
		const payload = {guild: null, fromUnavailable: false};

		if (this.client.guilds.has(data.id)) {
			payload.guild = this.client.guilds.get(data.id);
			payload.guild.merge(data);
			payload.fromUnavailable = payload.guild.unavailable;
		} else {
			payload.guild = new Structures.Guild(this.client, data);
			this.client.guilds.insert(payload.guild);
			this.memberChunksLeft.add(data.id);
		}

		if (this.memberChunksLeft.has(data.id)) {
			if (this.loadAllMembers && this.gateway.largeThreshold < payload.guild.memberCount) {
				this.gateway.send(OpCodes.REQUEST_GUILD_MEMBERS, {guild_id: data.id, query: '', limit: 0});
			}
			this.memberChunksLeft.delete(data.id);
		}

		this.client.emit(name, payload);
	}

	_guild_delete(name, data) {
		const payload = {guild: null, isUnavailable: ('unavailable' in data), raw: data};

		if (payload.isUnavailable) {
			if (this.client.guilds.has(data.id)) {
				payload.guild = this.client.guilds.get(data.id);
				payload.guild.merge(data);
			} else {
				payload.guild = new Structures.Guild(this.client, data);
				this.client.guilds.insert(payload.guild);
			}
		} else {
			this.client.guilds.delete(data.id);
			this.client.members.delete(data.id);
			this.client.presences.delete(data.id);
			this.client.emojis.forEach((emoji) => (emoji.guildId === data.id) ? this.client.emojis.delete(emoji.id) : null);
		}

		this.client.emit(name, payload);
	}

	_guild_update(name, data) {
		const payload = {guild: null, differences: null};

		if (this.client.guilds.has(data.id)) {
			payload.guild = this.client.guilds.get(data.id);
			payload.differences = payload.guild.differences(data);
			payload.guild.merge(data);
		} else {
			payload.guild = new Structures.Guild(this.client, data);
			this.client.guilds.insert(payload.guild);
		}

		this.client.emit(name, payload);
	}

	_guild_emojis_update(name, data) {
		const payload = {guild: null, old: null, new: null, raw: data};

		if (this.client.guilds.has(data.guild_id)) {
			payload.guild = this.client.guilds.get(data.guild_id);
			payload.old = payload.guild.emojis;

			payload.guild.merge({emojis: data.emojis});

			payload.new = payload.guild.emojis;
		}

		this.client.emit(name, payload);
	}

	_guild_integrations_update(name, data) {
		this.client.emit(name, {
			guild: this.client.guilds.get(data.guild_id),
			raw: data
		});
	}

	_guild_member_add(name, data) {
		const payload = {member: null};

		if (this.client.members.has(data.guild_id, data.user.id)) {
			payload.member = this.client.members.get(data.guild_id, data.user.id);
			payload.member.merge(data);
		} else {
			payload.member = new Structures.Member(this.client, data);
			this.client.members.insert(payload.member);
		}

		if (this.client.guilds.has(data.guild_id)) {
			const guild = this.client.guilds.get(data.guild_id);
			guild.merge({member_count: guild.memberCount + 1});
		}

		this.client.emit(name, payload);
	}

	_guild_member_remove(name, data) {
		const payload = {user: null, raw: data};

		if (this.client.members.has(data.guild_id, data.user.id)) {
			this.client.members.delete(data.guild_id, data.user.id);
		}

		if (this.client.users.has(data.user.id)) {
			payload.user = this.client.users.get(data.user.id);
		} else {
			payload.user = new Structures.User(this.client, data.user);
		}

		if (this.client.guilds.has(data.guild_id)) {
			const guild = this.client.guilds.get(data.guild_id);
			guild.merge({member_count: guild.memberCount - 1});
		}

		this.client.emit(name, payload);
	}

	_guild_member_update(name, data) {
		const payload = {member: null, differences: null, guildId: data.guild_id};

		if (this.client.members.has(data.guild_id, data.user.id)) {
			payload.member = this.client.members.get(data.guild_id, data.user.id);
			payload.differences = payload.member.differences(data);
			payload.member.merge(data);
		} else {
			payload.member = new Structures.Member(this.client, data);
			this.client.members.insert(payload.member);
		}

		this.client.emit(name, payload);
	}

	_guild_members_chunk(name, data) {
		if (this.client.members.enabled) {
			for (let value of data.members) {
				if (this.client.members.has(data.guild_id, value.user.id)) {
					this.client.members.get(data.guild_id, value.user.id).merge(value);
				} else {
					Object.assign(value, {guild_id: data.guild_id});
					this.client.members.insert(new Structures.Member(this.client, value));
				}
			}
		} else if (this.client.users.enabled) {
			for (let value of data.members) {
				if (this.client.users.has(value.user.id)) {
					this.client.users.get(value.user.id).merge(value.user);
				} else {
					this.client.users.insert(new Structures.User(this.client, value.user));
				}
			}
		}

		this.client.emit(name, {guildId: data.guild_id});
	}

	_guild_role_create(name, data) {
		const payload = {guild: null, role: null, guildId: data.guild_id};

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

		this.client.emit(name, payload);
	}

	_guild_role_delete(name, data) {
		const payload = {guild: null, role: null, guildId: data.guild_id, roleId: data.role_id};

		if (this.client.guilds.has(data.guild_id)) {
			payload.guild = this.client.guilds.get(data.guild_id);
			if (payload.guild.roles.has(data.role_id)) {
				payload.role = payload.guild.roles.get(data.role_id);
				payload.guild.roles.delete(data.role_id);
			}
		}

		this.client.emit(name, payload);
	}

	_guild_role_update(name, data) {
		const payload = {guild: null, role: null, differences: null};

		if (this.client.guilds.has(data.guild_id)) {
			payload.guild = this.client.guilds.get(data.guild_id);
			if (payload.guild.roles.has(data.role.id)) {
				payload.role = payload.guild.roles.get(data.role.id);
				payload.differences = payload.role.differences(data.role);
				payload.role.merge(data.role);
			} else {
				payload.role = new Structures.Role(this.client, Object.assign(data.role, {guild_id: data.guild_id}));
				payload.guild.roles.set(data.role.id, payload.role);
			}
		} else {
			payload.role = new Structures.Role(this.client, Object.assign(data.role, {guild_id: data.guild_id}));
		}

		this.client.emit(name, payload);
	}

	_message_create(name, data) {
		const payload = {message: null};

		if (this.client.messages.has(data.id)) {
			payload.message = this.client.messages.get(data.id);
			payload.message.merge(data);
		} else {
			payload.message = new Structures.Message(this.client, data);
			this.client.messages.insert(payload.message);
		}

		if (this.client.channels.has(data.channel_id)) {
			this.client.channels.get(data.channel_id).merge({last_message_id: data.id});
		}

		this.client.emit(name, payload);
	}

	_message_delete(name, data) {
		const payload = {message: null, raw: data};

		if (this.client.messages.has(data.id)) {
			payload.message = this.client.messages.get(data.id);
			this.client.messages.delete(data.id);
		}

		this.client.emit(name, payload);
	}

	_message_delete_bulk(name, data) {
		const payload = {messages: new BaseCollection(), raw: data};

		data.ids.forEach((id) => {
			if (this.client.messages.has(id)) {
				payload.messages.set(id, this.client.messages.get(id));
				this.client.messages.delete(id);
			} else {
				payload.messages.set(id, null);
			}
		});

		this.client.emit(name, payload);
	}

	_message_reaction_add(name, data) {
		const payload = {message: null, reaction: null, user: null, raw: data};

		if (this.client.users.has(data.user_id)) {
			payload.user = this.client.users.get(data.user_id);
		}

		const emojiId = data.emoji.id || data.emoji.name;
		if (this.client.messages.has(data.message_id)) {
			payload.message = this.client.messages.get(data.message_id);
			if (payload.message.reactions.has(emojiId)) {
				payload.reaction = payload.message.reactions.get(emojiId);
			}
		}

		if (!payload.reaction) {
			payload.reaction = new Structures.Reaction(this.client, data);
			if (payload.message) {
				payload.message.reactions.set(emojiId, payload.reaction);
			}
		}

		payload.reaction.merge({
			count: payload.reaction.count + 1,
			me: (data.user_id === this.client.user.id) || payload.reaction.me
		});

		this.client.emit(name, payload);
	}

	_message_reaction_remove(name, data) {
		const payload = {message: null, reaction: null, user: null, raw: data};

		if (this.client.users.has(data.user_id)) {
			payload.user = this.client.users.get(data.user_id);
		}

		const emojiId = data.emoji.id || data.emoji.name;
		if (this.client.messages.has(data.message_id)) {
			payload.message = this.client.messages.get(data.message_id);
			if (payload.message.reactions.has(emojiId)) {
				payload.reaction = payload.message.reactions.get(emojiId);
				payload.reaction.merge({
					count: payload.reaction.count - 1,
					me: payload.reaction.me && data.user_id !== this.client.user.id
				});
				if (payload.reaction.count <= 0) {
					payload.message.reactions.delete(emojiId);
				}
			}
		}

		if (!payload.reaction) {
			payload.reaction = new Structures.Reaction(this.client, data);
		}

		this.client.emit(name, payload);
	}

	_message_reaction_remove_all(name, data) {
		const payload = {message: null, raw: data};

		if (this.client.messages.has(data.message_id)) {
			payload.message = this.client.messages.get(data.message_id);
			payload.message.reactions.clear();
		}

		this.client.emit(name, payload);
	}

	_message_update(name, data) {
		const payload = {message: null, differences: null};

		if (this.client.messages.has(data.id)) {
			payload.message = this.client.messages.get(data.id);
			payload.differences = payload.message.differences(data);
			payload.message.merge(data);
		} else {
			payload.message = new Structures.Message(this.client, data);
			this.client.messages.insert(payload.message);
		}

		this.client.emit(name, payload);
	}

	_presence_update(name, data) {
		const payload = {member: null, old: null, new: null, guildId: data.guild_id};

		if (this.client.presences.has(data.guild_id, data.user.id)) {
			payload.old = this.client.presences.get(data.guild_id, data.user.id);
		}

		if (this.client.presences.enabled) {
			payload.new = this.client.presences.insert(data.guild_id, data.user.id, new Structures.Presence(this.client, data));
		}

		const member = {user: data.user, roles: data.roles || [], nick: data.nick, guild_id: data.guild_id};
		if (this.client.members.has(data.guild_id, data.user.id)) {
			payload.member = this.client.members.get(data.guild_id, data.user.id);
			payload.member.merge(member);
			//should we merge?
		} else {
			payload.member = new Structures.Member(this.client, member);
			this.client.members.insert(payload.member);
		}

		this.client.emit(name, payload);
	}

	_typing_start(name, data) {
		const payload = {member: null, user: null, channel: null, guild: null, timestamp: data.timestamp, raw: data};
		payload.member;

		if (data.member) {
			if (this.client.members.has(data.guild_id, data.user_id)) {
				payload.member = this.client.members.get(data.guild_id, data.user_id);
				payload.member.merge(data.member);
			} else {
				Object.assign(data.member, {guild_id: data.guild_id});
				payload.member = new Structures.Member(this.client, data.member);
				this.client.members.insert(payload.member);
			}
		}

		if (data.guild_id) {
			payload.guild = this.client.guilds.get(data.guild_id);
		}

		payload.user = this.client.users.get(data.user_id);
		payload.channel = this.client.channels.get(data.channel_id);

		//store somehow?
		this.client.emit(name, payload);
	}

	_user_update(name, data) {
		const payload = {user: null, differences: null};

		if (this.client.users.has(data.id)) {
			payload.user = this.client.user.get(data.id);
			payload.differences = payload.user.differences(data);
			payload.user.merge(data);
		} else {
			payload.user = new Structures.User(this.client, data);
			this.client.users.insert(payload.user);
		}

		this.client.emit(name, payload);
	}

	_voice_server_update(name, data) {
		//voice connection thing
		this.client.emit(name, data);
	}

	_voice_state_update(name, data) {
		const payload = {voiceState: null, differences: null, leftChannel: false};

		const serverId = data.guild_id || data.channel_id;
		if (this.client.voiceStates.has(serverId, data.user_id)) {
			payload.voiceState = this.client.voiceStates.get(serverId, data.user_id);
			payload.differences = payload.voiceState.differences(data);
			payload.voiceState.merge(data);
			if (!data.channel_id) {
				this.client.voiceStates.delete(serverId, data.user_id);
				payload.leftChannel = true;
			}
		} else {
			payload.voiceState = new Structures.VoiceState(this.client, data);
			this.client.voiceStates.insert(payload.voiceState);

			//add the voice connection thing?
		}

		this.client.emit(name, payload);
	}

	_webhooks_update(name, data) {
		this.client.emit(name, {
			channel: this.client.channels.get(data.channel_id),
			guild: this.client.guilds.get(data.guild_id),
			raw: data
		});
	}
}

module.exports = GatewayHandler;