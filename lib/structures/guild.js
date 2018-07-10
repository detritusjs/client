const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Structures = {
	Channel: require('./channel'),
	Emoji: require('./emoji'),
	Member: require('./member'),
	Presence: require('./presence'),
	Role: require('./role'),
	User: require('./user'),
	VoiceState: require('./voicestate')
};

const Utils = require('../utils');
const CDN = Utils.Constants.Rest.Endpoints.CDN;

const defaults = {
	afk_channel_id: null,
	afk_timeout: null,
	application_id: null,
	channels: [],
	default_message_notifications: null,
	embed_enabled: false,
	embed_channel_id: null,
	emojis: [],
	explicit_content_filter: 0,
	features: [],
	icon: null,
	id: null,
	joined_at: '',
	large: false,
	lazy: false,
	member_count: 0,
	members: [],
	mfa_level: 0,
	name: '',
	owner_id: null,
	presences: [],
	region: null,
	roles: [],
	splash: null,
	system_channel_id: null,
	unavailable: false,
	verification_level: 0,
	voice_states: [],
	widget_enabled: false,
	widget_channel_id: null
};

const ignore = ['channels', 'emojis', 'joined_at', 'members', 'presences', 'roles', 'voice_states', 'guild_id'];

class Guild extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		Object.defineProperties(this, {
			roles: {enumerable: true, configurable: false, value: new BaseCollection()}
		});

		this.merge({
			channels: data.channels,
			emojis: data.emojis,
			joined_at: data.joined_at,
			members: data.members,
			roles: data.roles,
			presences: data.presences,
			voice_states: data.voice_states
		});
	}
	
	get afkChannel() {return (this.afkChannelId) ? this.client.channels.get(this.afkChannelId) : null;}
	get createdAt() {return new Date(this.createdAtUnix);}
	get createdAtUnix() {return Utils.Snowflake.timestamp(this.id);}
	get defaultRole() {return this.roles.get(this.id);}
	get iconURL() {return this.iconURLFormat();}
	get owner() {return this.client.users.get(this.ownerId);}
	get splashURL() {return this.splashURLFormat();}
	get systemChannel() {return (this.systemChannelId) ? this.client.channels.get(this.systemChannelId) : null;}

	get channels() {return new BaseCollection(this.client.channels.filter((channel) => channel.guildId === this.id));}
	get emojis() {return new BaseCollection(this.client.emojis.filter((emoji) => emoji.guildId === this.id));}
	get members() {return this.client.members.get(this.id);}
	get presences() {return this.client.presences.get(this.id);}
	get voiceStates() {return this.client.voiceStates.get(this.id);}

	get categoryChannels() {return new BaseCollection(this.client.channels.filter((channel) => channel.isCategory && channel.guildId === this.id));}
	get textChannels() {return new BaseCollection(this.client.channels.filter((channel) => channel.isText && channel.guildId === this.id));}
	get voiceChannels() {return new BaseCollection(this.client.channels.filter((channel) => channel.isVoice && channel.guildId === this.id));}

	iconURLFormat(format) {
		if (!this.icon) {return null;}

		format = (format || this.client.options.imageFormat || 'png').toLowerCase();
		const valid = ['png', 'jpg', 'jpeg', 'webp'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return CDN.URL + CDN.GUILD_ICON(this.id, this.icon, format);
	}

	splashURLFormat(format) {
		if (!this.splash) {return null;}

		format = (format || this.client.options.imageFormat || 'png').toLowerCase();
		const valid = ['png', 'jpg', 'jpeg', 'webp'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return CDN.URL + CDN.GUILD_SPLASH(this.id, this.splash, format);
	}

	can(permissions, member, options) {
		options = Object.assign({ignoreOwner: false, ignoreAdministrator: false}, options);

		if (!options.ignoreOwner) {
			const memberId = (member) ? member.id : this.client.user.id;
			if (this.isOwner(memberId)) {
				return true;
			}
		}

		if (member === undefined) {
			member = this.client.members.get(this.id, this.client.user.id);
		}

		if (!member) {return null;}

		const total = member.permissions;
		return (!options.ignoreAdministrator && Utils.Permissions.can(total, 'ADMINISTRATOR')) || Utils.Permissions.can(total, permissions);
	}

	isOwner(id) {return this.ownerId === id;}

	addMember(id, data) {return this.client.rest.addGuildMember(this.id, id, data);}
	addMemberRole(id, roleId) {return this.client.rest.addGuildMemberRole(this.id, id, roleId);}

	beginPrune() {return this.client.rest.beginPrune(this.id);}

	createBan(id, query) {return this.client.rest.createGuildBan(this.id, id, query);}
	createChannel(data) {return this.client.rest.createGuildChannel(this.id, data);}
	createEmoji(data) {return this.client.rest.createGuildEmoji(this.id, data);}
	createIntegration(data) {return this.client.rest.createGuildIntegration(this.id, data);}
	createRole(data) {return this.client.rest.createGuildRole(this.id, data);}

	delete() {return this.client.rest.deleteGuild(this.id);}
	deleteEmoji(id) {return this.client.rest.deleteGuildEmoji(this.id, id);}
	deleteIntegration(id) {return this.client.rest.deleteGuildIntegration(this.id, id);}
	deleteRole(id) {return this.client.rest.deleteGuildRole(this.id, id);}

	edit(data) {return this.client.rest.editGuild(this.id, data);}
	editChannel(id, data) {return this.client.rest.editChannel(id, data);}
	editChannelPositions(data) {return this.client.rest.editGuildChannelPositions(this.id, data);}
	editEmbed(data) {return this.client.rest.editGuildEmbed(this.id, data);}
	editEmoji(id, data) {return this.client.rest.editGuildEmoji(this.id, id, data);}
	editIntegration(id, data) {return this.client.rest.editGuildIntegration(this.id, id, data);}
	editMember(id, data) {return this.client.rest.editGuildMember(this.id, id, data);}
	editNick(data) {return this.client.rest.editGuildNick(this.id, data);}
	editRole(id, data) {return this.client.rest.editGuildRole(this.id, id, data);}
	editRolePositions(data) {return this.client.rest.editGuildRolePositions(this.id, data);}
	editVanityUrl(data) {return this.client.rest.editGuildVanityUrl(this.id, data);}

	fetchAuditLogs(query) {return this.client.rest.fetchGuildAuditLogs(this.id, query);}
	fetchBans() {return this.client.rest.fetchGuildBans(this.id);}
	fetchChannels() {return this.client.rest.fetchGuildChannels(this.id);}
	fetchEmbed() {return this.client.rest.fetchGuildEmbed(this.id);}
	fetchEmoji(id) {return this.client.rest.fetchGuildEmoji(this.id, id);}
	fetchEmojis() {return this.client.rest.fetchGuildEmojis(this.id);}
	fetchInvites() {return this.client.rest.fetchGuildInvites(this.id);}
	fetchIntegrations() {return this.client.rest.fetchGuildIntegrations(this.id);}
	fetchMember(id) {return this.client.rest.fetchGuildMember(this.id, id);}
	fetchMembers() {return this.client.rest.fetchGuildMembers(this.id);}
	fetchPruneCount() {return this.client.rest.fetchGuildPruneCount(this.id);}
	fetchRoles() {return this.client.rest.fetchGuildRoles(this.id);}
	fetchVanityUrl() {return this.client.rest.fetchGuildVanityUrl(this.id);}
	fetchVoiceRegion() {
		return this.fetchVoiceRegions().then((regions) => {
			const region = regions.find((reg) => reg.id === this.region);
			return region || Promise.reject(new Error('Couldn\'t find this server\'s region from discord.'));
		});
	}
	fetchVoiceRegions() {return this.client.rest.fetchVoiceRegions(this.id);}
	fetchWebhooks() {return this.client.rest.fetchGuildWebhooks(this.id);}

	removeBan(id) {return this.client.rest.removeGuildBan(this.id, id);}
	removeMember(id) {return this.client.rest.removeGuildMember(this.id, id);}
	removeMemberRole(id, roleId) {return this.client.rest.removeGuildMemberRole(this.id, id, roleId);}

	search(query) {return this.client.rest.searchGuild(this.id, query);}
	syncIntegration(id) {return this.client.rest.syncGuildIntegration(this.id, id);}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'channels': {
				if (!this.client.channels.enabled) {return;}

				this.channels.forEach((channel) => {
					if (value.some((c) => c.id === channel.id)) {return;}
					this.client.channels.delete(channel.id);
				})

				for (let raw of value) {
					if (this.client.channels.has(raw.id)) {
						this.client.channels.get(raw.id).merge(raw);
					} else {
						Object.assign(raw, {guild_id: this.id});
						this.client.channels.insert(Structures.Channel.create(this.client, raw));
					}
				}
			}; return;
			case 'emojis': {
				if (!this.client.emojis.enabled) {return;}

				this.emojis.forEach((emoji) => {
					if (value.some((e) => e.id === emoji.id)) {return;}
					this.client.emojis.delete(emoji.id);
				});

				for (let raw of value) {
					if (this.client.emojis.has(raw.id)) {
						this.client.emojis.get(raw.id).merge(raw);
					} else {
						Object.assign(raw, {guild_id: this.id});
						this.client.emojis.insert(new Structures.Emoji(this.client, raw));
					}
				}
			}; return;
			case 'joined_at': {
				value = new Date(value);
			}; break;
			case 'members': {
				if (!this.client.members.enabled && !this.client.users.enabled) {return;}

				for (let raw of value) {
					if (this.client.members.enabled) {
						if (this.client.members.has(this.id, raw.user.id)) {
							this.client.members.get(this.id, raw.user.id).merge(raw);
						} else {
							Object.assign(raw, {guild_id: this.id});
							this.client.members.insert(new Structures.Member(this.client, raw));
						}
					} else {
						if (this.client.users.has(raw.user.id)) {
							this.client.users.get(raw.user.id).merge(raw.user);
						} else {
							this.client.users.insert(new Structures.User(this.client, raw.user));
						}
					}
				}
			}; return;
			case 'roles': {
				this.roles.forEach((role) => {
					if (value.some((r) => r.id === role.id)) {return;}
					this.roles.delete(role.id);
				});

				for (let raw of value) {
					if (this.roles.has(raw.id)) {
						this.roles.get(raw.id).merge(raw);
					} else {
						Object.assign(raw, {guild_id: this.id});
						this.roles.set(raw.id, new Structures.Role(this.client, raw));
					}
				}
			}; return;
			case 'presences': {
				if (!this.client.presences.enabled) {return;}
				this.client.presences.delete(this.id);
				for (let raw of value) {
					this.client.presences.insert(this.id, raw.user.id, new Structures.Presence(this.client, raw));
				}
			}; return;
			case 'voice_states': {
				if (!this.client.voiceStates.enabled) {return;}
				if (this.client.voiceStates.has(this.id)) {
					this.client.voiceStates.get(this.id).clear();
				}
				for (let raw of value) {
					if (this.client.voiceStates.has(this.id, raw.user_id)) {
						this.client.voiceStates.get(this.id, raw.user_id).merge(raw);
					} else {
						Object.assign(raw, {guild_id: this.id});
						this.client.voiceStates.insert(new Structures.VoiceState(this.client, raw));
					}
				}
			}; return;
		}

		super.mergeValue.call(this, key, value);
	}

	merge(data) {
		if (data.roles) {
			this.mergeValue('roles', data.roles);
			data.roles = undefined;
		}
		if (data.members) {
			this.mergeValue('members', data.members);
			data.members = undefined;
		}

		super.merge.call(this, data);
	}

	toString() {return this.name;}
}

Guild.defaults = defaults;
Guild.ignore = ignore;
module.exports = Guild;