'use strict';

const Collections = require('./Collections');
const Gateway = require('./Socket').Gateway;
const Rest = require('./Rest');
const ShardManager = require('./Sharding').ShardManager;
const Structures = require('./Structures');
const Utils = require('./Utils');

const EventEmitter = require('events').EventEmitter;

const defaultOptions = {
    autoShard: true,
    bot: true,
    imageFormat: 'jpg',
    loadAllMembers: true
};

class Detritus extends EventEmitter
{
    constructor(options={})
    {
        super();

        options = this.resolveOptions(options);
        this.guilds = new Collections.Guilds(this, options.cache.guilds);
        this.channels = new Collections.Channels(this, options.cache.channels);
        this.members = new Collections.Members(this, options.cache.members);
        this.messages = new Collections.Messages(this, options.cache.messages);
        this.users = new Collections.Users(this, options.cache.users);

        Object.defineProperties(this, {
            options: {writable: false, value: options}
        });

        this.isBot = this.options.bot;
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
                console.log(message);
                this.messages.add(message);
                this.emit('MESSAGE_CREATE', message);
                resolve(message);
            }).catch(reject);
        });
    }
}

Detritus.ShardManager = ShardManager;
Detritus.Utils = Utils;
module.exports = Detritus;