const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Guilds extends BaseCollection
{
	constructor(client, options)
	{
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

	insert(guild) {return (this.enabled) ? this.set(guild.id, guild) : false;}

	clear(shardId)
	{
		if (this.client.shardCount === 1 || shardId === undefined) {return super.clear.call(this);}
		for (let guild of this.values()) {
			if (guild.client.shardId === shardId) {
				this.delete(guild.id);
			}
		}
	}

	toString() {return `${this.size} Guilds`;}
}

module.exports = Guilds;