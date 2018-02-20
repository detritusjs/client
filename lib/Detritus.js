'use strict';

const Collections = require('./Collections');
const Gateway = require('./Socket').Gateway;
const Rest = require('./Rest');
const RestHandler = require('./Handlers').RestHandler;
const Sharding = require('./Sharding');
const Structures = require('./Structures');
const Utils = require('./Utils');

const defaultOptions = {
    bot: true,
    imageFormat: 'jpg'
};

class Detritus extends Utils.EventEmitter
{
    constructor(options={})
    {
        super();

        Object.defineProperty(this, 'options', {enumerable: false, writable: false, value: this.resolveOptions(options)});
        Object.defineProperties(this, {
            channels:    {enumerable: false, writable: false, value: new Collections.Channels(this, this.options.cache.channels)},
            emojis:      {enumerable: false, writable: false, value: new Collections.Emojis(this, this.options.cache.emojis)},
            guilds:      {enumerable: false, writable: false, value: new Collections.Guilds(this, this.options.cache.guilds)},
            members:     {enumerable: false, writable: false, value: new Collections.Members(this, this.options.cache.members)},
            messages:    {enumerable: false, writable: false, value: new Collections.Messages(this, this.options.cache.messages)},
            presences:   {enumerable: false, writable: false, value: new Collections.Presences(this, this.options.cache.presences)},
            users:       {enumerable: false, writable: false, value: new Collections.Users(this, this.options.cache.users)},
            voiceStates: {enumerable: false, writable: false, value: new Collections.VoiceStates(this, this.options.cache.voiceStates)},
            gateway:     {enumerable: false, writable: false, value: new Gateway(this, this.options.gateway)},
            rest:        {enumerable: false, writable: false, value: new Rest(this, this.options.rest)}
        });
        Object.defineProperty(this, 'restHandler', {enumerable: false, writable: false, value: new RestHandler(this, this.options.restHandler)});

        this.isBot = this.options.bot;
    }

    resolveOptions(_options={})
    {
        const options = Object.assign({}, defaultOptions, _options);
        if (!options.token) {
            throw new Error('Token is required for this library to work.');
        }
        options.cache = Object.assign({}, options.cache);
        options.gateway = Object.assign({}, options.gateway);
        options.rest = Object.assign({}, options.rest);
        options.restHandler = Object.assign({}, options.restHandler);
        return options;
    }

    run(options={})
    {
        return new Promise((resolve, reject) => {
            const getGateway = (!options.url) ? this.rest.request({
                method: 'get',
                uri: Utils.Constants.Endpoints.REST.GATEWAY
            }) : Promise.resolve({url: options.url});
            getGateway.then((data) => {
                if (!data.url) {
                    throw new Error('Gateway URL was not retrieved.');
                }
                this.gateway.connect(data.url);
                if (options.waitUntilReady) {
                    this.once('GATEWAY_READY', (event) => {
                        resolve();
                    });
                } else {
                    resolve();
                }
            }).catch(console.error);
        });
    }

    editMessage(channel, data={})
    {
        return this.restHandler.editMessage(channel, data);
    }

    sendMessage(channel, data={})
    {
        return this.restHandler.sendMessage(channel, data);
    }
}

Detritus.Shard = Sharding.Shard;
Detritus.ShardManager = Sharding.ShardManager;
Detritus.Utils = Utils;
module.exports = Detritus;