const BaseCollection = require('../collections').BaseCollection;

const Structures = {
	ChannelGuildBase: require('./channelguildbase')
};

const defaults = Object.assign({
	last_message_id: null,
	last_pin_timestamp: null,
	topic: null
}, Structures.ChannelGuildBase.defaults);

const ignore = ['last_pin_timestamp'].concat(Structures.ChannelGuildBase.ignore);

class ChannelGuildText extends Structures.ChannelGuildBase {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		this.merge({last_pin_timestamp: data.last_pin_timestamp});
	}

	get messages() {
		const cache = new BaseCollection();
		switch (this.client.messages.type) {
			case 'guild': {
				if (this.client.messages.has(null, this.guildId)) {
					const guildCache = this.client.messages.get(null, this.guildId);
					for (let value of guildCache.values()) {
						if (value.data.channelId === this.id) {
							cache.set(value.data.id, value.data);
						}
					}
				}
			}; break;
			case 'channel': {
				if (this.client.messages.has(null, this.id)) {
					const channelCache = this.client.messages.get(null, this.id);
					for (let value of channelCache.values()) {
						cache.set(value.data.id, value.data);
					}
				}
			}; break;
			default: {
				for (let value of this.client.messages.values()) {
					if (value.data.channelId === this.id) {
						cache.set(value.data.id, value.data);
					}
				}
			};
		}
		return cache;
	}

	bulkDelete(messageIds) {return this.client.rest.bulkDeleteMessages(this.id, messageIds);}

	createMessage(data) {return this.client.rest.createMessage(this.id, data);}
	createWebhook(data) {return this.client.rest.createWebhook(this.id, data);}
	
	deleteMessage(id) {return this.client.rest.deleteMessage(this.id, id);}

	fetchMessage(id) {return this.client.rest.fetchMessage(this.id, id);}
	fetchMessages(query) {return this.client.rest.fetchMessages(this.id, query);}
	fetchPins() {return this.client.rest.fetchPinnedMessages(this.id);}
	fetchWebhooks() {return this.client.rest.fetchChannelWebhooks(this.id);}
	
	triggerTyping() {return this.client.rest.triggerTyping(this.id);}

	difference(key, value) {
		switch (key) {
			case 'last_pin_timestamp': {
				const old = this.lastPinTimestamp;
				if (old.getTime() === (new Date(value)).getTime()) {return;}
				return {lastPinTimestamp: old};
			}; break;
		}
		
		return super.difference.call(this, key, value);
	}

	mergeValue(key, value) {
		switch (key) {
			case 'last_pin_timestamp': {
				value = new Date(value);
			}; break;
		}

		return super.mergeValue.call(this, key, value);
	}
}

ChannelGuildText.defaults = defaults;
ChannelGuildText.ignore = ignore;
module.exports = ChannelGuildText;