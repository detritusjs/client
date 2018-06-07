const BaseCollection = require('../collections').BaseCollection;

const Structures = {
	Channel: require('./channel'),
	Overwrite: require('./overwrite')
};

const Utils = require('../utils');

const defaults = Object.assign({
	guild_id: null,
	last_message_id: null,
	last_pin_timestamp: null,
	name: '',
	nsfw: false,
	parent_id: null,
	permission_overwrites: [],
	position: -1,
	topic: null
}, Structures.Channel.defaults);

const ignore = ['last_pin_timestamp', 'permission_overwrites'];

class ChannelText extends Structures.Channel
{
	constructor(client, data)
	{
		super(client, data, defaults, ignore);

		Object.defineProperties(this, {
			permissionOverwrites: {enumerable: true, configurable: false, value: new BaseCollection()}
		});

		this.merge({
			last_pin_timestamp: data.last_pin_timestamp,
			permission_overwrites: data.permission_overwrites
		});
	}

	get guild() {return this.client.guilds.get(this.guildId);}
	get parent() {return (this.parentId) ? this.client.channels.get(this.parentId) : null;}

	get canAddReactions() {return this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ADD_REACTIONS']);}
	get canAttachFiles() {return this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES']);}
	get canEmbedLinks() {return this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS']);}
	get canMentionEveryone() {return this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'MENTION_EVERYONE']);}
	get canSendTTSMessage() {return this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES']);}
	get canMessage() {return this.can(['VIEW_CHANNEL', 'SEND_MESSAGES']);}

	get canEdit() {return this.can('MANAGE_CHANNELS');}
	get canManageMessages() {return this.can('MANAGE_MESSAGES');}
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

	bulkDelete(messageIds) {return this.client.rest.bulkDeleteMessages(this.id, messageIds);}

	createInvite(data) {return this.client.rest.createInvite(this.id, data);}
	createMessage(data) {return this.client.rest.createMessage(this.id, data);}
	createWebhook(data) {return this.client.rest.createWebhook(this.id, data);}

	fetchInvites() {return this.client.rest.fetchChannelInvites(this.id);}
	fetchMessage(id) {return this.client.rest.fetchMessage(this.id, id);}
	fetchMessages(query) {return this.client.rest.fetchMessages(this.id, query);}
	fetchPins() {return this.client.rest.fetchPinnedMessages(this.id);}
	
	triggerTyping() {return this.client.rest.triggerTyping(this.id);}

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
				case 'last_pin_timestamp': {
					data[key] = new Date(data[key]);
				}; break;
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

ChannelText.defaults = defaults;
module.exports = ChannelText;