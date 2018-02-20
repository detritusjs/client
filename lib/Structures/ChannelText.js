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
            permission_overwrites: new BaseCollection(),
            raw: {
                permission_overwrites: raw.permission_overwrites
            }
        };
        super(client, raw, Object.keys(cache));

        for (let key in cache) {
            if (key === 'raw') {continue;}
            const camelKey = Utils.Tools.toCamelCase(key);
            Object.defineProperty(this, camelKey, {
                enumerable: false,
                writable: false,
                value: cache[key]
            });
            delete cache[key];
        }

        this.merge(cache.raw);
        cache = null;
    }

    get guild()
    {
        return this._client.guilds.get(this.guildId);
    }

    get messages()
    {

    }

    get parent()
    {
        return this._client.channels.get(this.parentId);
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
            this._client.rest.request({
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
            this._client.rest.request({
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
                    let message = this._client.messages.get(raw.id);
                    if (message) {
                        message.merge(raw);
                    } else {
                        message = new Structures.Message(this._client, message);
                    }
                    messages.set(message.id, message);
                });
                resolve(messages);
            }).catch(reject);
        });
    }
    
    triggerTyping()
    {
        return this._client.rest.request({
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
        if (raw.hasOwnProperty('permission_overwrites')) {
            this.permissionOverwrites.clear();
            raw.permission_overwrites.forEach((data) => {
                this.permissionOverwrites.set(data.id, data);
                //use object
            });
            delete raw.permission_overwrites;
        }

        for (let key in raw) {
            const camelKey = Utils.Tools.toCamelCase(key);
            Object.defineProperty(this, camelKey, {
                value: raw[key]
            });
            delete raw[key];
        }
        raw = null;
    }
}

module.exports = ChannelText;