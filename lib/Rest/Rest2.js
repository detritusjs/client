'use strict';

const os = require('os');
const UrlUtils = require('url');
const QueryString = require('querystring');

const RestHandler = require('../Handlers').RestHandler;
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

class Route
{
    constructor(method, path, params={})
    {
        this.method = method.toLowerCase();
        this.path = path;

        this.uri = this.path;
        for (let key in params) {
            this.uri = this.uri.replace(`:${key}:`, encodeURIComponent(params[key]));
        }

        this.channelId = params.channelId || null;
        this.guildId = params.guildId || null;
        this.webhookId = params.webhookId || null;
    }

    get bucket()
    {
        const bucket = [
            this.guildId,
            this.channelId,
            this.webhookId,
            this.path
        ];
        if (this.method === 'delete' && this.path === Constants.Endpoints.REST.MESSAGE) {
            bucket.unshift(this.method);
        }
        return bucket.join('.');
    }
}

class Rest
{
    constructor(client, options={})
    {
        this.client = client;
        this.options = {
            timeout: options.time || 20,
            maxRetries: options.maxRetries || 5,
            retryTime: options.retryTime || 2,
            bucketsExpireIn: options.bucketsExpireIn || 30
        };
        this.BASE = UrlUtils.parse(`${Constants.Endpoints.REST.URL}${Constants.Endpoints.REST.URI}`);

        this.buckets = new Map();
        this._global = {
            blocked: false,
            queue: [],
            expire: null
        };

        this.handler = new RestHandler(this, options);
    }

    _globalShift()
    {
        if (this._global.blocked || !this._global.queue.length) {
            return;
        }
        (this._global.queue.shift())(() => {
            this._globalShift();
        });
    }

    ping()
    {
        return new Promise((resolve, reject) => {
            const now = Utils.Tools.now();
            this.request({
                route: {
                    method: 'get',
                    path: Constants.Endpoints.REST.USERS.ID,
                    params: {
                        userId: '@me'
                    }
                }
            }).then((response) => {
                resolve(Math.round(Utils.Tools.now() - now));
            }).catch(reject);
        });
    }

    _request(options, route)
    {
        var bucket;
        if (route) {
            if (this.buckets.has(route.bucket)) {
                bucket = this.buckets.get(route.bucket);
            } else {
                bucket = new Bucket(route.bucket, this.buckets, this.options.bucketsExpireIn);
            }
        } else {
            if (options.headers['X-Super-Properties']) {
                delete options.headers['X-Super-Properties'];
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
                } else if (options.body) {
                    const body = new Utils.MultipartData();
                    options.headers['Content-Type'] = `multipart/form-data; boundary=${body.boundary}`;
                    for (let key in options.body) {
                        body.add(key, options.body[key]);
                    }
                    options.body = body.done();
                }
            } catch(e) {
                reject(e);
                return;
            }

            var retries = 0;
            const call = (done) => {
                if (!done) {done = ()=>{};}
                if (retries >= this.options.maxRetries) {
                    reject(new Error(`Reached max retries (${this.options.maxRetries}). [${options.method}-${UrlUtils.format(options)}]`));
                    done();
                    return;
                }

                var request = HTTPS.request({
                    method: options.method,
                    headers: options.headers,
                    protocol: options.urlOptions.protocol,
                    host: options.urlOptions.host,
                    path: options.urlOptions.pathname + options.urlOptions.search
                });
                var requestError;
                request.once('abort', () => {
                    requestError = requestError || new Error(`Request aborted by client. [${options.method}-${UrlUtils.format(options)}]`);
                    requestError.request = request;
                    reject(requestError);
                    done();
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
                    var rStream = response,
                        data = '';
                    
                    if (response.headers['content-encoding']) {
                        response.headers['content-encoding'].split(', ').forEach((format) => {
                            switch(format) 
                            {
                                case 'gzip': rStream = rStream.pipe(Zlib.createGunzip()); break;
                                case 'deflate': rStream = rStream.pipe(Zlib.createInflate()); break;
                            }
                        });
                    }

                    rStream.on('data', (d) => {
                        data += d;
                    }).once('end', () => {
                        if (bucket) {
                            bucket.limit = parseInt(response.headers['x-ratelimit-limit'] || -1);
                            bucket.remaining = parseInt(response.headers['x-ratelimit-remaining'] || -1);
                            bucket.reset = parseInt(response.headers['x-ratelimit-reset'] || 0) * 1000;
                            if (bucket.remaining === 0 && response.statusCode !== 429) {
                                const now = Date.parse(response.headers['date']);
                                let diff = Math.max(0, bucket.reset - now);
                                if (bucket.route === Constants.Endpoints.REST.CHANNELS.MESSAGE_REACTION_USER && diff === 1000) {
                                    diff = 250;
                                    bucket.reset = now + diff;
                                }
                                console.log('remaining 0', route, now, diff);
                                if (diff) {
                                    bucket.lock(diff);
                                }
                            }
                        }
                        
                        if (response.statusCode === 429) {
                            console.log('ratelimited', route, bucket._queue.length);
                            if (!bucket) {
                                let error = new Error(new Error('This library doesn\'t deal with third party site\'s ratelimiting.'));
                                error.response = response;
                                reject(error);
                                done();
                                return;
                            }
                            ++retries;
                            const retryAfter = parseInt(response.headers['retry-after']);
                            if (response.headers['x-ratelimit-global'] === 'true') {
                                this._global.blocked = true;
                                this._global.queue.push(call);
                                this._global.expire = setTimeout(() => {
                                    this._global.blocked = false;
                                    this._global.expire = null;
                                    this._globalShift();
                                }, retryAfter);
                            } else {
                                bucket.lock(retryAfter);
                                bucket.queue(call, true);
                            }
                            return;
                        }

                        if (response.headers['content-type'].includes('application/json')) {
                            try {
                                data = JSON.parse(data);
                            } catch(e) {
                                reject(e);
                                done();
                                return;
                            }
                        }

                        if (200 <= response.statusCode && response.statusCode < 300) {
                            resolve(data);
                        } else if (response.statusCode === 502) {
                            setTimeout(() => {
                                call(done);
                            }, retries * this.options.retryTime * 1000);
                            return;
                        } else {
                            const e = new Error(`HTTP Exception: ${response.statusCode}`);
                            e.data = data;
                            reject(e);
                        }
                        done();
                    });
                }).setTimeout(this.options.timeout * 1000, () => {
                    requestError = new Error(`Request lasted for more than ${this.options.timeout}s. [${options.method}-${UrlUtils.format(options)}]`);
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

            if (bucket) {
                if (this._global.blocked) {
                    this._global.queue.push(call);
                } else {
                    bucket.queue(call);
                }
            } else {
                call();
            }
        });
    }

    request(options={})
    {
        options = Object.assign({}, options);

        if (options.route || options.uri) {
            if (typeof(options.route) !== 'object') {options.route = {};}
            if (!(options.route instanceof Route)) {
                options.route = new Route(
                    options.route.method || options.method,
                    options.route.path || options.uri,
                    options.route.params || {}
                );
            }
            options.method = options.route.method;
        }

        if (!options.method) {
            throw new Error('Method is required in a request!');
        }

        if (!options.url && !options.route) {
            throw new Error('URL or URI has to be specificed in a request!');
        }

        options.urlOptions = new UrlUtils.URL((options.route) ? `${this.BASE.href}${options.route.uri}` : options.url);
        options.urlOptions.search = QueryString.stringify(options.query || {});

        options.headers = Object.assign({}, options.headers, {
            'User-Agent': defaultHeaders['User-Agent'],
            'Accept-Encoding': defaultHeaders['Accept-Encoding']
        });

        if (options.urlOptions.href === this.BASE.href) {
            Object.assign(options.headers, {
                'X-Super-Properties': defaultHeaders['X-Super-Properties']
            });
        }

        if (options.useAuth || options.urlOptions.host === this.BASE.host) {
            options.headers.Authorization = this.client.options.token;
            if (this.client.isBot) {
                options.headers.Authorization = `Bot ${options.headers.Authorization}`;
            }
        }

        return new Promise((resolve, reject) => {
            const request = new Request(this, {
                method: options.method.toLowerCase(),
                headers: options.headers,
                body: options.body || null,
                json: options.json || false,
                files: options.files || [],
                reason: null
            }, options.route);
            request.send(options.urlOptions).then(resolve).catch(reject);
        });

        return this._request({
            method: options.method.toLowerCase(),
            headers: options.headers,
            body: options.body || null,
            json: options.json || false,
            files: options.files || [],
            reason: null,
            urlOptions: options.urlOptions
        }, options.route);
    }
}

Rest.Route = Route;
module.exports = Rest;