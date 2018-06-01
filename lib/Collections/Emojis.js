const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Emojis extends BaseCollection
{
	constructor(client, options)
	{
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = options || {};
		Object.keys(defaults).forEach((key) => {
			const set = this['set' + key.slice(0, 1).toUpperCase() + key.slice(1).toLowerCase()];
			set.call(this, (options[key] === undefined) ? defaults[key] : options[key]);
		});
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

	insert(emoji) {return (this.enabled) ? this.set(emoji.id || emoji.name, emoji) : false;}
	fetch(guildId, id) {return this.client.rest.endpoints.fetchEmoji(guildId, id);}

	clear(shardId)
	{
		if (this.client.shardCount === 1 || shardId === undefined) {return super.clear.call(this);}
		for (let emoji of this.values()) {
			if (emoji.client.shardId === shardId) {
				this.delete(emoji.id || emoji.name);
			}
		}
	}

	toString() {return `${this.size} Emojis`;}
}

module.exports = Emojis;