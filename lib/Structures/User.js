const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    id: null,
    username: '...',
    discriminator: '0000',
    avatar: null,
    bot: false
};

class User extends BaseStructure
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }

    get createdAt()
    {
        return new Date(Utils.Snowflake.timestamp(this.id));
    }

    get mention()
    {
        return `<@${this.id}>`;
    }

    get staticAvatarURL()
    {
        return this.avatarURL((this._client.options.imageFormat !== 'gif') ? this._client.options.imageFormat : 'jpg');
    }

    avatarURL(format)
    {
        const hash = this.avatar;
        if (!hash) {
            return this.defaultAvatarURL(format);
        }
        if (!format) {
            format = this._client.options.imageFormat;
            if (hash.slice(0, 2) === 'a_') {
                format = 'gif';
            }
        }
        format = format.toLowerCase();
        if (!Constants.ImageFormats.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(Constants.ImageFormats)}`);
        }
        return `${Constants.Endpoints.CDN.URL}${Constants.Endpoints.CDN.AVATAR(this.id, hash, format)}`;
    }

    defaultAvatarURL(format)
    {
        const hash = Constants.DefaultAvatarHashes[this.discriminator % Constants.DefaultAvatarHashes.length];
        if (!format) {
            format = this._client.options.imageFormat;
        }
        format = format.toLowerCase();
        if (!Constants.ImageFormats.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(Constants.ImageFormats)}`);
        }
        return `${Constants.Endpoints.ASSETS.URL}${Constants.Endpoints.ASSETS.ICON(hash, 'jpg')}`;
    }

    toString()
    {
        return this.mention;
    }
}

module.exports = User;