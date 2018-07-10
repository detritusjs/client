const BaseStructure = require('./basestructure');

const Structures = {
	Emoji: require('./emoji')
};

const defaults = {
	channel_id: null,
	count: 0,
	emoji: {},
	guild_id: null,
	message_id: null,
	me: false
};

const ignore = ['emoji', 'user_id'];

class Reaction extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);
		this.merge({emoji: data.emoji});
	}

	get channel() {return this.client.channels.get(this.channelId);}
	get message() {return this.client.messages.get(this.messageId);}

	delete(userId) {return this.client.rest.deleteReaction(this.channelId, this.messageId, this.emoji.endpointFormat, userId || '@me');}
	fetchUsers() {return this.client.rest.fetchReactions(this.channelId, this.messageId, this.emoji.endpointFormat);}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'emoji': {
				let emoji;
				if (value.id && this.client.emojis.has(value.id)) {
					emoji = this.client.emojis.get(value.id);
					emoji.merge(value);
				} else {
					emoji = new Structures.Emoji(this.client, value);
				}
				value = emoji;
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = Reaction;