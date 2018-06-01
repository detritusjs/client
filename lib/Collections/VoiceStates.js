const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class VoiceStates extends BaseCollection
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
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

	get size() {return this.reduce((size, cache) => size + cache.size, 0);}

	insert(voiceState)
	{
		if (!this.enabled) {return;}

		let cache;
		if (super.has(voiceState.serverId)) {
			cache = super.get(voiceState.serverId);
		} else {
			cache = new BaseCollection();
			super.set(voiceState.serverId, cache);
		}
		cache.set(voiceState.userId, voiceState);
	}

	delete(serverId, userId)
	{
		if (!this.enabled || !super.has(serverId)) {return;}
		return (userId) ? super.get(serverId).delete(userId) : super.delete(serverId);
	}

	get(serverId, userId)
	{
		if (!this.enabled || !super.has(serverId)) {return null;}
		return (userId) ? super.get(serverId).get(userId) : super.get(serverId);
	}

	has(serverId, userId)
	{
		if (!this.enabled || !super.has(serverId)) {return null;}
		return (userId) ? super.get(serverId).has(userId) : true;
	}

	clear(shardId)
	{
		if (this.client.shardCount === 1 || shardId === undefined) {return super.clear.call(this);}
		for (let voiceStates of this.values()) {
			const first = voiceStates.first();
			if (first.client.shardId === shardId) {
				this.delete(first.serverId);
			}
		}
	}

	toString() {return `${this.size} VoiceStates`;}
}

module.exports = VoiceStates;