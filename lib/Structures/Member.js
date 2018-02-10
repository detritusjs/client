const BaseStructure = require('./BaseStructure.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    deaf: false,
    joined_at: '',
    mute: false,
    nick: null,
    roles: [],
    user: {}
};

class Member extends BaseStructure
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));

        if (!this._client.users.has(this.raw.user.id)) {
            this._client.users.update(new User(this._client, this.raw.user));
        }
        this.id = this.raw.user.id;
    }

    get user()
    {
        return this._client.users.get(this.id);
    }

    get createdAt()
    {
        return new Date(Utils.Snowflake.timestamp(this.id));
    }

    get mention()
    {
        if (this.nick) {
            return `<@!${this.id}>`;
        } else {
            return `<@${this.id}>`;
        }
    }

    get staticAvatarURL()
    {
        return this.avatarURL((this._client.options.imageFormat !== 'gif') ? this._client.options.imageFormat : 'jpg');
    }

    avatarURL(format)
    {
        const hash = this.user.avatar;
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
        const hash = Constants.DefaultAvatarHashes[this._user.discriminator % Constants.DefaultAvatarHashes.length];
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

module.exports = Member;