const Crypto = require('crypto');
const BaseStructure = require('./basestructure');

const defaults = {
	game: null,
	status: '',
	hash: null
};

const ignore = ['game'];

class Presence extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		if (data.game === undefined || (data.game && !Object.keys(data.game).length)) {
			data.game = null;
		}
		this.mergeValue('game', data.game);
		this.mergeValue('hash', Crypto.createHash('sha256').update(this.toString()).digest('hex'));

		Object.freeze(this);
	}

	equals(presence) {
		return this.hash === presence.hash;
	}

	toString() {
		return `PRESENCE.${this.status}.${this.game && JSON.stringify(this.game)}`;
	}
}

module.exports = Presence;