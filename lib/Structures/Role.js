const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    id: null,
    color: 0,
    hoist: false,
    guild_id: null,
    managed: false,
    mentionable: false,
    name: '...',
    permissions: 0,
    position: 0
};

class Role extends BaseStructure
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            guild_id: raw.guild_id
        };

        super(client, raw, Object.keys(cache));

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

        cache = null;
    }

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
    }

    get guild()
    {
        return this.client.guilds.get(this.guildId);
    }

    get mention()
    {
        return `<@&${this.id}>`;
    }

    toString()
    {
        return this.mention;
    }
}

module.exports = Role;