'use strict';

const Communications = {
    HTTP: require('http'),
    HTTPS: require('https'),
    TLS: require('tls')
};

const UrlUtils = require('url');
const Zlib = require('zlib');

const Utils = require('../Utils');

class Request
{
    constructor(rest, options, route)
    {
        this.rest = rest;

        Object.defineProperties(this, {
            maxRetries: {writable: false, value: this.rest.options.maxRetries || 5},
            retryDelay: {writable: false, value: (this.rest.options.retryDelay || 2) * 1000},
            timeout:    {writable: false, value: (this.rest.options.timeout || 20) * 1000}
        });

        this.method = (options.method || '').toLowerCase();
        this.headers = options.headers || {};

        if (route) {
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
        this.lib = ((this.url.protocol || '').startsWith('https')) ? Communications.HTTPS : Communications.HTTP;

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

    connect(options)
    {
        return new Promise((resolve, reject) => {
            const request = this.lib.request(options);

            let error;
            request.once('error', (e) => {
                error = e;
                request.abort();
            }).once('abort', () => {
                error = error || new Error(`Request aborted by the client. [${this.method}-${UrlUtils.format(this.url)}]`);
                error.request = request;
                reject(error);
            });
            
            request.once('response', resolve);
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
    }

    call()
    {
        return new Promise((resolve, reject) => {
            if (this.retries && ++this.retries >= this.maxRetries) {
                reject(new Error(`Reached max retries (${this.maxRetries}). [${this.method}-${UrlUtils.format(this.url)}]`));
                return;
            }

            this.connect({
                method: this.method,
                headers: this.headers,
                protocol: this.url.protocol,
                host: this.url.host,
                path: this.url.pathname + this.url.search
            }).then((response) => {
                response.once('aborted', () => {
                    let error = new Error(`Response was aborted by the server. [${this.method}-${UrlUtils.format(this.url)}]`);
                    error.response = response;
                    reject(error);
                }).once('close', () => {
                    let error = new Error(`Response was closed by the server. [${this.method}-${UrlUtils.format(this.url)}]`);
                    error.response = response;
                    reject(error);
                });

                let stream = response;
                let data = '';

                if (response.headers['content-encoding']) {
                    response.headers['content-encoding'].split(', ').forEach((format) => {
                        switch (format) {
                            case 'gzip': stream = stream.pipe(Zlib.createGunzip()); break;
                            case 'deflate': stream = stream.pipe(Zlib.createInflate()); break;
                        }
                    });
                }

                stream.on('data', (d) => {
                    data += d;
                }).once('end', () => {
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
                    }

                    response.data = data;
                    if (response.headers['content-type'].toLowerCase().includes('application/json')) {
                        try {
                            data = JSON.parse(data);
                            response.data = data;
                        } catch(error) {
                            error.response = response;
                            reject(error);
                            return;
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