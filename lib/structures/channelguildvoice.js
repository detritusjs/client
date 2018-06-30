const Structures = {ChannelGuildBase: require('./channelguildbase')};

const defaults = Object.assign({
	bitrate: 64000,
	user_limit: 0
}, Structures.ChannelGuildBase.defaults);

class ChannelGuildVoice extends Structures.ChannelGuildBase {
	constructor(client, data) {
		super(client, data, defaults);
	}

	get joined() {
		return this.client.voiceConnections.has(this.guildId) && this.client.voiceConnections.get(this.guildId).channelId === this.id;
	}

	get members() {
		const voiceStates = this.voiceStates;
		return (voiceStates) ? voiceStates.map((state) => state.member) : null;
	}

	get voiceStates() {
		const voiceStates = this.client.voiceStates.get(this.guildId);
		return (voiceStates) ? voiceStates.filter((state) => state.channelId === this.id) : null;
	}

	join(options) {
		return this.client.voiceConnect(this.guildId, this.id, options);
	}
}

ChannelGuildVoice.defaults = defaults;
ChannelGuildVoice.ignore = Structures.ChannelGuildBase.ignore;
module.exports = ChannelGuildVoice;