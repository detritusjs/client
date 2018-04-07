const BaseStructure = require('./BaseStructure.js');
const Structures = require('./index.js');

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

    get isCategory()
    {
        return this.type === Constants.ChannelTypes.GUILD_CATEGORY;
    }

    get isDm()
    {
        return this.type === Constants.ChannelTypes.DM || this.type === Constants.ChannelTypes.GROUP_DM;
    }

    get isGuildChannel()
    {
        return (this.type === Constants.ChannelTypes.GUILD_CATEGORY) || (this.type === Constants.ChannelTypes.GUILD_TEXT) || (this.type === Constants.ChannelTypes.GUILD_VOICE);
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
        return this.client.restHandler.deleteChannel(this.id);
        //add checks for guild stuff/dm stuff
    }

    toString()
    {
        return (this.type === Constants.ChannelTypes.DM) ? 'DM Channel' : `#${this.name}`;
    }
}

Channel.create = (client, raw) => {
    var Class = Channel;
    switch (raw.type)
    {
        case Constants.ChannelTypes.GUILD_TEXT:     Class = Structures.ChannelText; break;
        case Constants.ChannelTypes.DM:             Class = Structures.ChannelDM; break;
        case Constants.ChannelTypes.GUILD_VOICE:    Class = Structures.ChannelVoice; break;
        case Constants.ChannelTypes.GROUP_DM:       Class = Structures.ChannelDMGroup; break;
        case Constants.ChannelTypes.GUILD_CATEGORY: Class = Structures.ChannelCategory; break;
    }
    return new Class(client, raw);
};
module.exports = Channel;