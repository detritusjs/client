const BaseCollection = require('./basecollection');

const defaults = {enabled: true};

class VoiceConnections extends BaseCollection
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