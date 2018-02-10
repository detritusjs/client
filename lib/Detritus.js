'use strict';

const Collections = require('./Collections');
const Gateway = require('./Socket').Gateway;
const Rest = require('./Rest');
const ShardManager = require('./Sharding').ShardManager;
const Utils = require('./Utils');

const EventEmitter = require('events').EventEmitter;

const defaultOptions = {
    autoShard: true,
    bot: true,
    loadAllMembers: true
};

class Detritus extends EventEmitter
{
    constructor(options={})
    {
        super();

        this.options = this.resolveOptions(options);

        this.guilds = new Collections.Guilds(this, this.options.cache.guilds);
        this.channels = new Collections.Channels(this, this.options.cache.channels);
        this.members = new Collections.Members(this, this.options.cache.members);
        this.messages = new Collections.Messages(this, this.options.cache.messages);
        this.users = new Collections.Users(this, this.options.cache.users);

        Object.defineProperties(this, {
            options: {writable: false, value: options}
        });

        this.isBot = (this.options.bot === undefined) ? true : this.options.bot;
        this.rest = new Rest(this, this.options);
        this.gateway = new Gateway(this, this.options.gateway);
    }

    resolveOptions(_options={})
    {
        const options = Object.assign({}, defaultOptions, _options);
        if (!options.token) {
            throw new Error('Token is required for this library to work.');
        }
        options.gateway = Object.assign({}, options.gateway);
        options.cache = Object.assign({}, options.cache);
        options.cache.channels = Object.assign({}, options.cache.channels);
        options.cache.guilds = Object.assign({}, options.cache.guilds);
        options.cache.members = Object.assign({}, options.cache.members);
        options.cache.messages = Object.assign({}, options.cache.messages);
        options.cache.users = Object.assign({}, options.cache.users);
        return options;
    }

    run(url, waitUntilReady=false)
    {
        return new Promise((resolve, reject) => {
            const getGateway = (!url) ? this.rest.request({
                method: 'get',
                uri: Utils.Constants.Endpoints.REST.GATEWAY
            }) : Promise.resolve({url});
            getGateway.then((data) => {
                if (!data.url) {
                    throw new Error('Gateway URL was not retrieved.');
                }
                this.gateway.connect(data.url);
                if (waitUntilReady) {
                    this.once('READY', (event) => {
                        resolve();
                    });
                } else {
                    resolve();
                }
            }).catch(console.error);
        });
    }
}

Detritus.ShardManager = ShardManager;
Detritus.Utils = Utils;
module.exports = Detritus;