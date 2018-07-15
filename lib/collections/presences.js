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

		Object.defineProperty(this, 'presences', {value: new Map()});
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

	get userSize() {
		return this.presences.size;
	}

	insert(guildId, presence) {
		if (!this.enabled) {return;}

		if (!this.storeOffline && presence.status === Statuses.OFFLINE) {
			this.delete(guildId, presence.user.id);
			return presence;
		}

		if (this.presences.has(presence.user.id)) {
			const old = this.presences.get(presence.user.id);
			old.merge(presence);
			presence = old;
		} else {
			this.presences.set(presence.user.id, presence);
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

				this.maybeDeleteUser(userId);
			} else {
				super.delete(guildId);
				for (let presence of presences.values()) {
					this.maybeDeleteUser(userId);
				}
			}
		} else {
			for (let presences of this.values()) {
				presences.delete(userId);
			}
			this.presences.delete(userId);
		}
	}

	maybeDeleteUser(userId) {
		if (this.has(null, userId)) {return;}
		return this.presences.delete(userId);
	}

	get(guildId, userId) {
		if (!this.enabled || (!guildId && !userId)) {return null;}

		if (guildId) {
			if (!super.has(guildId)) {return null;}
			return (userId) ? super.get(guildId).get(userId) : super.get(guildId);
		} else {
			return this.presences.get(userId);
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

	clear() {
		for (let presences of this.values()) {
			for (let presence of presences.values()) {
				presences.delete(presence.user.id);
				this.maybeDeleteUser(presence.user.id);
			}
		}
	}

	toString() {
		return `${this.size} Presences`;
	}
}

Presences.createOffline = function(user) {
	return new Structures.Presence(user.client, {user, status: Statuses.OFFLINE});
};

module.exports = Presences;