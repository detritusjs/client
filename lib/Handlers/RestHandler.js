const BaseCollection = require('../Collections/BaseCollection.js');

const Structures = require('../Structures');
const Utils = require('../Utils');
const Constants = Utils.Constants;
const Endpoints = Constants.Endpoints;

class RestHandler
{
    constructor(client, options)
    {
        this.client = client;
        this.rest = this.client.rest;
    }

    editMessage(channel, data={})
    {
        return new Promise((resolve, reject) => {
            const channelId = (typeof(channel) === 'object') ? channel.id : channel;
            if (!channelId) {
                reject(new Error('Channel ID is missing!'));
                return;
            } else if (typeof(channel) === 'number') {
                reject(new Error('Channel ID has to be a string!'));
                return;
            }

            const payload = {};
            if (typeof(data) === 'string') {
                payload.content = data;
                data = {};
            } else {
                payload.content = data.content;
            }
            if (data.embed !== undefined) {
                payload.embed = data.embed;
            }
            if (!payload.content && !payload.embed) {
                reject(new Error('Cannot send an empty message.'));
                return;
            }
            this.rest.request({
                route: {
                    method: 'patch',
                    path: Endpoints.REST.CHANNELS.MESSAGES,
                    params: {channelId}
                },
                useAuth: true,
                json: true,
                body: payload,
                files: files
            }).then((data) => {
                let message;
                if (this.client.messages.has(data.id)) {
                    message = this.client.messages.get(data.id);
                    message.merge(data);
                } else {
                    message = new Structures.Message(this.client, data);
                    this.client.messages.update(message);
                }
                resolve(message);
            }).catch(reject);
        });
    }

    sendMessage(channel, data)
    {
        return new Promise((resolve, reject) => {
            const channelId = (typeof(channel) === 'object') ? channel.id : channel;
            if (!channelId) {
                reject(new Error('Channel ID is missing!'));
                return;
            } else if (typeof(channel) === 'number') {
                reject(new Error('Channel ID has to be a string!'));
                return;
            }

            const payload = {};
            const files = [];
            if (typeof(data) === 'string') {
                payload.content = data;
                data = {};
            } else {
                payload.content = data.content;
            }
            if (data.embed !== undefined) {
                payload.embed = data.embed;
            }
            if (data.file) {
                files.push(data.file);
            }
            if (data.files && data.files.length) {
                data.files.forEach((file) => {
                    files.push(file);
                });
            }
            if (data.tts !== undefined) {
                payload.tts = !!data.tts;
            }
            if (!payload.content && !payload.embed && !files.length) {
                reject(new Error('Cannot send an empty message.'));
                return;
            }
            payload.nonce = data.nonce || Utils.Snowflake.generate(); //noncing ;)
            this.rest.request({
                route: {
                    method: 'post',
                    path: Endpoints.REST.CHANNELS.MESSAGES,
                    params: {channelId}
                },
                useAuth: true,
                json: true,
                body: payload,
                files: files
            }).then((data) => {
                const message = new Structures.Message(this.client, data);
                this.client.messages.update(message);
                resolve(message);
            }).catch(reject);
        });
    }
}

module.exports = RestHandler;