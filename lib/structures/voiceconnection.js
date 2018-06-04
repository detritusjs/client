const Utils = require('../utils');

const Constants = Utils.Constants;
const OpCodes = Constants.Gateway.OpCodes.Voice;

const VoiceTools = require('detritus-websocket').Utils.Voice;

class VoiceConnection extends Utils.EventEmitter
{
	constructor(client, gateway, options)
	{
		super();

		Object.defineProperties(this, {
			client: {value: client},
			gateway: {value: gateway},
			discordFormat: {value: {sampleRate: 48000, channels: 2, frameDuration: 20, samplesPerFrame: 960} || new VoiceTools.AudioFormat({sampleRate: 48000, channels: 2})},
			opusEncoder: {configurable: true, value: null},
			opusDecoder: {configurable: true, value: null}
		});

		options = options || {};
		if (options.opusEncoder) {
			this.setOpusEncoder();
		}

		if (options.opusDecoder) {
			this.setOpusDecoder(options.opusDecoder);
		}

		gateway.on('packet', (packet) => {
			switch (packet.op) {
				case OpCodes.SPEAKING: {
					this.emit('speaking', {
						user: this.client.users.get(packet.d.user_id),
						userId: packet.d.user_id,
						speaking: !!(packet.d.speaking & Constants.Gateway.Voice.VOICE),
						soundshare: !!(packet.d.speaking & Constants.Gateway.Voice.SOUNDSHARE)
					});
				}; break;
				case OpCodes.CLIENT_CONNECT: {
					this.emit('connect', {
						user: this.client.users.get(packet.d.user_id),
						userId: packet.d.user_id
					});
				}; break;
				case OpCodes.CLIENT_DISCONNECT: {
					this.emit('disconnect', {
						user: this.client.users.get(packet.d.user_id),
						userId: packet.d.user_id
					});
				}; break;
			}
		});

		gateway.once('udpReady', ({udp}) => {
			this.emit('ready');

			udp.on('packet', (event) => {
				this.emit('packet', event);
				if (this.opusDecoder) {
					this.emit('opus', Object.assign({
						data: this.opusDecoder.decode(event.data, 20),
						format: {
							sampleRate: this.opusDecoder.sampleRate,
							channels: this.opusDecoder.channels,
							frameDuration: this.discordFormat.frameDuration
						}
					}, event));
				}
			});
		});

		gateway.once('killed', this.kill.bind(this));
	}

	get serverId() {return this.gateway.serverId;}
	get voiceState() {return this.client.voiceStates.get(this.serverId, this.gateway.userId);}

	get guild() {
		const voiceState = this.voiceState;
		return (voiceState) ? voiceState.guild : null;
	}

	get channel() {
		const voiceState = this.voiceState;
		return (voiceState) ? voiceState.channel : null;
	}

	get member() {
		const voiceState = this.voiceState;
		return (voiceState) ? voiceState.member : null;
	}

	get user() {return this.client.users.get(this.gateway.userId);}

	setOpusEncoder(options)
	{
		options = Object.assign({
			sampleRate: this.discordFormat.sampleRate,
			channels: this.discordFormat.channels,
			application: Constants.Gateway.Opus.AUDIO
		}, options);

		if (!options.mod) {
			if (this.opusEncoder) {
				options.mod = this.opusEncoder.mod;
			} else if (this.opusDecoder) {
				options.mod = this.opusDecoder.mod;
			}
		}

		if (this.opusEncoder) {
			if (['sampleRate', 'channels', 'application', 'mod'].every((property) => options[property] === this.opusEncoder[property])) {return;}

			if (this.opusEncoder !== this.opusDecoder) {
				this.opusEncoder.delete();
				this.opusEncoder = null;
			}
		}

		let opusEncoder;
		if (this.opusDecoder && ['sampleRate', 'channels', 'application', 'mod'].every((property) => options[property] === this.opusDecoder[property])) {
			opusEncoder = this.opusDecoder;
		}
		if (!opusEncoder) {
			opusEncoder = new VoiceTools.AudioOpus(options.sampleRate, options.channels, options.application, options.mod);
		}

		Object.defineProperty(this, 'opusEncoder', {value: opusEncoder});
	}

	setOpusDecoder(options)
	{
		options = Object.assign({
			sampleRate: this.discordFormat.sampleRate,
			channels: this.discordFormat.channels,
			application: Constants.Gateway.Opus.AUDIO
		}, options);

		if (!options.mod) {
			if (this.opusDecoder) {
				options.mod = this.opusDecoder.mod;
			} else if (this.opusEncoder) {
				options.mod = this.opusEncoder.mod;
			}
		}

		if (this.opusDecoder) {
			if (['sampleRate', 'channels', 'application', 'mod'].every((property) => options[property] === this.opusDecoder[property])) {return;}

			if (this.opusDecoder !== this.opusEncoder) {
				this.opusDecoder.delete();
				this.opusDecoder = null;
			}
		}

		let opusDecoder;
		if (this.opusEncoder && ['sampleRate', 'channels', 'application', 'mod'].every((property) => options[property] === this.opusEncoder[property])) {
			opusDecoder = this.opusDecoder;
		}
		if (!opusDecoder) {
			opusDecoder = new VoiceTools.AudioOpus(options.sampleRate, options.channels, options.application, options.mod);
		}

		Object.defineProperty(this, 'opusDecoder', {value: opusDecoder});
	}

	setSpeaking(speaking, delay)
	{
		return new Promise((resolve, reject) => {
			this.gateway.sendSpeaking(speaking, delay, resolve);
		});
	}

	setState(options)
	{
		return new Promise((resolve, reject) => {
			const voiceState = this.voiceState;
			if (!voiceState) {return reject(new Error('Voice State not found for this connection.'));}
			this.client.gateway.voiceStateUpdate(voiceState.guildId, voiceState.channelId, options, resolve);
		});
	}

	setMute(mute) {return this.setState({mute});}
	setDeaf(deaf) {return this.setState({deaf});}

	enqueue(data, options)
	{
		if (!this.gateway.udp) {throw new Error('UDP isnt initialized yet!');}

		options = options || {};

		if (!options.isOpus) {
			if (!this.opusEncoder) {throw new Error('Cannot send in Non-OPUS Data without an opus encoder!');}
			data = this.opusEncoder.encode(data, this.discordFormat.frameDuration);
		}

		//assume its 48000 sample rate, 2 channels
		this.gateway.udp.sendAudioFrame(data, {
			timestamp: this.discordFormat.samplesPerFrame,
			incrementTimestamp: true
		});
	}

	kill()
	{
		this.client.voiceConnections.delete(this.gateway.serverId);
		this.gateway.kill();
		if (this.opusEncoder) {
			this.opusEncoder.delete();
			this.opusEncoder = null;
		}
		if (this.opusDecoder) {
			this.opusDecoder.delete();
			this.opusDecoder = null;
		}
		this.emit('killed');
	}
}

module.exports = VoiceConnection;