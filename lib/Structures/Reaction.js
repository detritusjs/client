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
        //add checks
        if (!user) {
            user = '@me';
        } else if (typeof(user) === 'object') {
            user = user.id;
        }

        return this.client.rest.request({
            route: {
                method: 'delete',
                path: Constants.Endpoints.REST.CHANNELS.MESSAGE_REACTION_USER,
                params: {
                    channelId: this.channelId,
                    messageId: this.messageId,
                    emoji: this.emoji.endpointFormat,
                    userId: user
                }
            }
        });
    }

    fetchUsers()
    {
        return new Promise((resolve, reject) => {
            this.client.rest.request({
                route: {
                    method: 'get',
                    path: Constants.Endpoints.REST.CHANNELS.MESSAGE_REACTION,
                    params: {
                        channelId: this.channelId,
                        messageId: this.messageId,
                        emoji: this.emoji.endpointFormat
                    }
                }
            }).then((data) => {
                const users = new BaseCollection();
                data.forEach((user) => {
                    if (this.client.users.has(user.id)) {
                        users.set(user.id, this.client.users.get(user.id));
                    } else {
                        user = new Structures.User(this.client, user);
                        this.client.users.update(user);
                        users.set(user.id, user);
                    }
                });
                resolve(users);
            }).catch(reject);
        });
    }
}

module.exports = Reaction;