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

		options = options || {};
		Object.keys(defaults).forEach((key) => {
			const set = this['set' + key.slice(0, 1).toUpperCase() + key.slice(1).toLowerCase()];
			set.call(this, (options[key] === undefined) ? defaults[key] : options[key]);
		});
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

	insert(channel) {return (this.enabled) ? this.set(channel.id, channel) : false;}
	fetch(id) {return this.client.rest.endpoints.fetchChannel(id);}

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