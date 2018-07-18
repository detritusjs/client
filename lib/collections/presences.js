const BaseCollection = require('./basecollection');

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

		Object.defineProperty(this, 'users', {
			value: new BaseCollection()
		});
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
		return this.users.size;
	}

	insert(presence, guildId) {
		if (!this.enabled) {return;}

		if (!this.storeOffline && presence.status === Statuses.OFFLINE) {
			this.delete(presence.user.id, guildId);
			return presence;
		}

		if (this.users.has(presence.user.id)) {
			const old = this.users.get(presence.user.id);
			old.merge(presence);
			presence = old;
		} else {
			this.users.set(presence.user.id, presence);
		}

		if (guildId) {
			let presences;
			if (super.has(guildId)) {
				presences = super.get(guildId);
			} else {
				presences = new BaseCollection();
				super.set(guildId, presences);
			}

			presences.set(presence.user.id, presence);
		}

		return presence;
	}

	delete(userId, guildId) {
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
			this.users.delete(userId);
		}
	}

	maybeDeleteUser(userId) {
		if (!this.has(null, userId)) {
			this.users.delete(userId);
		}
	}

	get(userId, guildId) {
		if (!this.enabled || (!guildId && !userId)) {return null;}

		if (guildId) {
			if (!super.has(guildId)) {return null;}
			return (userId) ? super.get(guildId).get(userId) : super.get(guildId);
		} else {
			return this.users.get(userId);
		}

		return null;
	}

	has(userId, guildId) {
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

		this.users.clear();
	}

	toString() {
		return `${this.size} Presences`;
	}
}

module.exports = Presences;