const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Guilds extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	insert(guild) {
		if (!this.enabled) {return;}
		this.set(guild.id, guild);
	}

	toString() {return `${this.size} Guilds`;}
}

module.exports = Guilds;