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

    get mention()
    {
        return `<#${this.id}>`;
    }

    get isDm()
    {
        return this.type === Constants.ChannelTypes.DM || this.type === Constants.ChannelTypes.GROUP_DM;
    }

    toString()
    {
        return this.mention;
    }
}

module.exports = Channel;