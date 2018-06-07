const BaseCollection = require('../collections').BaseCollection;

const Structures = {
	Channel: require('./channel'),
	Overwrite: require('./overwrite')
};

const Utils = require('../utils');

const defaults = Object.assign({
	bitrate: 64000,
	guild_id: null,
	name: '',
	nsfw: false,
	parent_id: null,
	permission_overwrites: [],
	position: -1,
	user_limit: 0
}, Structures.Channel.defaults);

const ignore = ['permission_overwrites'];

class ChannelVoice extends Structures.Channel
{
	constructor(client, data)
	{
		super(client, data, defaults, ignore);

		Object.defineProperties(this, {
			permissionOverwrites: {enumerable: true, configurable: false, value: new BaseCollection()}
		});

		this.merge({permission_overwrites: data.permission_overwrites});
	}

	get guild() {return this.client.guilds.get(this.guildId);}
	get joined() {return this.client.voiceConnections.has(this.guildId);}
	get parent() {return (this.parentId) ? this.client.channels.get(this.parentId) : null;}

	get canJoin() {return this.can(['VIEW_CHANNEL', 'VOICE_CONNECT']);}
	get canSpeak() {return this.can('VOICE_SPEAK');}

	get canEdit() {return this.can('MANAGE_CHANNELS');}
	get canView() {return this.can('VIEW_CHANNEL');}

	can(permissions, member)
	{
		if (member === undefined) {member = this.client.members.get(this.guildId, this.client.user.id);}
		if (!member) {return null;}

		const guild = this.guild;
		if (guild && guild.isOwner(member.id)) {return true;}
		const total = member.permissionsFor(this);
		return Utils.Permissions.can(total, 'ADMINISTRATOR') || Utils.Permissions.can(total, permissions);
	}

	createInvite(data) {return this.client.rest.createInvite(this.id, data);}
	fetchInvites() {return this.client.rest.fetchChannelInvites(this.id);}

	join(options) {return this.client.voiceConnect(this.guildId, this.id, options);}

	differences(data)
	{
		const obj = {};
		for (let key in data) {
			const camelKey = Utils.Tools.toCamelCase(key);
			let value = this[camelKey];
			if (data[key] === value) {continue;}
			switch (key) {
				case 'permission_overwrites': {
					if (data[key].length === value.size && !value.size) {continue;}
					value = value.clone();
				}; break;
			}
			obj[camelKey] = value;
		}
		return obj;
	}
	
	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'permission_overwrites': {
					this.permissionOverwrites.clear();
					for (let value of data[key]) {
						Object.assign(value, {channel_id: this.id, guild_id: this.guildId});
						this.permissionOverwrites.set(value.id, new Structures.Overwrite(this.client, value));
					}
				}; continue;
			}

			this.mergeValue(key, data[key]);
		}
	}
}

module.exports = ChannelVoice;