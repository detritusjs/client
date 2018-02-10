const HTTPS = require('https');
const os = require('os');
const UrlUtils = require('url');

const Utils = require('../Utils');
const Constants = Utils.Constants;
const Bucket = Utils.Bucket;

class Rest
{
    constructor(client, options={})
    {
        this.client = client;
        this.headers = {
            'User-Agent': [
                'DiscordBot',
                `(https://github.com/cakedan/detritus, v${Constants.VERSION})`,
                `(${os.type()} ${os.release()}; ${os.arch()})`,
                process.version.replace(/^v/, (process.release.name || 'node') + '/')
            ].join(' '),
            //'Accept-Encoding': 'gzip, deflate'
        };
        this.timeout = options.timeout || 20000;
        this.maxRetries = options.maxRetries || 5;
        this.BASE = UrlUtils.parse(`${Constants.Endpoints.REST.URL}${Constants.Endpoints.REST.URI}`);

        this.buckets = new Map();
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

        return new Promise((resolve, reject) => {
            var retries = 0;
            const call = () => {
                var body = {};
                try {
                    if (true || (options.files && options.files.length)) {
                        body = new Utils.MultipartData();
                        options.headers['Content-Type'] = `multipart/form-data; boundary=${body.boundary}`;
                        options.files.forEach((file, key) => {
                            if (!file.file) {
                                return;
                            }
                            body.add(`file${key}`, file.file, file.name)
                        });
                        if (options.json && options.body) {
                            body.add('payload_json', options.body);
                        }
                        body = body.done();
                    } else if (options.json && options.body) {
                        options.headers['Content-Type'] = 'application/json';
                        body = JSON.stringify(options.body);
                    }
                } catch(e) {
                    reject(e);
                    return;
                }

                var request = HTTPS.request(options),
                    requestError;
                request.once('abort', () => {
                    requestError = requestError || new Error(`Request aborted by client. [${options.method}-${UrlUtils.format(options)}]`);
                    requestError.request = request;
                    reject(requestError);
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

                    responseStream.on('data', (d) => {
                        data += d;
                    }).once('end', () => {
                        if (bucket) {
                            const remaining = parseInt(response.headers['x-ratelimit-limit'] || -1);
                            if (remaining === 0 && response.statusCode !== 429) {
                                //deal with our empty bucket, maybe lock it
                            }
                        }
                        
                        if (response.statusCode === 429) {
                            //deal with ratelimit headers
                        }

                        if (response.headers['content-type'] === 'application/json') {
                            try {
                                data = JSON.parse(data);
                            } catch(e) {
                                reject(e);
                                return;
                            }
                        }

                        if (200 <= response.statusCode && response.statusCode < 300) {
                            resolve(data);
                            return;
                        } else if (response.statusCode === 502) {
                            if (++retries > this.maxRetries) {
                                reject(new Error(`Reached max retries (${this.maxRetries}). [${options.method}-${UrlUtils.format(options)}]`));
                                return;
                            } else {
                                setTimeout(() => {
                                    call();
                                }, retries * 2000);
                            }
                        } else {
                            const e = new Error(`HTTP Exception: ${response.statusCode}`);
                            e.data = data;
                            reject(e);
                        }
                    });
                }).setTimeout(this.timeout, () => {
                    requestError = new Error(`Request lasted for more than ${this.timeout}ms. [${options.method}-${UrlUtils.format(options)}]`);
                    request.abort();
                });

                if (Array.isArray(body)) {
                    body.forEach((chunk) => {
                        request.write(chunk);
                    });
                    request.end();
                } else {
                    request.end(body);
                }
            };

            call();
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
        
        options.headers = Object.assign({}, options.headers, this.headers);
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
            files: options.files || []
        }, options.urlOptions));
    }
}

module.exports = Rest;