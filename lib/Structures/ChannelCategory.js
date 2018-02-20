const Structures = require('./index.js');

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

class ChannelCategory extends Structures.Channel
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }

    get guild()
    {
        return this._client.guilds.get(this.guildId);
    }

    get children()
    {
        return this._client.channels.filter((channel) => {
            return (channel.isText || channel.isVoice) && channel.parentId === this.id;
        });
    }
}

module.exports = ChannelCategory;