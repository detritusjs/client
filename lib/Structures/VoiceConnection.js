const BaseStructure = require('./BaseStructure.js');
const VoiceGateway = require('../Socket').VoiceGateway;

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
	channel_id: null,
	guild_id: null,
	token: null,
	endpoint: null,
	mute: false,
	deafen: false
};

class VoiceConnection extends BaseStructure
{
    constructor(client, raw)
    {
		super(client, Object.assign({}, def, raw));

		this.gateway = null;
		
		this.awaiting = {
			voiceState: [],
			voiceServer: []
		};

		this.listeners = {
			opus: null,
			pcm: null
		};
    }

    get channel()
    {
        return this.client.channels.get(this.channelId);
    }

    get guild()
    {
        return this.client.guilds.get(this.guildId);
	}

	_state(voiceState)
	{
		Object.defineProperties(this, {
			'voiceState': {configurable: true, enumerable: true, writable: false, value: voiceState}
		});

		while (this.awaiting.voiceState.length) {
			(this.awaiting.voiceState.shift())();
		}
	}

	_connect(token, endpoint)
	{
		Object.defineProperties(this, {
			'token': {configurable: true, enumerable: true, writable: false, value: token},
			'endpoint': {configurable: true, enumerable: true, writable: false, value: endpoint}
		});

		if (this.gateway) {
			this.gateway.disconnect();
		} else {
			const gateway = new VoiceGateway(this.client, {
				guildId: this.guildId,
				userId: this.voiceState.userId,
				sessionId: this.voiceState.sessionId,
				token: this.token
			});

			//idk if the voice state update would ever come after the voice server update

			Object.defineProperties(this, {
				'gateway': {configurable: true, enumerable: true, writable: false, value: gateway}
			});
		}

		this.gateway.connect(this.endpoint);

		while (this.awaiting.voiceServer.length) {
			(this.awaiting.voiceServer.shift())();
		}
	}

	createListener(listenType, sampleRate)
	{
		

		this.voiceGateway.udp.listen();
	}

	speaking(speaking, delay=0)
	{
		if (!this.gateway) {throw new Error('Gateway is not ready!');}
		this.gateway.setSpeaking(speaking, delay);
	}
	
	join(channelId, {mute, deafen, timeout})
	{
		//wait for voice state event lol
		return new Promise((resolve, reject) => {
			this.client.gateway.send(Constants.OpCodes.Gateway.VOICE_STATE_UPDATE, {
				'guild_id': this.guildId,
				'channel_id': channelId,
				'self_mute': !!mute,
				'self_deaf': !!deafen
			});

			if (!this.gateway) {
				Promise.all(['voiceState', 'voiceServer'].map((awaitType) => {
					return new Promise((resolve, reject) => {
						this.awaiting[awaitType].push(resolve);
						//add timeout checks i guess
					});
				})).then(resolve).catch(reject);
			} else {
				resolve();
			}

			timeout = setTimeout(() => {
				reject(new Error(`Voice connection join took too long`));
				timeout = null;
			}, (timeout || 60) * 1000);
		}).then(() => {
			if (timeout) {clearTimeout(timeout);}
			return Promise.resolve(this);
		}).catch((e) => {
			if (timeout) {clearTimeout(timeout);}
			return Promise.reject(e);
		});
	}
}

module.exports = VoiceConnection;