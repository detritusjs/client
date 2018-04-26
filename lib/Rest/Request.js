const Utils = require('../Utils');
const RestEndpoints = Utils.Constants.Endpoints.REST;

class Request
{
	constructor(client, request)
	{
		this.client = client;
		this.request = request;

		this.bucket = null;

		if (request.url.host === this.client.restClient.baseUrl.host && request.route) {
			//use the bucket
			let bucket = [
				request.route.params.guildId,
				request.route.params.channelId,
				request.route.params.webhookId,
				request.route.path
			];
			if (request.route.method === 'DELETE' && request.route.path === RestEndpoints.CHANNELS.MESSAGE) {
				bucket.unshift(request.route.method);
			}
			bucket = bucket.join('.');

			if (this.client.buckets.has(bucket)) {
				bucket = this.client.buckets.get(bucket).bucket;
			} else {
				bucket = new Utils.Buckets.HttpBucket(bucket);
				this.client.buckets.add(bucket);
			}

			this.bucket = bucket;
		}

		this.retries = 0;
	}

	bucketExpire()
	{
		if (!this.bucket) {return;}
		if (this.bucket.size) {
			this.client.buckets.stopExpire(this.bucket);
		} else {
			this.client.buckets.expire(this.bucket);
		}
	}

	send()
	{
		return new Promise((resolve, reject) => {
			if (this.client.global.locked) {
				return this.client.global.add({request: this, resolve, reject});
			} else if (this.bucket) {
				if (this.bucket.locked) {
					return this.bucket.add({request: this, resolve, reject});
				}
				if (this.bucket.ratelimit.remaining === 1) {
					const ratelimit = this.bucket.ratelimit;
					let diff = Math.max(0, ratelimit.reset - ratelimit.last);
					if (this.bucket.route === RestEndpoints.CHANNELS.MESSAGE_REACTION_USER && diff === 1000) {
						diff = 250;
						ratelimit.reset = ratelimit.last + diff;
					}
					if (diff) {this.bucket.lock(diff);}
				}
			}
			resolve();
		}).then(this.request.send.bind(this.request)).then((response) => {
			return new Promise((resolve, reject) => {
				if (this.bucket) {
					this.bucket.ratelimit.limit = parseInt(response.headers['x-ratelimit-limit'] || -1);
					this.bucket.ratelimit.remaining = parseInt(response.headers['x-ratelimit-remaining'] || -1);
					this.bucket.ratelimit.reset = parseInt(response.headers['x-ratelimit-reset'] || 0) * 1000;
					this.bucket.ratelimit.last = Date.parse(response.headers.date);
					const ratelimit = this.bucket.ratelimit;
	
					if (ratelimit.remaining === 0 && response.statusCode !== 429) {
						let diff = Math.max(0, ratelimit.reset - ratelimit.last);
						if (this.bucket.route === RestEndpoints.CHANNELS.MESSAGE_REACTION_USER && diff === 1000) {
							diff = 250;
							ratelimit.reset = ratelimit.last + diff;
						}
						if (diff) {this.bucket.lock(diff);}
					}
				}

				if (response.statusCode === 429 && this.bucket) {
					const retryAfter = parseInt(response.headers['retry-after']);
					const delayed = {request: this, resolve, reject};
					if (response.headers['x-ratelimit-global'] === 'true') {
						this.client.global.lock(retryAfter);
						this.client.global.add(delayed);
					} else {
						this.bucket.lock(retryAfter);
						this.bucket.add(delayed, true);
					}
					return response.close();
				}

				if (response.statusCode === 502 && this.retries++ >= 5) {
					//implement retrying on 502s
					return setTimeout(() => {
						this.request.send().then(resolve).catch(reject);
					}, 2000);
				}

				response.body().then(() => {
					resolve(response);
				}).catch(reject);
			});
		}).then((response) => {
			if (!response.ok) {
				const error = new Error(`HTTP Exception: ${response.statusCode}`);
				error.response = response;
				return Promise.reject(error);
			}
			this.bucketExpire();
			return response;
		}).catch((e) => {
			console.log(e);
			this.bucketExpire();
			return Promise.reject(e);
		})
	}
}

module.exports = Request;