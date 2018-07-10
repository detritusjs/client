const Utils = require('../utils');

const AudioCodecs = Utils.Constants.Discord.Voice;
const OpCodes = Utils.Constants.Discord.OpCodes.Voice;
const SpeakingFlags = Utils.Constants.Discord.SpeakingFlags;
const Encoders = Utils.Constants.Encoders;

const defaults = {
	opusEncoder: false,
	opusDecoder: false,
	decodeAudio: null
};

const opusProperties = ['sampleRate', 'channels', 'application', 'mod'];

class VoiceConnection extends Utils.EventEmitter {
	constructor(client, gateway, options) {
		super();

		Object.defineProperties(this, {
			client: {value: client},
			gateway: {value: gateway},
			opusEncoder: {configurable: true, value: null},
			opusDecoder: {configurable: true, value: null},
			opusDecoders: {value: new Map()},
			decodeAudio: {configurable: true, value: null},
			formats: {enumerable: true, value: {}}
		});

		this.formats.audio = new Utils.AudioFormat({
			sampleRate: AudioCodecs.Opus.SAMPLE_RATE,
			channels: AudioCodecs.Opus.CHANNELS
		});

		options = Object.assign({}, defaults, options);
		if (options.opusEncoder) {
			this.setOpusEncoder(options.opusEncoder);
		}

		if (options.opusDecoder || options.decodeAudio) {
			this.setOpusDecoder(options.opusDecoder);
			if (options.decodeAudio === null) {
				options.decodeAudio = true;
			}
		}

		gateway.on('packet', (packet) => {
			switch (packet.op) {
				case OpCodes.SPEAKING: {
					this.emit('speaking', {
						user: this.client.users.get(packet.d.user_id),
						userId: packet.d.user_id,
						speaking: ((packet.d.speaking & SpeakingFlags.VOICE) === SpeakingFlags.VOICE),
						soundshare: ((packet.d.speaking & SpeakingFlags.SOUNDSHARE) === SpeakingFlags.SOUNDSHARE)
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
				try {
					switch (event.format) {
						case 'audio': {
							if (!this.decodeAudio) {return;}

							if (event.payloadType === 'opus') {
								if (!this.opusDecoder) {return;}
								
								data = this.decode(event.userId, event.data);
								format.sampleRate = this.opusDecoder.sampleRate;
								format.channels = this.opusDecoder.channels;
								format.frameDuration = this.formats.audio.frameDuration;
							}
						}; break;
						default: return;
					}
				} catch(e) {
					return this.emit('warn', e);
				}
				
				this.emit(event.format, Object.assign({}, event, {data, format}));
			});
		});

		gateway.once('killed', this.kill.bind(this));
		gateway.on('warn', this.emit.bind(this, 'warn'));

		this.setDecodeAudio(options.decodeAudio);
	}

	get killed() {return this.gateway.killed;}

	get channelId() {return this.gateway.channelId;}
	get guildId() {return this.gateway.guildId;}
	get serverId() {return this.gateway.serverId;}
	get userId() {return this.gateway.userId;}
	get voiceState() {return this.client.voiceStates.get(this.serverId, this.gateway.userId);}

	get guild() {return (this.guildId) ? this.client.guilds.get(this.guildId) : null;}
	get channel() {return this.client.channels.get(this.channelId);}
	
	get member() {return (this.guildId) ? this.client.members.get(this.guildId, this.userId) : null;}
	get user() {return this.client.users.get(this.userId);}

	setOpusEncoder(options) {
		options = Object.assign({
			sampleRate: this.formats.audio.sampleRate,
			channels: this.formats.audio.channels,
			application: Encoders.Opus.Applications.AUDIO,
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
			if (opusProperties.every((property) => options[property] === this.opusEncoder[property])) {return;}
			this.opusEncoder.delete();
			Object.defineProperty(this, 'opusEncoder', {value: null});
		}

		const opusEncoder = new VoiceTools.AudioOpus(options.sampleRate, options.channels, options.application, options.mod);
		Object.defineProperty(this, 'opusEncoder', {value: opusEncoder});
	}

	setOpusDecoder(options) {
		options = Object.assign({
			sampleRate: this.formats.audio.sampleRate,
			channels: this.formats.audio.channels,
			application: Encoders.Opus.Applications.AUDIO,
			kill: false
		}, options);

		if (options.kill) {
			Object.defineProperty(this, 'opusDecoder', {value: null});
			if (!this.opusDecoders.length) {return;}
			this.opusDecoders.forEach((decoder) => decoder.kill());
			return this.opusDecoders.clear();
		}

		if (!options.mod) {
			if (this.opusDecoder) {
				options.mod = this.opusDecoder.mod;
			} else if (this.opusEncoder) {
				options.mod = this.opusEncoder.mod;
			}
		}

		if (this.opusDecoder && opusProperties.every((property) => options[property] === this.opusDecoder[property])) {return;}

		const opusDecoder = {};
		opusProperties.forEach((property) => {
			opusDecoder[property] = options[property];
		});
		Object.defineProperty(this, 'opusDecoder', {value: opusDecoder});

		this.opusDecoders.forEach((decoder, userId) => {
			decoder.kill();
			this.fetchOpusDecoder(userId);
		});
	}

	setDecodeAudio(decode) {
		Object.defineProperty(this, 'decodeAudio', {value: !!decode});
	}

	setSpeaking(speaking, delay) {
		return new Promise((resolve, reject) => {
			this.gateway.sendSpeaking(speaking, delay, resolve);
		});
	}

	setState(options) {
		return new Promise((resolve, reject) => {
			this.gateway.sendStateUpdate(options, resolve);
		});
	}

	setDeaf(deaf) {return this.setState({deaf});}
	setMute(mute) {return this.setState({mute});}
	setVideo(video) {return this.setState({video});}

	fetchOpusDecoder(userId) {
		if (!this.opusDecoder) {throw new Error('Create an opus decoder before trying to decode opus!');}
		if (this.opusDecoders.has(userId)) {
			return this.opusDecoders.get(userId);
		}

		const opusDecoder = new VoiceTools.AudioOpus(
			this.opusDecoder.sampleRate,
			this.opusDecoder.channels,
			this.opusDecoder.application,
			this.opusDecoder.mod
		);
		this.opusDecoders.set(userId, opusDecoder);
		return opusDecoder;
	}

	enqueueAudio(data, options) {
		if (this.killed) {return;}
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

	decode(userId, data, options) {
		options = Object.assign({format: 'audio', type: 'opus'}, options);
		if (options.format === 'audio') {
			options = Object.assign({frameDuration: this.formats.audio.frameDuration}, options);
			if (options.type === 'opus') {
				const opusDecoder = this.fetchOpusDecoder(userId);
				return opusDecoder.decode(data, options.frameDuration);
			}
		}
		throw new Error(`Cannot decode ${options.format}-${options.type} type data`);
	}

	kill() {
		this.client.voiceConnections.delete(this.serverId);
		this.gateway.kill();
		this.setOpusEncoder({kill: true});
		this.setOpusDecoder({kill: true});
		this.emit('killed');
	}
}

module.exports = VoiceConnection;