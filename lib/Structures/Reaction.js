const BaseStructure = require('./basestructure');
const Tools = require('../utils').Tools;

const Structures = {Emoji: require('./emoji')};

const defaults = {
	channel_id: null,
	count: 0,
	emoji: {},
	guild_id: null,
	message_id: null,
	me: false
};

class Reaction extends BaseStructure
{
	constructor(client, data)
	{
		super(client, data, defaults, ['emoji']);
		this.merge({emoji: data.emoji});
	}

	get channel() {return this.client.channels.get(this.channelId);}
	get message() {return this.client.messages.get(this.messageId);}

	delete(userId) {return this.client.rest.endpoints.deleteReaction(this.channelId, this.messageId, this.emoji.endpointFormat, userId || '@me');}
	fetchUsers() {return this.client.rest.endpoints.fetchReactions(this.channelId, this.messageId, this.emoji.endpointFormat);}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'emoji': {
					let emoji;
					if (data[key].id && this.client.emojis.has(data[key].id)) {
						emoji = this.client.emojis.get(data[key].id);
						emoji.merge(data[key]);
					} else {
						emoji = new Structures.Emoji(this.client, data[key]);
					}
					data[key] = emoji;
				}; break;
			}

			Object.defineProperty(this, Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}
}

module.exports = Reaction;