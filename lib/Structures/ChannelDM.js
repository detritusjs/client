const BaseCollection = require('../Collections/BaseCollection.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    last_message_id: null,
    last_pin_timestamp: null,
    recipients: []
};

class ChannelDM extends Structures.Channel
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            last_pin_timestamp: new Date(raw.last_pin_timestamp),
            recipients: new BaseCollection(),
            raw: {
                recipients: raw.recipients
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

    iconURL(format)
    {
        return (this.recipients.size) ? this.recipients.first().avatarURL(format) : null;
    }

    merge(raw={})
    {
        for (let key of Object.keys(raw)) {
            switch (key)
            {
                case 'recipients':
                    this.recipients.clear();
                    for (let value of raw[key]) {
                        let user;
                        if (this.client.users.has(value['id'])) {
                            user = this.client.users.get(value['id']);
                        } else {
                            user = new Structures.User(this.client, value);
                            this.client.users.update(user);
                        }
                        this.recipients.set(user.id, user);
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

module.exports = ChannelDM;