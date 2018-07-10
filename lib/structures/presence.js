const Crypto = require('crypto');
const BaseStructure = require('./basestructure');

const Structures = {
	PresenceActivity: require('./presenceactivity')
};

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

	get activity() {return this.game;}

	equals(presence) {
		return this.hash === presence.hash;
	}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		
		switch(key) {
			case 'game': {
				if (value) {
					value = new Structures.PresenceActivity(this, value);
				}
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}

	toString() {
		return `PRESENCE.${this.status}.${this.game && JSON.stringify(this.game)}`;
	}
}

module.exports = Presence;