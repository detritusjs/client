const BaseCollection = require('./basecollection');

const defaults = {enabled: true};

class VoiceConnections extends BaseCollection
{
	constructor(client, options)
	{
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

	insert(voiceConnection)
	{
		if (!this.enabled) {return;}

		this.set(voiceConnection.gateway.serverId, voiceConnection);
	}

	clear(shardId)
	{
		for (let voiceConnection of this.values()) {
			if (this.client.shardId === 1 || shardId === undefined || voiceConnection.client.shardId === shardId) {
				voiceConnection.kill();
				this.delete(voiceConnection.serverId);
			}
		}
	}

	toString() {return `${this.size} VoiceConnections`;}
}

module.exports = VoiceConnections;