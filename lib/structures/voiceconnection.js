const Utils = require('../utils');

const Constants = Utils.Constants;
const OpCodes = Constants.Gateway.OpCodes.Voice;
const OpusFormat = Constants.Gateway.Voice.OpusFormat;

const VoiceTools = require('detritus-websocket').Utils.Voice;

const defaults = {
	opusEncoder: false,
	opusDecoder: false
};

class VoiceConnection extends Utils.EventEmitter
{
	constructor(client, gateway, options)
	{
		super();

		Object.defineProperties(this, {
			client: {value: client},
			gateway: {value: gateway},
			opusEncoder: {configurable: true, value: null},
			opusDecoder: {configurable: true, value: null},
			formats: {enumerable: true, value: {}}
		});

		this.formats.audio = new VoiceTools.AudioFormat({sampleRate: OpusFormat.SAMPLE_RATE, channels: OpusFormat.CHANNELS});

		options = Object.assign({}, defaults, options);
		if (options.opusEncoder) {
			this.setOpusEncoder(options.opusEncoder);
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
						speaking: !!(packet.d.speaking & Constants.Gateway.Voice.Speaking.VOICE),
						soundshare: !!(packet.d.speaking & Constants.Gateway.Voice.Speaking.SOUNDSHARE)
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

			udp.on('warn', this.emit.bind(this, 'warn'));
			udp.on('packet', (event) => {
				this.emit('packet', event);

				let data;
				const format = {};
				switch (event.packetType) {
					case 'audio': {
						if (!this.opusDecoder) {return;}

						data = this.opusDecoder.decode(event.data, this.formats.audio.frameDuration);
						format.sampleRate = this.opusDecoder.sampleRate;
						format.channels = this.opusDecoder.channels;
						format.frameDuration = this.formats.audio.frameDuration;
					}; break;
					default: return;
				}
				
				this.emit(event.packetType, Object.assign({}, event, {data, format}));
			});
		});

		gateway.once('killed', this.kill.bind(this));
		gateway.on('warn', this.emit.bind(this, 'warn'));
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
			sampleRate: this.formats.audio.sampleRate,
			channels: this.formats.audio.channels,
			application: Constants.Gateway.Opus.AUDIO,
			kill: false
		}, options);

		if (options.kill) {
			if (this.opusEncoder) {
				this.opusEncoder.delete();
				Object.defineProperty(this, 'opusEncoder', {value: null});
			}
			return;
		}

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
				Object.defineProperty(this, 'opusEncoder', {value: null});
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
			sampleRate: this.formats.audio.sampleRate,
			channels: this.formats.audio.channels,
			application: Constants.Gateway.Opus.AUDIO,
			kill: false
		}, options);

		if (options.kill) {
			if (this.opusDecoder) {
				this.opusDecoder.delete();
				Object.defineProperty(this, 'opusDecoder', {value: null});
			}
			return;
		}

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
				Object.defineProperty(this, 'opusDecoder', {value: null});
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

		options = Object.assign({isOpus: false}, options);

		if (!options.isOpus) {
			if (!this.opusEncoder) {throw new Error('Cannot send in Non-OPUS Data without an opus encoder!');}
			data = this.opusEncoder.encode(data, this.formats.audio.frameDuration);
		}

		//assume its 48000 sample rate, 2 channels
		this.gateway.udp.sendAudioFrame(data, {
			timestamp: this.formats.audio.samplesPerFrame,
			incrementTimestamp: true
		});
	}

	kill()
	{
		this.client.voiceConnections.delete(this.gateway.serverId);
		this.gateway.kill();
		if (this.opusEncoder) {
			this.opusEncoder.delete();
			Object.defineProperty(this, 'opusEncoder', {value: null});
		}
		if (this.opusDecoder) {
			this.opusDecoder.delete();
			Object.defineProperty(this, 'opusDecoder', {value: null});
		}
		this.emit('killed');
	}
}

module.exports = VoiceConnection;