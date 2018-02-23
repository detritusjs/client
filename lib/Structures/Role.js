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
        super(client, Object.assign({}, def, raw));
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