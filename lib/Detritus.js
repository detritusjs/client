'use strict';

const Collections = require('./Collections');
const Gateway = require('./Socket').Gateway;
const Rest = require('./Rest');
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

        Object.defineProperty(this, 'options', {writable: false, value: this.resolveOptions(options)});
        Object.defineProperties(this, {
            channels: {enumerable: false, writable: false, value: new Collections.Channels(this, this.options.cache.channels)},
            emojis: {enumerable: false, writable: false, value: new Collections.Emojis(this, this.options.cache.emojis)},
            guilds:   {enumerable: false, writable: false, value: new Collections.Guilds(this, this.options.cache.guilds)},
            members:  {enumerable: false, writable: false, value: new Collections.Members(this, this.options.cache.members)},
            messages: {enumerable: false, writable: false, value: new Collections.Messages(this, this.options.cache.messages)},
            presences: {enumerable: false, writable: false, value: new Collections.Presences(this, this.options.cache.presences)},
            users:    {enumerable: false, writable: false, value: new Collections.Users(this, this.options.cache.users)},
            rest:     {enumerable: false, writable: false, value: new Rest(this, this.options.rest)},
            gateway:  {enumerable: false, writable: false, value: new Gateway(this, this.options.gateway)}
        });

        this.isBot = this.options.bot;
    }

    resolveOptions(_options={})
    {
        const options = Object.assign({}, defaultOptions, _options);
        if (!options.token) {
            throw new Error('Token is required for this library to work.');
        }
        options.gateway = Object.assign({}, options.gateway);
        options.cache = Object.assign({}, options.cache);
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

    sendMessage(channel, data={})
    {
        return new Promise((resolve, reject) => {
            const channelId = (typeof(channel) === 'object') ? channel.id : channel;
            if (!channelId) {
                throw new Error('Channel ID is missing!');
            } else if (typeof(channel) === 'number') {
                throw new Error('Channel ID has to be a string!');
            }
            if (typeof(data) === 'string') {
                data = {
                    content: data
                };
            }
            if (!data.content && !data.embed && !data.file && !data.files) {
                throw new Error('Cannot send an empty message.');
            }
            const files = [];
            if (data.file) {
                files.push(data.file);
                delete data.file;
            }
            if (data.files && data.files.length) {
                files = files.concat(data.files);
                delete data.files;
            }
            if (data.tts !== undefined) {
                data.tts = !!data.tts;
            }
            data.nonce = data.nonce || Utils.Snowflake.generate(); //idk y im noncing lol
            this.rest.request({
                method: 'post',
                uri: Utils.Constants.Endpoints.REST.CHANNELS.MESSAGES(channelId),
                useAuth: true,
                json: true,
                body: data,
                files: files
            }).then((data) => {
                const message = new Structures.Message(this, data);
                this.messages.update(message);
                this.emit('MESSAGE_CREATE', {message});
                resolve(message);
            }).catch(reject);
        });
    }
}

Detritus.Shard = Sharding.Shard;
Detritus.ShardManager = Sharding.ShardManager;
Detritus.Utils = Utils;
module.exports = Detritus;