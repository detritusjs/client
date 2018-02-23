const BaseCollection = require('../Collections/BaseCollection.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    guild_id: null,
    last_message_id: null,
    last_pin_timestamp: null,
    name: '...',
    nsfw: false,
    parent_id: null,
    permission_overwrites: [],
    position: -1,
    topic: ''
};

class ChannelText extends Structures.Channel
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            last_pin_timestamp: new Date(raw.last_pin_timestamp),
            permission_overwrites: new BaseCollection(),
            raw: {
                permission_overwrites: raw.permission_overwrites
            }
        };
        super(client, raw, Object.keys(cache));

        for (let key in cache) {
            if (key === 'raw') {continue;}
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: cache[key]
            });
        }

        this.merge(cache.raw);
    }

    get guild()
    {
        return this.client.guilds.get(this.guildId);
    }

    get messages()
    {

    }

    get parent()
    {
        return (this.parentId) ? this.client.channels.get(this.parentId) : null;
    }

    bulkDelete(data)
    {

    }

    createInvite(data)
    {

    }

    createMessage(data)
    {
        
    }

    fetchInvites()
    {
        return new Promise((resolve, reject) => {
            this.client.restHandler.fetchInvites(this.id).then(resolve).catch(reject);
            this.client.rest.request({
                route: {
                    method: 'get',
                    path: Constants.Endpoints.REST.CHANNELS.INVITES,
                    params: {
                        channelId: this.id
                    }
                }
            }).then((data) => {
                const invites = new BaseCollection();
                data.forEach((invite) => {
                    invites.set(invite.code, invite);
                });
                resolve(invites);
            }).catch(reject);
        });
    }

    fetchMessage(data)
    {

    }

    fetchMessages(data)
    {

    }

    fetchPins()
    {
        return new Promise((resolve, reject) => {
            this.client.rest.request({
                route: {
                    method: 'get',
                    path: Constants.Endpoints.REST.CHANNELS.PINS,
                    params: {
                        channelId: this.id
                    }
                }
            }).then((data) => {
                const messages = new BaseCollection();
                data.forEach((raw) => {
                    let message = this.client.messages.get(raw.id);
                    if (message) {
                        message.merge(raw);
                    } else {
                        message = new Structures.Message(this.client, message);
                    }
                    messages.set(message.id, message);
                });
                resolve(messages);
            }).catch(reject);
        });
    }
    
    triggerTyping()
    {
        return this.client.rest.request({
            route: {
                method: 'post',
                path: Constants.Endpoints.REST.CHANNELS.TYPING,
                params: {
                    channelId: this.id
                }
            }
        });
    }

    merge(raw={})
    {
        if (raw.hasOwnProperty('last_pin_timestamp')) {
            raw.last_pin_timestamp = new Date(raw.last_pin_timestamp);
        }
        if (raw.hasOwnProperty('permission_overwrites')) {
            this.permissionOverwrites.clear();
            raw.permission_overwrites.forEach((data) => {
                this.permissionOverwrites.set(data.id, new Structures.Overwrite(this.client, Object.assign(data, {
                    channel_id: this.id,
                    guild_id: this.guildId
                })));
            });
            raw.permission_overwrites = undefined;
        }

        Object.keys(raw).forEach((key) => {
            if (raw[key] === undefined) {return;}
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: raw[key]
            });
        });
    }
}

module.exports = ChannelText;