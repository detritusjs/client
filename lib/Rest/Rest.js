'use strict';

const os = require('os');

const RestClient = require('detritus-rest').Client;
const RestEndpoints = require('./RestEndpoints.js');
const RestRequest = require('./Request.js');

const Buckets = require('../Collections').Buckets;
const Utils = require('../Utils');
const Constants = Utils.Constants;


const defaultHeaders = {
	'user-agent': [
			'DiscordBot',
			`(https://github.com/cakedan/detritus, v${Constants.VERSION})`,
			`(${os.type()} ${os.release()}; ${os.arch()})`,
			process.version.replace(/^v/, (process.release.name || 'node') + '/')
		].join(' '),
	'x-super-properties': Buffer.from(JSON.stringify({
			os: os.type(),
			os_version: `${os.release()} ${os.arch()}`,
			browser: process.version.replace(/^v/, (process.release.name || 'node') + '/'),
			device: 'Detritus',
			client_version: Constants.VERSION
		})).toString('base64'),
	'accept-encoding': 'gzip, deflate'
};

class Rest
{
	constructor(client, options)
	{
		this.client = client;
		
		options = options || {};
		this.restClient = new RestClient({
			settings: options.settings,
			baseUrl: Constants.Endpoints.REST.URL + Constants.Endpoints.REST.PATH
		});

		this.buckets = new Buckets({expire: 30});
		this.global = new Utils.Buckets.HttpBucket();

		this.endpoints = new RestEndpoints(this);
	}

	get authType()
	{
		if (this.client.isBot) {return 'Bot';}
		//support oauth in future
	}

	ping()
	{
		return this.request({
			route: {
				method: 'get',
				path: Constants.Endpoints.REST.USERS.ID,
				params: {userId: '@me'}
			}
		}).then((response) => response.took);
	}

	request(options)
	{
		return this.restClient.createRequest(options).then((request) => {
			request.options.headers['user-agent'] = defaultHeaders['user-agent'];
			if (request.url.host === this.restClient.baseUrl.host) {
				request.options.headers['x-super-properties'] = defaultHeaders['x-super-properties'];
			}

			if (options.useAuth || (options.useAuth === undefined && request.url.host === this.restClient.baseUrl.host)) {
				request.options.headers['authorization'] = [this.authType, this.client.options.token].filter((v)=>v).join(' ');
			}

			return new RestRequest(this, request);
		}).then((request) => {
			return new Promise((resolve, reject) => {
				if (request.bucket) {
					const delayed = {request, resolve, reject};
					if (this.global.locked) {
						this.global.add(delayed);
					} else {
						request.bucket.add(delayed);
						this.buckets.stopExpire(request.bucket);
					}
				} else {
					request.send().then(resolve).catch(reject);
				}
			});
		});
	}
}

module.exports = Rest;