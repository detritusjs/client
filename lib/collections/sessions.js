const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Sessions extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	insert(session) {
		if (!this.enabled) {return;}
		this.set(session.sessionId, session);
	}

	toString() {return `${this.size} Sessions`;}
}

module.exports = Sessions;