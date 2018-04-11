'use strict';

const Communications = {
	HTTP: require('http'),
	HTTPS: require('https'),
	TLS: require('tls')
};

const ALPNProtocols = ['http/1.1'];

try {
	Communications.HTTP2 = require('http2');
	ALPNProtocols.push('h2');
} catch(e) {}

const UrlUtils = require('url');
const Zlib = require('zlib');

const Utils = require('../Utils');

class Request
{
	constructor(rest, options)
	{
		this.rest = rest;

		options = options || {};
		Object.defineProperties(this, {
			maxRetries: {writable: false, value: options.maxRetries || this.rest.options.maxRetries || 5},
			retryDelay: {writable: false, value: (options.retryDelay || this.rest.options.retryDelay || 2) * 1000},
			timeout:    {writable: false, value: (options.timeout || this.rest.options.timeout || 20) * 1000}
		});

		this.method = (options.method || '').toUpperCase();
		this.headers = options.headers || {};

		if (options.route) {
			const route = options.route;
	
			if (this.rest.buckets.has(route.bucket)) {
				this.bucket = this.rest.buckets.get(route.bucket);
			} else {
				this.bucket = new Utils.Buckets.HttpBucket(route.bucket);
			}
		}

		if (options.reason) {
			this.headers['X-Audit-Log-Reason'] = encodeURIComponent(options.reason);
		}

		this.body = this.parseBody({
			body: options.body || null,
			files: options.files || [],
			jsonify: options.jsonify || false
		});

		this.url = options.url || {};

		if (!['http:', 'https:'].includes(this.url.protocol)) {
			throw new Error(`Protocol not supported: ${this.url.protocol}`);
		}

		this.retries = 0;
	}

	expireBucket()
	{
		if (!this.bucket) {return;}
		if (!this.bucket.size) {
			this.rest.buckets.expire(this.bucket);
		} else {
			this.rest.buckets.stopExpire(this.bucket);
		}
	}

	parseBody(options)
	{
		if (options.files && options.files.length) {
			const body = new Utils.MultipartData();
			this.headers['Content-Type'] = `multipart/form-data; boundary=${body.boundary}`;

			options.files.forEach((value, key) => {
				if (!value.file) {return;}
				body.add(`file${key}`, value.file, value.name);
			});

			if (options.body) {
				if (options.jsonify) {
					body.add('payload_json', options.body);
				} else {
					for (let key in options.body) {
						body.add(key, options.body[key]);
					}
				}
			}

			return body.done();
		}

		if (options.body) {
			if (options.jsonify) {
				this.headers['Content-Type'] = 'application/json'; //add the charset?
				return JSON.stringify(options.body);
			} else {
				const body = new Utils.MultipartData();
				this.headers['Content-Type'] = `multipart/form-data; boundary=${body.boundary}`;
				for (let key in options.body) {
					body.add(key, options.body[key]);
				}
				return body.done();
			}
		}
	}

	defer(request, unshift=false)
	{
		this.bucket.add(request, unshift);
		this.rest.buckets.stopExpire(this.bucket);
	}

	connect()
	{
		const options = {
			method: this.method,
			headers: this.headers,
			protocol: this.url.protocol,
			host: this.url.host,
			path: this.url.pathname + this.url.search
		};

		let connection;
		return new Promise((resolve, reject) => {
			switch (options.protocol) {
				case 'http': {
					resolve({request: Communications.HTTP.request(options)});
				}; break;
				case 'https:': {
					const socket = Communications.TLS.connect({
						host: options.host,
						port: this.url.port || 443,
						servername: options.host,
						ALPNProtocols
					});
	
					socket.once('secureConnect', () => {
						if (!socket.authorized) {} //dunno lol
	
						switch (socket.alpnProtocol) {
							case 'http/1.1': {
								options.createConnection = () => socket;
								resolve({request: Communications.HTTPS.request(options)});
							}; break;
							case 'h2': {
								if (!Communications.HTTP2) {
									return reject(new Error('http2 isnt support by this node\'s version.'));
								}

								const connection = Communications.HTTP2.connect({
									host: options.host,
									port: this.url.port || 443
								}, {createConnection: () => socket});

								const http2Options = Object.assign({
									':method': options.method.toUpperCase(), //lol lower case isnt allowed
									':authority': options.host,
									':path': options.path
								}, options.headers);

								resolve({
									request: connection.request(http2Options),
									connection
								});
							}; break;
							default: {
								reject(new Error(`Invalid ALPN Protocol returned: ${socket.alpnProtocol}`));
							};
						}
					});
				}; break;
				default: {
					reject(new Error(`Protocol not supported: ${options.protocol}`));
				};
			}
		}).then(({request, connection}) => {
			return new Promise((resolve, reject) => {
				let error;
				request.once('error', (e) => {
					error = e;
					request.abort();
				}).once('abort', () => {
					error = error || new Error(`Request aborted by the client. [${this.method}-${UrlUtils.format(this.url)}]`);
					error.request = request;
					reject(error);
				});
				
				const now = Utils.Tools.now();
				if (connection) {
					request.once('response', (headers, flags) => {
						request.statusCode = headers[':status'];
						request.headers = headers;
						request.latency = Utils.Tools.now() - now;
						resolve({response: request, connection});
					});
				} else {
					request.once('response', (response) => {
						response.latency = Utils.Tools.now() - now;
						resolve({response});
					});
				}

				request.setTimeout(this.timeout, () => {
					error = new Error(`Request lasted for more than ${this.timeout}s. [${this.method}-${UrlUtils.format(this.url)}]`);
					request.abort();
				});

				if (Array.isArray(this.body)) {
					this.body.forEach((chunk) => {
						request.write(chunk);
					});
					request.end();
				} else {
					request.end(this.body);
				}
			});
		});
	}

	call()
	{
		return new Promise((resolve, reject) => {
			if (this.retries && ++this.retries >= this.maxRetries) {
				return reject(new Error(`Reached max retries (${this.maxRetries}). [${this.method}-${UrlUtils.format(this.url)}]`));
			}

			this.connect().then(({response, connection}) => {
				response.once('aborted', () => {
					let error = new Error(`Response was aborted by the server. [${this.method}-${UrlUtils.format(this.url)}]`);
					error.response = response;
					reject(error);
				});

				let stream = response;
				if (![204, 304].includes(response.statusCode) && response.headers['content-encoding']) {
					response.headers['content-encoding'].split(', ').forEach((format) => {
						switch (format) {
							case 'gzip': stream = stream.pipe(Zlib.createGunzip()); break;
							case 'deflate': stream = stream.pipe(Zlib.createInflate()); break;
						}
					});
				}

				let data = '';
				stream.on('data', (d) => {
					if (Buffer.isBuffer(d)) {
						data += d.toString();
					} else {
						data += d;
					}
				}).once('end', () => {
					if (connection && connection.close) {
						connection.close();
					}
					if (this.bucket) {
						const ratelimit = {
							limit: parseInt(response.headers['x-ratelimit-limit'] || -1),
							remaining: parseInt(response.headers['x-ratelimit-remaining'] || -1),
							reset: parseInt(response.headers['x-ratelimit-reset'] || 0) * 1000
						};
						if (ratelimit.remaining === 0 && response.statusCode !== 429) {
							const now = Date.parse(response.headers['date']);
							let diff = Math.max(0, ratelimit.reset - now);
							if (this.bucket.route === Utils.Constants.Endpoints.REST.CHANNELS.MESSAGE_REACTION_USER && diff === 1000) {
								diff = 250;
								ratelimit.reset = now + diff;
							}
							if (diff) {this.bucket.lock(diff);}
						}
					}

					if (response.statusCode === 429 && this.bucket) {
						const retryAfter = parseInt(response.headers['retry-after']);
						const request = {
							call: this.call.bind(this),
							resolve,
							reject
						};
						if (response.headers['x-ratelimit-global'] === 'true') {
							this.rest.global.lock(retryAfter);
							this.rest.global.add(request);
						} else {
							this.bucket.lock(retryAfter);
							this.bucket.add(request, true);
						}
						return;
					}

					response.data = data;
					if (data) {
						const contentType = (response.headers['content-type'] || '').split(';').shift();
						if (contentType === 'application/json') {
							try {
								data = JSON.parse(data);
								response.data = data;
							} catch(error) {
								error.response = response;
								return reject(error);
							}
						}
					}

					if (200 <= response.statusCode && response.statusCode < 300) {
						resolve({response, data});
					} else if (response.statusCode === 502) {
						setTimeout(() => {
							this.call().then(resolve).catch(reject);
						}, this.retries * this.retryDelay);
					} else {
						let error = new Error(`HTTP Exception: ${response.statusCode}`);
						error.response = response;
						reject(error);
					}
				});
			}).catch(reject);
		});
	}

	send()
	{
		return new Promise((resolve, reject) => {
			if (this.bucket) {
				const request = {
					call: this.call.bind(this),
					resolve,
					reject
				};
				if (this.rest.global.locked) {
					this.rest.global.add(request)
				} else {
					this.defer(request);
				}
			} else {
				this.call().then(resolve).catch(reject);
			}
		}).then((r) => {
			this.expireBucket();
			return Promise.resolve(r);
		}).catch((e) => {
			this.expireBucket();
			return Promise.reject(e);
		});
	}
}

module.exports = Request;