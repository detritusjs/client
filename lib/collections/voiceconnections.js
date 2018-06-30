const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class VoiceConnections extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	insert(voiceConnection) {
		if (!this.enabled) {return;}

		this.set(voiceConnection.gateway.serverId, voiceConnection);
	}

	toString() {return `${this.size} VoiceConnections`;}
}

module.exports = VoiceConnections;