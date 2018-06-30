const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class VoiceStates extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	get size() {
		return this.reduce((size, cache) => size + cache.size, 0);
	}

	insert(voiceState) {
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

	delete(serverId, userId) {
		if (!this.enabled || !super.has(serverId)) {return;}
		if (userId) {
			const server = super.get(serverId);
			server.delete(userId);
			if (!server.size) {
				super.delete(serverId);
			}
		} else {
			super.delete(serverId);
		}
	}

	get(serverId, userId) {
		if (!this.enabled || !super.has(serverId)) {return null;}
		return (userId) ? super.get(serverId).get(userId) : super.get(serverId);
	}

	has(serverId, userId) {
		if (!this.enabled || !super.has(serverId)) {return null;}
		return (userId) ? super.get(serverId).has(userId) : true;
	}

	toString() {return `${this.size} VoiceStates`;}
}

module.exports = VoiceStates;