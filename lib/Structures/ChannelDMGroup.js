const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    application_id: null,
    icon: null,
    name: '...',
    owner_id: null,
};

class ChannelDMGroup extends Structures.ChannelDM
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }

    get iconURL()
    {
        return this.iconURLFormat();
    }

    iconURLFormat(format)
    {
        if (!this.icon) {
            return [
                Constants.Endpoints.CDN.URL,
                Constants.Endpoints.CDN.DM_GROUP
            ].join(''); //svg url will break u
        }

        format = (format || this.client.options.imageFormat || 'png').toLowerCase();
        const valid = ['jpeg', 'jpg', 'png', 'webp'];
        if (!valid.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return [
            Constants.Endpoints.CDN.URL,
            Constants.Endpoints.CDN.DM_ICON(this.id, this.icon, format)
        ].join('');
    }


    addRecipient(data)
    {
        return this.client.rest.endpoints.addRecipient(this.id, data.userId, data);
    }

    removeRecipient(userId)
    {
        return this.client.rest.endpoints.removeRecipient(this.id, userId);
    }
}

module.exports = ChannelDMGroup;