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
        return this.client.rest.endpoints.fetchChannelInvites(this.id);
    }

    fetchMessage(data)
    {

    }

    fetchMessages(data)
    {

    }

    fetchPins()
    {
        return this.client.rest.endpoints.fetchPinnedMessages(this.id);
    }
    
    triggerTyping()
    {
        return this.client.rest.endpoints.triggerTyping(this.id);
    }

    merge(raw={})
    {
        for (let key in raw) {
            switch (key)
            {
                case 'permission_overwrites':
                    this.permissionOverwrites.clear();
                    for (let value of raw[key]) {
                        Object.assign(value, {'channel_id': this.id, 'guild_id': this.guildId});
                        this.permissionOverwrites.set(value.id, new Structures.Overwrite(this.client, value));
                    }
                    continue;
                case 'last_pin_timestamp':
                    raw[key] = new Date(raw[key]);
                    break;
            }
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: raw[key]
            });
        }
    }
}

module.exports = ChannelText;