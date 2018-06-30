const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Emojis extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	insert(emoji) {
		if (!this.enabled) {return;}
		this.set(emoji.id || emoji.name, emoji);
	}

	toString() {return `${this.size} Emojis`;}
}

module.exports = Emojis;