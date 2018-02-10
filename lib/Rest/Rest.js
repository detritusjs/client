'use strict';

const HTTPS = require('https');
const os = require('os');
const UrlUtils = require('url');
const Zlib = require('zlib');

const Utils = require('../Utils');
const Constants = Utils.Constants;
const Bucket = Utils.Bucket;


const defaultHeaders = {
    'User-Agent': [
            'DiscordBot',
            `(https://github.com/cakedan/detritus, v${Constants.VERSION})`,
            `(${os.type()} ${os.release()}; ${os.arch()})`,
            process.version.replace(/^v/, (process.release.name || 'node') + '/')
        ].join(' '),
    'X-Super-Properties': Buffer.from(JSON.stringify({
            os: os.type(),
            os_version: `${os.release()} ${os.arch()}`,
            browser: process.version.replace(/^v/, (process.release.name || 'node') + '/'),
            device: 'Detritus',
            client_version: Constants.VERSION
        })).toString('base64'),
    'Accept-Encoding': 'gzip, deflate'
};

class Rest
{
    constructor(client, options={})
    {
        this.client = client;
        this.timeout = options.timeout || 20000;
        this.maxRetries = options.maxRetries || 5;
        this.BASE = UrlUtils.parse(`${Constants.Endpoints.REST.URL}${Constants.Endpoints.REST.URI}`);

        this.buckets = new Map();
        this._global = {
            BLOCKED: false,
            queue: [],
            expire: null
        };
    }

    _globalQueue()
    {
        while (!this._global.BLOCKED && this._global.queue.length) {
            (this._global.queue.shift())();
        }
    }

    ping()
    {
        return new Promise((resolve, reject) => {
            const now = Utils.Tools.now();
            this.request({
                method: 'get',
                uri: Constants.Endpoints.REST.USERS.ID('@me'),
                useAuth: true
            }).then((response) => {
                resolve(Math.round(Utils.Tools.now() - now));
            }).catch(reject);
        });
    }

    _route(method, path)
    {
        return `${method}.${path}`;
    }

    _request(options, route)
    {
        if (options.host === this.BASE.host) {
            route = route || this._route(options.method, options.path);
        } else {
            delete options.headers['X-Super-Properties'];
        }

        var bucket;
        if (route) {
            if (this.buckets.has(route)) {
                bucket = this.buckets.get(route);
            } else {
                bucket = new Bucket();
                this.buckets.set(route, bucket);
            }
        }

        if (options.reason) {
            options.headers['X-Audit-Log-Reason'] = encodeURIComponent(options.reason);
            delete options.reason;
        }

        return new Promise((resolve, reject) => {
            try {
                if (options.files && options.files.length) {
                    const body = new Utils.MultipartData();
                    options.headers['Content-Type'] = `multipart/form-data; boundary=${body.boundary}`;
                    options.files.forEach((file, key) => {
                        if (!file.file) {
                            return;
                        }
                        body.add(`file${key}`, file.file, file.name)
                    });
                    options.files = [];
                    if (options.json && options.body) {
                        body.add('payload_json', options.body);
                    }
                    options.body = body.done();
                } else if (options.json && options.body) {
                    options.headers['Content-Type'] = 'application/json';
                    options.body = JSON.stringify(options.body);
                    options.json = false;
                }
            } catch(e) {
                reject(e);
                return;
            }

            var retries = 0;
            const call = (done) => {
                if (retries >= this.maxRetries) {
                    reject(new Error(`Reached max retries (${this.maxRetries}). [${options.method}-${UrlUtils.format(options)}]`));
                    if (done) {
                        done();
                    }
                    return;
                }

                var request = HTTPS.request(options),
                    requestError;
                request.once('abort', () => {
                    requestError = requestError || new Error(`Request aborted by client. [${options.method}-${UrlUtils.format(options)}]`);
                    requestError.request = request;
                    reject(requestError);
                    if (done) {
                        done();
                    }
                }).once('error', (e) => {
                    requestError = e;
                    request.abort();
                });

                request.once('response', (response) => {
                    response.once('aborted', () => {
                        requestError = new Error(`Request abort by server. [${options.method}-${UrlUtils.format(options)}]`);
                        request.abort();
                    }).once('close', () => {
                        requestError = new Error(`Request was closed by server. [${options.method}-${UrlUtils.format(options)}]`);
                        request.abort();
                    });
                    var responseStream = response,
                        data = '';
                    
                    if (response.headers['content-encoding']) {
                        if (response.headers['content-encoding'].includes('gzip')) {
                            responseStream = response.pipe(Zlib.createGunzip());
                        } else if (response.headers['content-encoding'].includes('deflate')) {
                            responseStream = response.pipe(Zlib.createInflate());
                        }
                    }

                    responseStream.on('data', (d) => {
                        data += d;
                    }).once('end', () => {
                        if (bucket) {
                            bucket.limit = parseInt(response.headers['x-ratelimit-limit'] || -1);
                            bucket.remaining = parseInt(response.headers['x-ratelimit-remaining'] || -1);
                            bucket.reset = parseInt(response.headers['x-ratelimit-reset'] * 1000 || -1);
                            if (bucket.remaining === 0 && response.statusCode !== 429) {
                                const now = Date.parse(response.headers['date']);
                                const diff = bucket.reset - now;
                                bucket.lock(diff);
                                //deal with our empty bucket, maybe lock it
                            }
                        }
                        
                        if (response.statusCode === 429) {
                            console.log(route);
                            if (!bucket) {
                                reject(new Error('This library doesn\'t deal with third party site\'s ratelimiting.'));
                                if (done) {
                                    done();
                                }
                                return;
                            }
                            ++retries;
                            const retryAfter = parseInt(response.headers['retry-after']);
                            if (response.headers['x-ratelimit-global'] === 'true') {
                                this._global.BLOCKED = true;
                                this._global.queue.push(call);
                                this._global.expire = setTimeout(() => {
                                    this._global.BLOCKED = false;
                                    this._global.expire = null;
                                    this._globalQueue();
                                }, retryAfter);
                            } else {
                                bucket.lock(retryAfter);
                                bucket.queue(call, true);
                            }
                            return;
                        }

                        if (response.headers['content-type'] === 'application/json') {
                            try {
                                data = JSON.parse(data);
                            } catch(e) {
                                reject(e);
                                if (done) {
                                    done();
                                }
                                return;
                            }
                        }

                        if (200 <= response.statusCode && response.statusCode < 300) {
                            resolve(data);
                        } else if (response.statusCode === 502) {
                            setTimeout(() => {
                                call(done);
                            }, retries * 2000);
                            return;
                        } else {
                            const e = new Error(`HTTP Exception: ${response.statusCode}`);
                            e.data = data;
                            reject(e);
                        }
                        if (done) {
                            done();
                        }
                    });
                }).setTimeout(this.timeout, () => {
                    requestError = new Error(`Request lasted for more than ${this.timeout}ms. [${options.method}-${UrlUtils.format(options)}]`);
                    request.abort();
                });

                if (Array.isArray(options.body)) {
                    options.body.forEach((chunk) => {
                        request.write(chunk);
                    });
                    request.end();
                } else {
                    request.end(options.body);
                }
            };

            if (this._global.BLOCKED) {
                this._global.queue.push(call);
            } else {
                if (bucket) {
                    bucket.queue(call);
                } else {
                    call();
                }
            }
        });
    }

    request(options={})
    {
        options = Object.assign({}, options);

        if (!options.method) {
            throw new Error('Method is required in a request!');
        }

        if (!options.url && !options.uri) {
            throw new Error('URL or URI has to be specificed in a request!');
        }
        
        options.headers = Object.assign({}, options.headers, defaultHeaders);
        if (options.useAuth) {
            options.headers.Authorization = this.client.options.token;
            if (this.client.isBot) {
                options.headers.Authorization = `Bot ${options.headers.Authorization}`;
            }
        }

        options.urlOptions = UrlUtils.parse(options.url || `${this.BASE.href}${options.uri}`);
        options.urlOptions.query = options.query || {};

        return this._request(Object.assign({
            method: options.method.toLowerCase(),
            headers: options.headers,
            body: options.body || null,
            json: options.json || false,
            files: options.files || [],
            reason: null
        }, options.urlOptions));
    }
}

module.exports = Rest;