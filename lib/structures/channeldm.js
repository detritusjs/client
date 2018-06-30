const BaseCollection = require('../collections').BaseCollection;

const Structures = {
	Channel: require('./channel'),
	Overwrite: require('./overwrite'),
	User: require('./user')
};

const defaults = Object.assign({
	last_message_id: null,
	last_pin_timestamp: null,
	recipients: []
}, Structures.Channel.defaults);

const ignore = ['last_pin_timestamp', 'recipients'];

class ChannelDM extends Structures.Channel {
	constructor(client, data, def) {
		super(client, data, def || defaults, ignore);

		Object.defineProperties(this, {
			recipients: {enumerable: true, configurable: false, value: new BaseCollection()}
		});

		this.merge({
			last_pin_timestamp: data.last_pin_timestamp,
			recipients: data.recipients
		});
	}

	get iconURL() {return this.iconURLFormat();}
	get joined() {return this.voiceConnections.has(this.id);}

	iconURLFormat(format) {return (this.recipients.size) ? this.recipients.first().avatarURL(format) : null;}

	bulkDelete(messageIds) {return this.client.rest.bulkDeleteMessages(this.id, messageIds);}

	close() {return this.delete();}

	createMessage(data) {return this.client.rest.createMessage(this.id, data);}

	fetchMessage(id) {return this.client.rest.fetchMessage(this.id, id);}
	fetchMessages(query) {return this.client.rest.fetchMessages(this.id, query);}
	fetchPins() {return this.client.rest.fetchPinnedMessages(this.id);}
	
	search(query) {return this.client.rest.searchChannel(this.id, query);}
	triggerTyping() {return this.client.rest.triggerTyping(this.id);}

	mergeValue(key, value) {
		switch (key) {
			case 'last_pin_timestamp': {
				value = new Date(value);
			}; break;
			case 'recipients': {
				this.recipients.clear();
				for (let raw of value) {
					let user;
					if (this.client.users.has(raw.id)) {
						user = this.client.users.get(raw.id);
						user.merge(raw);
					} else {
						user = new Structures.User(this.client, raw);
						this.client.users.insert(user);
					}
					this.recipients.set(raw.id, user);
				}
			}; return;
		}
		super.mergeValue.call(this, key, value);
	}
}

ChannelDM.defaults = defaults;
module.exports = ChannelDM;