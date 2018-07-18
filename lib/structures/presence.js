const BaseStructure = require('./basestructure');

const Structures = {
	PresenceActivity: require('./presenceactivity'),
	User: require('./user')
};

const Status = require('../utils').Constants.Discord.Status;

const defaults = {
	game: null,
	status: '',
	user: null
};

class Presence extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults);
	}

	get activity() {return this.game;}

	fetchMetadata() {
		if (this.activity) {
			return this.activity.fetchMetaData();
		} else {
			return Promise.reject(new Error('Presence has no activity'));
		}
	}

	difference(key, value) {
		switch (key) {
			case 'game': {
				if (!this.game) {return;}
				const differences = this.game.differences(value);
				return (differences) ? {game: differences} : null;
			}; break;
			case 'user': return;
		}

		return super.difference.call(this, key, value);
	}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		
		switch(key) {
			case 'game': {
				if (value) {
					if (!Object.keys(value).length) {
						value = null;
					} else {
						value = new Structures.PresenceActivity(this, value);
					}
				}
			}; break;
			case 'status': {
				value = Status[value.toUpperCase()];
			}; break;
			case 'user': {
				let user;
				if (this.client.users.has(value.id)) {
					user = this.client.users.get(value.id);
					user.merge(value);
				} else {
					user = new Structures.User(this.client, value);
					this.client.users.insert(user);
				}
				value = user;
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}

	toString() {
		return `${this.user} is ${this.status}` + ((this.game) ? ` while ${this.game}` : '');
	}
}

module.exports = Presence;