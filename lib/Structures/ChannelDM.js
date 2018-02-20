const BaseCollection = require('../Collections/BaseCollection.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    last_message_id: null,
    recipients: []
};

class ChannelDM extends Structures.Channel
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            recipients: new BaseCollection(),
            raw: {
                recipients: raw.recipients
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

    iconURL(format)
    {
        return (this.recipients.size) ? this.recipients.first().avatarURL(format) : null;
    }

    merge(raw={})
    {
        if (raw.hasOwnProperty('recipients')) {
            this.recipients.clear();
            raw.recipients.forEach((data) => {
                let user = this._client.users.get(data.id);
                if (!user) {
                    user = new Structures.User(this._client, data);
                    this._client.users.update(user);
                }
                this.recipients.set(user.id, user);
            });
            delete raw.recipients;
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

module.exports = ChannelDM;