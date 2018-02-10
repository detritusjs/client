const Channel = require('./Channel.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    guild_id: null,
    name: '...',
    nsfw: false,
    parent_id: null,
    permission_overwrites: [],
    position: -1
};

class ChannelCategory extends Channel
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }

    get guild()
    {
        return this._client.guilds.get(this.guild_id);
    }

    get parent()
    {
        return this._client.channels.get(this.parent_id);
    }
}

module.exports = ChannelCategory;