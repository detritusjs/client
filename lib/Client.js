'use strict';

const Collections = require('./Collections');
const Gateway = require('./Socket').Gateway;
const Rest = require('./Rest');
const Sharding = require('./Sharding');
const Structures = require('./Structures');
const Utils = require('./Utils');

const defaultOptions = {
	bot: true,
	imageFormat: 'jpg'
};

class Client extends Utils.EventEmitter
{
	constructor(options={})
	{
		super();

		Object.defineProperty(this, 'options', {writable: false, value: this.resolveOptions(options)});
		Object.defineProperties(this, {
			channels:         {writable: false, value: new Collections.Channels(this, this.options.cache.channels)},
			emojis:           {writable: false, value: new Collections.Emojis(this, this.options.cache.emojis)},
			guilds:           {writable: false, value: new Collections.Guilds(this, this.options.cache.guilds)},
			members:          {writable: false, value: new Collections.Members(this, this.options.cache.members)},
			messages:         {writable: false, value: new Collections.Messages(this, this.options.cache.messages)},
			opusObjects:      {writable: false, value: new Collections.OpusObjects(this, this.options.cache.opusObjects)},
			presences:        {writable: false, value: new Collections.Presences(this, this.options.cache.presences)},
			users:            {writable: false, value: new Collections.Users(this, this.options.cache.users)},
			voiceConnections: {writable: false, value: new Collections.VoiceConnections(this, this.options.cache.Connections)},
			voiceStates:      {writable: false, value: new Collections.VoiceStates(this, this.options.cache.voiceStates)},
			gateway:          {writable: false, value: new Gateway(this, this.options.gateway)},
			rest:             {writable: false, value: new Rest(this, this.options.rest)}
		});

		this.isBot = this.options.bot;
	}

	resolveOptions(_options={})
	{
		const options = Object.assign({}, defaultOptions, _options);
		if (!options.token) {
			throw new Error('Token is required for this library to work.');
		}
		options.cache = Object.assign({}, options.cache);
		options.gateway = Object.assign({}, options.gateway);
		options.rest = Object.assign({}, options.rest);
		return options;
	}
	
	joinVoiceChannel(guildId, channelId, options={})
	{
		options.timeout = options.timeout || 30;
		options.mute = !!options.mute;
		options.deafen = !!options.deafen;

		return new Promise((resolve, reject) => {
			if (!guildId || !channelId) {
				reject(new Error('GuildId and ChannelId are both required!'));
				return;
			}

			if (!this.voiceConnections.has(guildId)) {
				this.voiceConnections.update(new Structures.VoiceConnection(this, {'guild_id': guildId}));
			}

			const voiceConnection = this.voiceConnections.get(guildId);

			const timeout = setTimeout(() => {
				this.voiceConnections.delete(guildId);
				reject(new Error(`Voice connection took longer than ${options.timeout} seconds.`));
			}, options.timeout * 1000);

			voiceConnection.join(channelId, options).then(resolve).catch((e) => {
				this.voiceConnections.delete(guildId);
				reject(e);
			}).then(() => {
				clearTimeout(timeout);
			});
		});
	}

	run(options={})
	{
		return new Promise((resolve, reject) => {
			const fetchGateway = (!options.url) ? this.rest.endpoints.fetchGateway() : Promise.resolve({url: options.url});
			fetchGateway.then((data) => {
				if (!data.url) {return reject(new Error('Gateway URL was not retrieved.'));}

				this.gateway.connect(data.url);
				if (options.waitUntilReady) {
					this.once('GATEWAY_READY', resolve);
				} else {
					resolve();
				}
			}).catch(reject);
		}).then(() => this);
	}
}

Client.Shard = Sharding.Shard;
Client.ShardManager = Sharding.ShardManager;
module.exports = Client;