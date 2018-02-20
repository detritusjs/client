const BaseCollection = require('../Collections/BaseCollection.js');
const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    channel: {},
    code: null,
    created_at: null,
    guild: {},
    inviter: {},
    max_uses: 0,
    revoked: false,
    temporary: false,
    uses: 0
};

class Invite extends BaseStructure
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            channel: client.channels.get(raw.channel.id),
            created_at: new Date(raw.created_at),
            guild: client.guilds.get(raw.guild.id),
            inviter: client.users.get(raw.inviter.id)
        };

        if (!cache.channel) {
            cache.channel = new Structures.Channel(client, raw.channel);
        }
        if (!cache.guild) {
            cache.guild = new Structures.Guild(client, raw.guild);
        }
        if (!cache.inviter) {
            cache.inviter = new Structures.User(client, raw.inviter);
        }

        super(client, raw, Object.keys(cache));

        for (let key in cache) {
            const camelKey = Utils.Tools.toCamelCase(key);
            Object.defineProperty(this, camelKey, {
                enumerable: false,
                writable: false,
                configurable: true,
                value: cache[key]
            });
            delete cache[key];
        }
        cache = null;
    }

    delete()
    {
        return this._client.rest.request({
            route: {
                method: 'delete',
                path: Constants.Endpoints.REST.INVITE,
                params: {
                    code: this.code
                }
            }
        });
    }
}

module.exports = Invite;