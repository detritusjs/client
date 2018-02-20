const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    id: null,
    type: Constants.ChannelTypes.CHANNEL
};

class Channel extends BaseStructure
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

    get mention()
    {
        return `<#${this.id}>`;
    }

    get isDm()
    {
        return this.type === Constants.ChannelTypes.DM || this.type === Constants.ChannelTypes.GROUP_DM;
    }

    get isText()
    {
        return this.type === Constants.ChannelTypes.GUILD_TEXT;
    }

    get isVoice()
    {
        return this.type === Constants.ChannelTypes.GUILD_VOICE;
    }

    delete()
    {
        return this._client.rest.request({
            route: {
                method: 'delete',
                path: Constants.Endpoints.REST.CHANNELS.ID,
                params: {
                    channelId: this.id
                }
            }
        });
    }

    toString()
    {
        return `#${this.name}`;
    }
}

module.exports = Channel;