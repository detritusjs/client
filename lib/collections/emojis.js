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

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

	insert(emoji) {return (this.enabled) ? this.set(emoji.id || emoji.name, emoji) : false;}

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