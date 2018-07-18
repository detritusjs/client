const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Notes extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	insert(userId, note) {
		if (!this.enabled) {return;}

		if (note) {
			this.set(userId, note);
		} else {
			this.delete(userId);
		}
	}

	toString() {return `${this.size} Notes`;}
}

module.exports = Notes;