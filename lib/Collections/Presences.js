const BaseCollection = require('./basecollection');
const Structures = {Presence: require('../structures/presence')};

const Statuses = require('../utils').Constants.Gateway.Gateway.Status;

const defaults = {
	enabled: true,
	storeOffline: false
};

class Presences extends BaseCollection
{
	constructor(client, options)
	{
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = options || {};
		Object.keys(defaults).forEach((key) => {
			const set = this['set' + key.slice(0, 1).toUpperCase() + key.slice(1)];
			set.call(this, (options[key] === undefined) ? defaults[key] : options[key]);
		});

		Object.defineProperty(this, 'defaults', {enumerable: true, value: {}});
		for (let key in Statuses) {
			this.defaults[key] = new Structures.Presence(this.client, {status: Statuses[key]});
		}

		Object.defineProperty(this, 'presences', {value: new Map()});
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}
	setStoreOffline(store) {return Object.defineProperty(this, 'storeOffline', {enumerable: true, configurable: true, value: !!store});}

	get size() {return this.reduce((size, cache) => size + cache.size, 0);}
	get actualSize() {return this.presences.size;}

	decreaseCache(hash)
	{
		if (!this.presences.has(hash)) {return;}
		const cache = this.presences.get(hash);
		cache.uses--;
		if (!cache.uses) {
			this.presences.delete(hash);
		}
	}

	insert(guildId, userId, presence)
	{
		if (!this.enabled) {return;}

		if (!this.storeOffline && presence.equals(this.defaults.OFFLINE)) {
			this.delete(guildId, userId);
			return this.defaults.OFFLINE;
		}

		let presences;
		if (super.has(guildId)) {
			presences = super.get(guildId);
		} else {
			presences = new BaseCollection();
			super.set(guildId, presences);
		}

		if (presences.has(userId)) {
			this.decreaseCache(presences.get(userId).hash);
		}
		
		if (this.presences.has(presence.hash)) {
			const cache = this.presences.get(presence.hash);
			cache.uses++;
			presence = cache.presence;
		} else {
			this.presences.set(presence.hash, {presence, uses: 1});
		}

		presences.set(userId, presence);

		return presence;
	}

	delete(guildId, userId)
	{
		if (!this.enabled || (!guildId && !userId)) {return;}

		if (guildId) {
			if (!super.has(guildId)) {return;}
			const presences = super.get(guildId);
			if (userId) {
				if (!presences.has(userId)) {return;}
				this.decreaseCache(presences.get(userId).hash);
				presences.delete(userId);
				if (!presences.size) {
					super.delete(guildId);
				}
			} else {
				for (let presence of presences) {
					this.decreaseCache(presence.hash);
				}
				super.delete(guildId);
			}
		} else {
			for (let presences of this.values()) {
				if (!presences.has(userId)) {continue;}
				this.decreaseCache(presences.get(userId).hash);
				presences.delete(userId);
			}
		}
	}

	get(guildId, userId)
	{
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

	has(guildId, userId)
	{
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

	clear(shardId)
	{
		if (this.client.shardCount === 1 || shardId === undefined) {return super.clear.call(this);}
		for (let [guildId, presences] of this.entries()) {
			for (let [userId, presence] of presences.entries()) {
				if (presence.client.shardId === shardId) {
					this.delete(guildId, userId);
				}
			}
		}
	}

	toString() {return `${this.size} Presences, ${this.actualSize} Actual Presences`;}
}

module.exports = Presences;