'use strict';

const os = require('os');
const UrlUtils = require('url');
const QueryString = require('querystring');

const Request = require('./Request.js');
const RestEndpoints = require('./RestEndpoints.js');

const Buckets = require('../Collections').Buckets;
const Utils = require('../Utils');
const Constants = Utils.Constants;


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
            timeout: options.timeout || 20,
            maxRetries: options.maxRetries || 5,
            retryTime: options.retryTime || 2
        };
        this.BASE = UrlUtils.parse(`${Constants.Endpoints.REST.URL}${Constants.Endpoints.REST.URI}`);

        this.buckets = new Buckets({expire: 30});
        this.global = new Utils.Buckets.HttpBucket();

        this.endpoints = new RestEndpoints(this);
    }

    get authType()
    {
        if (this.client.isBot) {
            return 'Bot';
        }
        //support oauth in future
    }

    ping()
    {
        return new Promise((resolve, reject) => {
            this.request({
                route: {
                    method: 'get',
                    path: Constants.Endpoints.REST.USERS.ID,
                    params: {
                        userId: '@me'
                    }
                }
            }).then(({response, data}) => {
                resolve(response.latency);
            }).catch(reject);
        });
    }

    request(options={})
    {
        return new Promise((resolve, reject) => {
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
                reject(new Error('Method is required in a request!'));
                return;
            }

            if (!options.url && !options.route) {
                reject(new Error('URL or URI has to be specificed in a request!'));
                return;
            }

            options.url = new UrlUtils.URL((options.route) ? `${this.BASE.href}${options.route.uri}` : options.url);
            options.url.search = QueryString.stringify(options.query || {});

            options.headers = Object.assign({}, options.headers, {
                'User-Agent': defaultHeaders['User-Agent'],
                'Accept-Encoding': defaultHeaders['Accept-Encoding']
            });

            if (options.useAuth || options.url.host === this.BASE.host) {
                if (options.url.host === this.BASE.host) {
                    Object.assign(options.headers, {
                        'X-Super-Properties': defaultHeaders['X-Super-Properties']
                    });
				}
				if (options.useAuth === undefined || options.useAuth) {
					Object.assign(options.headers, {
						'Authorization': [this.authType, this.client.options.token].filter((v)=>v).join(' ')
					});
				}
            }

            const request = new Request(this, {
                method: options.method.toLowerCase(),
                headers: options.headers,
                body: options.body || null,
                jsonify: options.jsonify || false,
                files: options.files || [],
                reason: options.reason || null,
                url: options.url
            }, options.route);
            request.send().then(resolve).catch(reject);
        });
    }
}

Rest.Route = Route;
module.exports = Rest;