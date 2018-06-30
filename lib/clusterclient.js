'use strict';

const Client = require('./client');
const Collections = require('./collections');
const RestClient = require('detritus-client-rest').Client;
const Utils = require('./utils');

class ClusterClient extends Utils.EventEmitter {
	constructor(token, options) {
		if (!token) {throw new Error('Token is required for this library to work.');}

		super();

		options = Object.assign({cache: {}, pass: {}}, options);

		Object.defineProperties(this, {
			shardStart: {enumerable: true, configurable: true, value: 0},
			shardEnd: {enumerable: true, configurable: true, value: -1},
			shardCount: {enumerable: true, configurable: true, value: options.shardCount || 0},
			shards: {enumerable: true, value: new Map()}
		});

		if (Array.isArray(options.shards)) {
			if (options.shards.length !== 2) {
				throw new Error('Shards need to be in the format of [shardStart, shardEnd]');
			}
			this.setShardStart(options.shards.shift());
			this.setShardEnd(options.shards.shift());
		}

		options.isBot = true;
		options.rest = Object.assign({}, options.rest, {authType: 'bot'});

		Object.defineProperties(this, {
			rest: {value: new RestClient(token, options.rest, this)}
		});

		options.rest.globalBucket = this.rest.global;
		options.pass = Object.assign({}, options.pass, {cluster: this});
		options.gateway = Object.assign({}, options.gateway);

		Object.defineProperties(this, {
			token: {value: token},
			clientOptions: {value: options},
			ran: {configurable: true, value: false}
		});
	}

	setShardStart(value) {
		Object.defineProperty(this, 'shardStart', {value});
	}

	setShardEnd(value) {
		Object.defineProperty(this, 'shardEnd', {value});
	}


	kill() {
		if (!this.ran) {return;}
		this.shards.forEach((shard) => shard.kill());
		this.shards.clear();
		Object.defineProperty(this, 'ran', {value: false});
		this.emit('killed');
		this.clearListeners();
	}

	emit(client, name, event) {
		super.emit.call(client, name, event);
		super.emit.call(this, name, Object.assign(event, {client, shardId: client.shardId}));
	}

	run(options) {
		if (this.ran) {return Promise.resolve(Array.from(this.shards.values()));}

		options = Object.assign({wait: true}, options);

		const fetchGateway = (options.url) ? Promise.resolve({url: options.url, shards: 0}) : this.rest.fetchGatewayBot();

		return fetchGateway.then(({url, shards}) => {
			shards = options.shardCount || this.shardCount || shards;
			if (!shards) {return Promise.reject(new Error('Pass in the shard count via the options or the constructor when passing in an url!'));}

			Object.defineProperty(this, 'shardCount', {configurable: false, value: shards});
			if (this.shardEnd === -1) {this.setShardEnd(shards - 1);}

			Object.assign(options, {url});
			
			const promises = [];
			for (let i = this.shardStart; i <= this.shardEnd; i++) {
				Object.assign(this.clientOptions.gateway, {shardId: i, shardCount: shards});
				const client = new Client(this.token, this.clientOptions);

				Object.defineProperty(client, 'emit', {value: this.emit.bind(this, client)});
				this.shards.set(i, client);
				promises.push(client.run(options));
			}

			return Promise.all(promises).then((clients) => {
				Object.defineProperty(this, 'ran', {value: true});
				return clients;
			});
		});
	}
}

module.exports = ClusterClient;