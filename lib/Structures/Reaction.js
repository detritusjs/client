const BaseCollection = require('../Collections/BaseCollection.js');
const BaseStructure = require('./BaseStructure.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    channel_id: null,
    count: 0,
    emoji: {},
    message_id: null,
    me: false
};

class Reaction extends BaseStructure
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            emoji: raw.emoji.id && client.emojis.get(raw.emoji.id)
        };

        if (!cache.emoji) {
            cache.emoji = new Structures.Emoji(client, raw.emoji);
        }

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
    }

    get channel()
    {
        return this.client.channels.get(this.channelId);
    }

    get message()
    {
        return this.client.messages.get(this.messageId);
    }

    delete(user)
    {
        return this.client.rest.endpoints.deleteReaction(this.channelId, this.messageId, this.emoji, user || '@me');
        //add checks
    }

    fetchUsers()
    {
        return this.client.rest.endpoints.fetchReactions(this.channelId, this.messageId, this.emoji);
    }
}

module.exports = Reaction;