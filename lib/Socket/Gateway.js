const UrlUtils = require('url');
const os = require('os');

const GatewayHandler = require('../Handlers').GatewayHandler;
const Utils = require('../Utils');
const Constants = Utils.Constants;
const OpCodes = Constants.OpCodes;

const Dependencies = {
	BaseSocket: null
};

try {
	Dependencies.BaseSocket = require('./BaseSocket.js');
} catch(e) {}

const defaultOptions = {
	autoReconnect: true,
	compress: false,
	disabledEvents: [],
	encoding: 'json',
	largeThreshold: 250,
	loadAllMembers: false,
	pingTimeout: 1,
	reconnectIn: 5,
	shardCount: 1,
	shardId: 0
};

class Gateway
{
	constructor(client, options={})
	{
		if (!Dependencies.BaseSocket) {
			throw new Error('You must install `ws` to be able to use the normal client!');
		}

		this.client = client;
		this.socket = null;

		options = Object.assign({}, defaultOptions, options);
		Object.defineProperties(this, {
			autoReconnect: {writable: false, value: !!options.autoReconnect},
			compress: {writable: false, value: !!options.compress},
			encoding: {writable: false, value: options.encoding},
			disabledEvents: {writable: false, value: options.disabledEvents},
			largeThreshold: {writable: false, value: options.largeThreshold},
			loadAllMembers: {writable: false, value: !!options.loadAllMembers},
			pingTimeout: {writable: false, value: options.pingTimeout},
			reconnectIn: {writable: false, value: options.reconnectIn},
			shardCount: {writable: false, value: options.shardCount},
			shardId: {writable: false, value: options.shardId}
		});

		if (!Constants.Gateway.Encoding.includes(this.encoding)) {
			throw new Error(`Invalid Encoding Type, valid: ${JSON.stringify(Constants.Gateway.Encoding)}`);
		}

		this.handler = new GatewayHandler(this, this.disabledEvents);

		this.seq = 0;
		this.sessionId = null;
		this.discordTrace = [];

		this._send = {
			expire: null,
			limit: 120,
			limitCounter: 0,
			limitTimestamp: 0,
			queue: [],
			ratelimit: 60 * 1000
		};

		this._heartbeat = {
			ack: false,
			lastAck: null,
			interval: null
		};
		
		this.presence = null;
	}

	get connected()
	{
		return this.socket && this.socket.connected;
	}

	get connecting()
	{
		return this.socket && this.socket.connecting;
	}

	_sendQueue()
	{
		this.socket.send(this._send.queue.shift());
		//add ratelimits
	}
	
	ping()
	{
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				return reject(new Error('Socket isn\'t set up.'));
			}
			const data = {
				nonce: Utils.Snowflake.generate()
			};

			const timeout = setTimeout(() => {
				reject(new Error(`Pong took longer than ${this.pingTimeout * 1000}ms.`));
			}, this.pingTimeout * 1000);

			const now = Utils.Tools.now();
			const cb = (d) => {
				try {
					d = JSON.parse(d.toString());
					if (d.nonce === data.nonce) {
						clearTimeout(timeout);
						this.socket.removeListener('pong', cb);
						resolve(Math.round(Utils.Tools.now() - now));
					}
				} catch(e) {}
			};
			this.socket.on('pong', cb);
			this.socket.ping(JSON.stringify(data));
		});
	}
	
	setPresence(presence)
	{
		presence = Object.assign({}, {since: null, game: null, status: 'online', afk: false}, presence);

		return new Promise((resolve, reject) => {
			if (presence.game) {
				if (presence.game.name === undefined) {
					return reject(new Error('The game name cannot be empty'));
				}
				if (presence.game.type === undefined) {
					return reject(new Error('The game type cannot be empty'));
				}
			}

			this.send(OpCodes.Gateway.STATUS_UPDATE, presence, (e) => {
				if (e) {
					reject(e);
				} else {
					this.presence = presence;
					resolve();
				}
			});
		});
	}

	decode(data)
	{
		try {
			if (data instanceof ArrayBuffer) {
				if (this.compress || this.encoding === 'etf') {
					data = new Buffer(data);
				}
			} else if (Array.isArray(data)) {
				data = Buffer.concat(data);
			}

			if (this.compress) {
				data = data;
			}

			if (this.encoding === 'etf') {
				return data;
			} else {
				return JSON.parse(data);
			}
		} catch (e) {
			console.error(e.stack);
		}
	}

	connect(url)
	{
		if (this.connected) {
			this.disconnect();
		}

		this.gateway = url || this.gateway;

		url = UrlUtils.parse(this.gateway);
		url.query = {encoding: this.encoding, v: Constants.ApiVersion.GATEWAY};
		url.pathname = url.pathname || '/';

		if (this.compress) {
			Object.assign(url.query, {compress: 'zlib-stream'});
		}

		const ws = this.socket = new Dependencies.BaseSocket(UrlUtils.format(url));
		ws.on('message', (data) => {
			if (ws !== this.socket) {return;}
			this.handle(data);
		});

		ws.on('close', (code, reason) => {
			if (ws !== this.socket) {return;}
			console.log(code, reason);
		});

		ws.on('error', (error) => {
			console.error(error);
		});
	}

	handle(data)
	{
		const packet = this.decode(data);
		if (packet.s) {
			if (packet.s > this.seq + 1 && this.socket && !this.socket.resuming) {
				console.error('bad seq');
				this.seq = packet.s;
				this.resume();
			}
			this.seq = packet.s;
		}

		switch(packet.op)
		{
			case OpCodes.Gateway.HEARTBEAT:
				this.heartbeat();
				break;
			case OpCodes.Gateway.HEARTBEAT_ACK:
				this._heartbeat.lastAck = Utils.Tools.now();
				this._heartbeat.ack = true;
				break;
			case OpCodes.Gateway.HELLO:
				this.setHeartbeat(packet.d);
				if (this.sessionId) {
					this.resume();
				} else {
					this.identify();
				}
				this.heartbeat();
				break;
			case OpCodes.Gateway.INVALID_SESSION:
				if (packet.d) {
					this.resume();
				} else {
					this.seq = 0;
					this.sessionId = null;
					this._send.queue = [];
					this.identify();
				}
				break;
			case OpCodes.Gateway.RECONNECT:
				this.disconnect(OpCodes.Gateway.RECONNECT, 'Reconnecting');
				this.connect();
				break;
			case OpCodes.Gateway.DISPATCH:
				this.handler.event(packet);
				break;
			default:
				console.error('unknown packet', packet);
		}
	}

	identify()
	{
		const data = {
			token: this.client.options.token,
			properties: {
				'$os': `${os.type()} ${os.release()}; ${os.arch()}`,
				'$browser': process.version.replace(/^v/, (process.release.name || 'node') + '/'),
				'$device': `Detritus v${Constants.VERSION}`
			},
			v: Constants.ApiVersion.GATEWAY,
			compress: this.compress,
			large_threshold: this.largeThreshold,
			shard: [this.shardId, this.shardCount]
		};
		
		if (this.presence) {
			data.presence = this.presence;
		}

		//maybe even have presence here

		this.send(OpCodes.Gateway.IDENTIFY, data);
	}

	resume()
	{
		this.send(OpCodes.Gateway.RESUME, {
			token: this.client.options.token,
			session_id: this.sessionId,
			seq: this.seq
		});
	}

	heartbeat(fromInterval)
	{
		if (fromInterval) {
			if (!this._heartbeat.ack) {
				this.disconnect(OpCodes.Gateway.HEARTBEAT_ACK, 'Heartbeat ACK never arrived.');
				this.connect();
				return;
			}
		}
		this._heartbeat.ack = false;
		this.send(OpCodes.Gateway.HEARTBEAT, this.seq);
	}

	setHeartbeat(data)
	{
		if (data && data.heartbeat_interval > 0) {
			this._heartbeat.ack = true;
			if (this._heartbeat.interval) {
				clearInterval(this._heartbeat.interval);
			}
			this._heartbeat.interval = setInterval(() => {
				this.heartbeat(true);
			}, data.heartbeat_interval);
		}
		this.discordTrace = data._trace;
	}

	send(op, data, cb)
	{
		if (this.socket && this.socket.connected) {
			this._send.queue.push({op, data, cb, encoding: this.encoding});
			this._sendQueue();
		}
	}

	disconnect(code, reason)
	{
		if (code === 1000 || code === 1001) {
			this.seq = 0;
			this.sessionId = null;
		}

		if (this.connected) {
			if (code === OpCodes.Gateway.RECONNECT || code === OpCodes.Gateway.HEARTBEAT_ACK) {
				this.socket.close(4000, reason);
			} else {
				this.socket.close(code, reason);
			}

			//emit the disconnect
		}

		console.log(code, reason);

		this.socket.state = Constants.Detritus.State.CLOSED;
		this._send.queue = [];
	}
}

module.exports = Gateway;