'use strict';

const RestClient = require('detritus-client-rest').Client;
const Gateway = require('detritus-websocket').Gateway;

const Collections = require('./collections');
const Handlers = require('./handlers');
const Structures = require('./structures');
const Utils = require('./utils');

const RestEndpoints = require('./rest').Endpoints;

const defaults = {
	isBot: true,
	imageFormat: 'png'
};

class Client extends Utils.EventEmitter
{
	constructor(token, options)
	{
		if (!token) {throw new Error('Token is required for this library to work.');}

		super();

		options = Object.assign({cache: {}, pass: {}}, options);
		Object.defineProperties(this, {
			channels: {value: options.pass.channels || new Collections.Channels(this, options.cache.channels)},
			emojis: {value: options.pass.emojis || new Collections.Emojis(this, options.cache.emojis)},
			guilds: {value: options.pass.guilds || new Collections.Guilds(this, options.cache.guilds)},
			members: {value: options.pass.members || new Collections.Members(this, options.cache.members)},
			messages: {value: options.pass.messages || new Collections.Messages(this, options.cache.messages)},
			presences: {value: options.pass.presences || new Collections.Presences(this, options.cache.presences)},
			users: {value: options.pass.users || new Collections.Users(this, options.cache.users)},
			voiceStates: {value: options.pass.voiceStates || new Collections.VoiceStates(this, options.cache.voiceStates)},
			voiceConnections: {value: options.pass.voiceConnections || new Collections.VoiceConnections(this, options.cache.voiceConnections)}
		});

		Object.defineProperty(this, 'options', {enumerable: true, value: {}});
		Object.keys(defaults).forEach((key) => {
			this.options[key] = (options[key] === undefined) ? defaults[key] : options[key];
		});

		options.rest = Object.assign({}, options.rest);
		options.rest.authType = (this.isBot) ? 'bot' : 'user';
		options.rest.RestEndpoints = RestEndpoints;
		options.rest.client = this;

		Object.defineProperties(this, {
			gateway: {value: new Gateway(token, options.gateway)},
			rest: {value: new RestClient(token, options.rest, this)},
			token: {value: token}
		});

		Object.defineProperties(this, {
			gatewayHandler: {value: new Handlers.Gateway(this, options.gateway)}
		});

		Object.defineProperties(this, {
			clusterClient: {value: options.pass.clusterClient}
		});
	}

	get isBot() {return (this.user) ? this.user.bot : !!this.options.isBot;}

	get shardCount() {return this.gateway.shardCount;}
	get shardId() {return this.gateway.shardId;}

	ping()
	{
		return Promise.all([
			this.gateway.socket.ping(),
			this.rest.request({route: {method: 'get', path: Utils.Constants.Rest.Endpoints.REST.USERS.ID, params: {userId: '@me'}}})
		]).then(([gatewayPing, response]) => {
			return {gatewayPing, restPing: response.took};
		});
	}

	voiceConnect(guildId, channelId, options)
	{
		options = options || {};
		
		return this.gateway.voiceConnect(guildId, channelId, options).then((vGateway) => {
			const serverId = guildId || channelId;
			if (!vGateway) {
				if (this.voiceConnections.has(serverId)) {
					this.voiceConnections.get(serverId).kill();
				}
			} else {
				const payload = {connection: null, isNew: true};

				if (this.voiceConnections.has(serverId)) {
					payload.isNew = false;
					payload.connection = this.voiceConnections.get(serverId);
					return payload;
				}

				payload.connection = new Structures.VoiceConnection(this, vGateway, options);
				this.voiceConnections.insert(payload.connection);

				if (options.wait) {
					return new Promise((resolve, reject) => {
						payload.connection.once('ready', () => resolve(payload));
					});
				} else {
					return payload;
				}
			}
		});
	}
	
	reset()
	{
		this.channels.clear(this.shardId);
		this.emojis.clear(this.shardId);
		this.guilds.clear(this.shardId);
		this.members.clear(this.shardId);
		this.messages.clear(this.shardId);
		this.presences.clear(this.shardId);
		this.users.clear(this.shardId);
		this.voiceConnections.clear(this.shardId); //kill each one
		this.voiceStates.clear(this.shardId);
	}

	kill()
	{
		this.gateway.kill();
		this.reset();
		if (this.clusterClient) {
			this.clusterClient.shards.delete(this.shardId);
		}
	}

	run(options)
	{
		options = options || {};

		return new Promise((resolve, reject) => {
			const fetchGateway = (options.url) ? Promise.resolve({url: options.url}) : this.rest.endpoints.fetchGateway();
			return fetchGateway.then(({url}) => {
				this.gateway.connect(url);

				return (options.wait) ? this.once('GATEWAY_READY', resolve) : resolve();
			}).catch(reject);
		}).then(() => this);
	}
}

module.exports = Client;