const ChannelDM = require('./ChannelDM.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    icon: null,
    name: '...',
    owner_id: null,
};

class ChannelDMGroup extends ChannelDM
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }

    iconURL(format)
    {
        const hash = this.icon;
        if (!hash) {
            return `${Constants.Endpoints.CDN.URL}${Constants.Endpoints.CDN.DM_GROUP}`; //svg url will break u
        }
        if (!format) {
            format = this._client.options.imageFormat;
        }
        format = format.toLowerCase();
        if (format === 'gif' || !Constants.ImageFormats.includes(format)) {
            const valid = [].concat(Constants.ImageFormats);
            delete valid[valid.indexOf('gif')];
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return `${Constants.Endpoints.CDN.URL}${Constants.Endpoints.CDN.DM_ICON(this.id, hash, format)}`;
    }
}

module.exports = ChannelDMGroup;