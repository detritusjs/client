const BaseCollection = require('../collections').BaseCollection;

const Structures = {
	Channel: require('./channel'),
	User: require('./user')
};

const Tools = require('../utils').Tools;

const defaults = Object.assign({
	last_message_id: null,
	last_pin_timestamp: null,
	recipients: []
}, Structures.Channel.defaults);

class ChannelDM extends Structures.Channel
{
	constructor(client, data, def)
	{
		super(client, data, def || defaults, ['last_pin_timestamp', 'recipients']);

		Object.defineProperties(this, {
			recipients: {enumerable: true, configurable: false, value: new BaseCollection()}
		});

		this.merge({
			last_pin_timestamp: data.last_pin_timestamp,
			recipients: data.recipients
		});
	}

	get iconURL() {return this.iconURLFormat();}

	iconURLFormat(format) {return (this.recipients.size) ? this.recipients.first().avatarURL(format) : null;}

	bulkDelete(messageIds) {return this.client.rest.bulkDeleteMessages(this.id, messageIds);}

	close() {return this.delete();}

	createMessage(data) {return this.client.rest.createMessage(this.id, data);}

	fetchMessage(id) {return this.client.rest.fetchMessage(this.id, id);}
	fetchMessages(query) {return this.client.rest.fetchMessages(this.id, query);}
	fetchPins() {return this.client.rest.fetchPinnedMessages(this.id);}
	
	search(query) {return this.client.rest.searchChannel(this.id, query);}
	triggerTyping() {return this.client.rest.triggerTyping(this.id);}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'last_pin_timestamp': {
					data[key] = new Date(data[key]);
				}; break;
				case 'recipients': {
					this.recipients.clear();
					for (let value of data[key]) {
						let user;
						if (this.client.users.has(value.id)) {
							user = this.client.users.get(value.id);
							user.merge(value);
						} else {
							user = new Structures.User(this.client, value);
							this.client.users.insert(user);
						}
						this.recipients.set(value.id, user);
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

ChannelDM.defaults = defaults;
module.exports = ChannelDM;