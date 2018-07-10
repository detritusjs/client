const BaseCollection = require('./basecollection');

const MessageCacheTypes = require('../utils').Constants.Detritus.MessageCacheTypes;

const defaults = {
	enabled: true,
	expire: 10 * 60 * 1000, //auto expire messages after 10 minutes
	limit: 1000,
	type: 'channel'
};

class Messages extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
		this.setExpire(options.expire);
		this.setLimit(options.limit);
		this.setType(options.type);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	setExpire(expire) {
		Object.defineProperty(this, 'expire', {enumerable: true, configurable: true, value: expire});
	}

	setLimit(limit) {
		Object.defineProperty(this, 'limit', {enumerable: true, configurable: true, value: limit});
	}

	setType(type)
	{
		if (!MessageCacheTypes.includes(type)) {
			throw new Error(`Invalid Cache Type, valid: ${JSON.stringify(MessageCacheTypes)}`);
		}
		
		Object.defineProperty(this, 'type', {enumerable: true, configurable: true, value: type});
	}

	get size() {
		return (this.type === 'global') ? super.size : this.reduce((size, cache) => size + cache.size, 0);
	}


	insert(message) {
		if (!this.enabled) {return;}

		let cache, cacheId;

		if (this.type === 'global') {
			cache = this;
		} else {
			if (this.type === 'channel' || !message.guildId) {
				cacheId = message.channelId;
			} else {
				cacheId = message.guildId;
			}
			if (!cacheId) {return;} //maybe throw error? channel returned null

			if (this.has(null, cacheId)) {
				cache = super.get(cacheId);
			} else {
				cache = new BaseCollection();
				super.set(cacheId, cache);
			}
		}

		if (this.limit && this.limit <= cache.size) {
			const value = cache.first();
			if (value.expire) {clearTimeout(value.expire);}
			cache.delete(value.data.id);
		}

		cache.set(message.id, {
			data: message,
			expire: (this.expire) ? setTimeout(() => {
				cache.delete(message.id);
				if (cacheId && !cache.size) {super.delete(cacheId);}
			}, this.expire) : null
		});
	}

	get(id, cacheId) {
		if (!this.enabled) {return null;}
		if (!id) {return super.get(cacheId);}

		if (this.type === 'global') {
			const value = super.get(id);
			return value && value.data;
		}

		if (cacheId) {
			const cache = super.get(cacheId);
			const value = (cache) ? cache.get(id) : null;
			return value && value.data;
		}

		for (let cache of this.values()) {
			if (cache.has(id)) {return cache.get(id).data;}
		}

		return null;
	}

	has(id, cacheId) {
		if (!this.enabled) {return false;}
		if (!id) {return super.has(cacheId);}
		if (this.type === 'global') {return super.has(id);}

		if (cacheId) {
			const cache = super.get(cacheId);
			return (cache) ? cache.has(id) : false;
		}

		for (let cache of this.values()) {
			if (cache.has(id)) {return true;}
		}

		return false;
	}

	toString() {return `${this.size} Messages`;}
}

module.exports = Messages;