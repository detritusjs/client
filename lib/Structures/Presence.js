const BaseStructure = require('./BaseStructure.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    game: null,
    guild_id: null,
    roles: [],
    status: '',
    user: {}
};

class Presence extends BaseStructure
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            user: client.users.get(raw.user.id),
            guild_ids: new Set(),
            raw: {
                guild_id: raw.guild_id
            }
        };

        if (!cache.user) {
            cache.user = new Structures.User(client, raw.user);
            client.users.update(cache.user);
        }

        if (raw.game && !Object.keys(raw.game).length) {
            raw.game = null;
        }

        super(client, raw, ['guild_id'].concat(Object.keys(cache)));

        for (let key in cache) {
            if (key === 'raw') {continue;}
            const camelKey = Utils.Tools.toCamelCase(key);
            Object.defineProperty(this, camelKey, {
                enumerable: false,
                writable: false,
                configurable: true,
                value: cache[key]
            });
            delete cache[key];
        }

        this.merge(cache.raw);
        cache = null;
    }

    equals(presence)
    {
        return this.toString() === presence.toString();
    }

    merge(raw={})
    {
        if (raw.hasOwnProperty('guild_id')) {
            this.guildIds.add(raw.guild_id);
            delete raw.guild_id;
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

    toString()
    {
        return [
            'PRESENCE',
            this.user.id,
            this.status,
            JSON.stringify(this.game)
        ].join(' ');
    }
}

module.exports = Presence;