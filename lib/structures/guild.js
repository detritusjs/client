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
const Constants = Utils.Constants;

const defaults = {
	afk_channel_id: null,
	afk_timeout: null,
	application_id: null,
	channels: [],
	default_message_notifications: null,
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
	voice_states: []
};

class Guild extends BaseStructure
{
	constructor(client, data)
	{
		super(client, data, defaults, ['channels', 'emojis', 'joined_at', 'members', 'presences', 'roles', 'voice_states']);

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
	get iconURL() {return this.iconURLFormat();}
	get owner() {return this.client.users.get(this.ownerId);}
	get splashURL() {return this.splashURLFormat();}
	get systemChannel() {return (this.systemChannelId) ? this.client.channels.get(this.systemChannelId) : null;}

	get channels() {return new BaseCollection(this.client.channels.filter((channel) => channel.guildId === this.id));}
	get emojis() {return new BaseCollection(this.client.emojis.filter((emoji) => emoji.guildId === this.id));}
	get members() {return new BaseCollection(this.client.members.get(this.id));}
	get presences() {return new BaseCollection(this.client.presences.get(this.id));}
	get voiceStates() {return new BaseCollection(this.client.voiceStates.get(this.id));}

	get categoryChannels() {return new BaseCollection(this.client.channels.filter((channel) => channel.isCategory && channel.guildId === this.id));}
	get textChannels() {return new BaseCollection(this.client.channels.filter((channel) => channel.isText && channel.guildId === this.id));}
	get voiceChannels() {return new BaseCollection(this.client.channels.filter((channel) => channel.isVoice && channel.guildId === this.id));}

	iconURLFormat(format)
	{
		if (!this.icon) {return null;}

		format = (format || this.client.options.imageFormat || 'png').toLowerCase();
		const valid = ['png', 'jpg', 'jpeg', 'webp'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return Constants.Rest.Endpoints.CDN.URL + Constants.Rest.Endpoints.CDN.GUILD_ICON(this.id, this.icon, format);
	}

	splashURLFormat(format)
	{
		if (!this.splash) {return null;}

		format = (format || this.client.options.imageFormat || 'png').toLowerCase();
		const valid = ['png', 'jpg', 'jpeg', 'webp'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return Constants.Rest.Endpoints.CDN.URL + Constants.Rest.Endpoints.CDN.GUILD_SPLASH(this.id, this.splash, format);
	}

	addMember(id, data) {return this.client.rest.addMember(this.id, id, data);}
	addMemberRole(id, roleId) {return this.client.rest.addMemberRole(this.id, id, roleId);}

	beginPrune() {return this.client.rest.beginPrune(this.id);}

	createBan(id, query) {return this.client.rest.createBan(this.id, id, query);}
	createChannel(data) {return this.client.rest.createChannel(this.id, data);}
	createEmoji(data) {return this.client.rest.createEmoji(this.id, data);}
	createIntegration(data) {return this.client.rest.createGuildIntegration(this.id, data);}
	createRole(data) {return this.client.rest.createRole(this.id, data);}

	delete() {return this.client.rest.deleteGuild(this.id);}
	deleteEmoji(id) {return this.client.rest.deleteEmoji(this.id, id);}
	deleteIntegration(id) {return this.client.rest.deleteGuildIntegration(this.id, id);}
	deleteRole(id) {return this.client.rest.deleteRole(this.id, id);}

	edit(data) {return this.client.rest.editGuild(this.id, data);}
	editChannel(id, data) {return this.client.rest.editChannel(this.id, data);}
	editChannelPositions(data) {return this.client.rest.editChannelPositions(this.id, data);}
	editEmbed(data) {return this.client.rest.editGuildEmbed(this.id, data);}
	editEmoji(id, data) {return this.client.rest.editEmoji(this.id, id, data);}
	editIntegration(id, data) {return this.client.rest.editGuildIntegration(this.id, id, data);}
	editMember(id, data) {return this.client.rest.editMember(this.id, id, data);}
	editNick(data) {return this.client.rest.editNick(this.id, data);}
	editRole(id, data) {return this.client.rest.editRole(this.id, id, data);}
	editRolePositions(data) {return this.client.rest.editRolePositions(this.id, data);}
	editVanityUrl(data) {return this.client.rest.editVanityUrl(this.id, data);}

	fetchAuditLogs(query) {return this.client.rest.fetchGuildAuditLogs(this.id, query);}
	fetchBans() {return this.client.rest.fetchBans(this.id);}
	fetchChannels() {return this.client.rest.fetchChannels(this.id);}
	fetchEmbed() {return this.client.rest.fetchGuildEmbed(this.id);}
	fetchEmoji(id) {return this.client.rest.fetchEmoji(this.id, id);}
	fetchEmojis() {return this.client.rest.fetchEmojis(this.id);}
	fetchInvites() {return this.client.rest.fetchGuildInvites(this.id);}
	fetchIntegrations() {return this.client.rest.fetchGuildIntegrations(this.id);}
	fetchMember(id) {return this.client.rest.fetchMember(this.id, id);}
	fetchMembers() {return this.client.rest.fetchMembers();}
	fetchPruneCount() {return this.client.rest.fetchPruneCount(this.id);}
	fetchRoles() {return this.client.rest.fetchRoles(this.id);}
	fetchVanityUrl() {return this.client.rest.fetchVanityUrl(this.id);}
	fetchVoiceRegion()
	{
		return this.fetchVoiceRegions().then((regions) => {
			const region = regions.find((reg) => reg.id === this.region);
			return region || Promise.reject(new Error('Couldn\'t find this server\'s region from discord.'));
		});
	}
	fetchVoiceRegions() {return this.client.rest.fetchVoiceRegions(this.id);}
	fetchWebhooks() {return this.client.rest.fetchGuildWebhooks(this.id);}

	removeBan(id) {return this.client.rest.removeBan(this.id, id);}
	removeMember(id) {return this.client.rest.removeMember(this.id, id);}
	removeMemberRole(id, roleId) {return this.client.rest.removeMemberRole(this.id, id, roleId);}

	search(query) {return this.client.rest.searchGuild(this.id, query);}
	syncIntegration(id) {return this.client.rest.syncGuildIntegration(this.id, id);}

	merge(data)
	{
		if (data.roles) {
			this.roles.clear();
			for (let raw of data.roles) {
				Object.assign(raw, {guild_id: this.id});
				this.roles.set(raw.id, new Structures.Role(this.client, raw));
			}
			delete data.roles;
			//make sure roles are initialized before making the member objects
		}

		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'channels': {
					if (!this.client.channels.enabled) {continue;}

					this.channels.forEach((channel) => {
						if (data[key].some((c) => c.id === channel.id)) {return;}
						this.client.channels.delete(channel.id);
					})

					for (let value of data[key]) {
						if (this.client.channels.has(value.id)) {
							this.client.channels.get(value.id).merge(value);
						} else {
							Object.assign(value, {guild_id: this.id});
							this.client.channels.insert(Structures.Channel.create(this.client, value));
						}
					}
				}; continue;
				case 'emojis': {
					if (!this.client.emojis.enabled) {continue;}

					this.emojis.forEach((emoji) => {
						if (data[key].some((e) => e.id === emoji.id)) {return;}
						this.client.emojis.delete(emoji.id);
					});

					for (let value of data[key]) {
						if (this.client.emojis.has(value.id)) {
							this.client.emojis.get(value.id).merge(value);
						} else {
							Object.assign(value, {guild_id: this.id});
							this.client.emojis.insert(new Structures.Emoji(this.client, value));
						}
					}
				}; continue;
				case 'joined_at': {
					data[key] = new Date(data[key]);
				}; break;
				case 'members': {
					if (!this.client.members.enabled && !this.client.users.enabled) {continue;}

					for (let value of data[key]) {
						if (this.client.members.enabled) {
							if (this.client.members.has(this.id, value.user.id)) {
								this.client.members.get(this.id, value.user.id).merge(value);
							} else {
								Object.assign(value, {guild_id: this.id});
								this.client.members.insert(new Structures.Member(this.client, value));
							}
						} else {
							if (this.client.users.has(value.user.id)) {
								this.client.users.get(value.user.id).merge(value.user);
							} else {
								this.client.users.insert(new Structures.User(this.client, value.user));
							}
						}
					}
				}; continue;
				case 'presences': {
					if (!this.client.presences.enabled) {continue;}
					if (this.client.presences.has(this.id)) {
						this.client.presences.get(this.id).clear();
					}
					for (let value of data[key]) {
						this.client.presences.insert(this.id, value.user.id, new Structures.Presence(this.client, value));
					}
				}; continue;
				case 'voice_states': {
					if (!this.client.voiceStates.enabled) {continue;}
					if (this.client.voiceStates.has(this.id)) {
						this.client.voiceStates.get(this.id).clear();
					}
					for (let value of data[key]) {
						if (this.client.voiceStates.has(this.id, value.user_id)) {
							this.client.voiceStates.get(this.id, value.user_id).merge(value);
						} else {
							Object.assign(value, {guild_id: this.id});
							this.client.voiceStates.insert(new Structures.VoiceState(this.client, value));
						}
					}
				}; continue;
			}

			Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}

	toString() {return this.name;}
}

module.exports = Guild;