const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Channels extends BaseCollection
{
	constructor(client, options)
	{
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

	insert(channel) {return (this.enabled) ? this.set(channel.id, channel) : false;}

	clear(shardId)
	{
		if (this.client.shardCount === 1 || shardId === undefined) {return super.clear.call(this);}
		for (let channel of this.values()) {
			if (channel.client.shardId === shardId) {
				this.delete(channel.id);
			}
		}
	}

	toString() {return `${this.size} Channels`;}
}

module.exports = Channels;