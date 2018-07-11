const BaseCollection = require('./basecollection');

const Structures = {
	Presence: require('../structures/presence')
};

const Statuses = require('../utils').Constants.Discord.Status;

const defaults = {
	enabled: true,
	storeOffline: false
};

class Presences extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
		this.setStoreOffline(options.storeOffline);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	setStoreOffline(store) {
		Object.defineProperty(this, 'storeOffline', {enumerable: true, configurable: true, value: !!store});
	}

	get size() {
		return this.reduce((size, cache) => size + cache.size, 0);
	}

	insert(guildId, presence) {
		if (!this.enabled) {return;}

		if (!this.storeOffline && presence.status === Statuses.OFFLINE) {
			this.delete(guildId, presence.user.id);
			return presence;
		}

		let presences;
		if (super.has(guildId)) {
			presences = super.get(guildId);
		} else {
			presences = new BaseCollection();
			super.set(guildId, presences);
		}

		presences.set(presence.user.id, presence);
		return presence;
	}

	delete(guildId, userId) {
		if (!this.enabled || (!guildId && !userId)) {return;}

		if (guildId) {
			if (!super.has(guildId)) {return;}
			const presences = super.get(guildId);
			if (userId) {
				presences.delete(userId);
				if (!presences.size) {
					super.delete(guildId);
				}
			} else {
				super.delete(guildId);
			}
		} else {
			for (let presences of this.values()) {
				presences.delete(userId);
			}
		}
	}

	get(guildId, userId) {
		if (!this.enabled || (!guildId && !userId)) {return null;}

		if (guildId) {
			if (!super.has(guildId)) {return null;}
			return (userId) ? super.get(guildId).get(userId) : super.get(guildId);
		} else {
			for (let presences of this.values()) {
				if (!presences.has(userId)) {continue;}
				return presences.get(userId);
			}
		}
		return null;
	}

	has(guildId, userId) {
		if (!this.enabled || (!guildId && !userId)) {return false;}

		if (guildId) {
			if (!super.has(guildId)) {return false;}
			return (userId) ? super.get(guildId).has(userId) : true;
		} else {
			for (let presences of this.values()) {
				if (!presences.has(userId)) {continue;}
				return true;
			}
		}
		return false;
	}

	toString() {
		return `${this.size} Presences`;
	}
}

Presences.createOffline = function(user) {
	return new Structures.Presence(user.client, {user, status: Statuses.OFFLINE});
};

module.exports = Presences;