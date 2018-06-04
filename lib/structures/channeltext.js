const BaseCollection = require('../collections').BaseCollection;

const Structures = {
	Channel: require('./channel'),
	Overwrite: require('./overwrite')
};

const Tools = require('../utils').Tools;

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

class ChannelText extends Structures.Channel
{
	constructor(client, data)
	{
		super(client, data, defaults, ['last_pin_timestamp', 'permission_overwrites']);

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
			const camelKey = Tools.toCamelCase(key);
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

			Object.defineProperty(this, Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}
}

ChannelText.defaults = defaults;
module.exports = ChannelText;