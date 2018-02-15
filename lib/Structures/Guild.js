const BaseStructure = require('./BaseStructure.js');
const BaseCollection = require('../Collections/BaseCollection.js');

const Structures = {
    ChannelCategory: require('./ChannelCategory.js'),
    ChannelText: require('./ChannelText.js'),
    ChannelVoice: require('./ChannelVoice.js'),
    Member: require('./Member.js'),
    Emoji: require('./Emoji.js')
};

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    afk_channel_id: null,
    afk_timeout: 0,
    application_id: null,
    channels: [],
    default_message_notifications: 0,
    embed_channel_id: null,
    embed_enabled: false,
    emojis: [],
    explicit_content_filter: 0,
    features: [],
    icon: null,
    id: null,
    joined_at: '',
    large: false,
    member_count: 0,
    members: [],
    mfa_level: 0,
    name: '...',
    owner: false,
    owner_id: null,
    permissions: 0,
    presences: [],
    region: null,
    roles: [],
    splash: null,
    system_channel_id: null,
    unavailable: false,
    verification_level: 0,
    voice_states: [],
    widget_channel_id: null,
    widget_enabled: false
};

class Guild extends BaseStructure
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));

        this.raw.channels.forEach((data) => {
            var Channel;
            switch (data.type)
            {
                case Constants.ChannelTypes.GUILD_TEXT:     Channel = Structures.ChannelText; break;
                case Constants.ChannelTypes.GUILD_VOICE:    Channel = Structures.ChannelVoice; break;
                case Constants.ChannelTypes.GUILD_CATEGORY: Channel = Structures.ChannelCategory; break;
            }
            if (!Channel) {
                console.error(`Invalid Channel Type ${data.type}, ${data}`);
                return;
            }
            this._client.channels.update(new Channel(this._client, data));
        });

        this.raw.members.forEach((data) => {
            this._client.members.update(new Structures.Member(this._client, Object.assign(data, {guildId: this.id})));
        });

        this.raw.emojis.forEach((data) => {
            this._client.emojis.update(new Structures.Emoji(this._client, Object.assign(data, {guildId: this.id})));
        });
    }

    get categoryChannels()
    {
        return this._client.channels.filter((channel) => {
            return channel.guild_id === this.id && channel.type === Constants.ChannelTypes.GUILD_CATEGORY;
        });
    }

    get channels()
    {
        return this._client.channels.filter((channel) => {
            return channel.guild_id === this.id;
        });
    }

    get iconURL()
    {
        return this.iconURLFormat(this._client.options.imageFormat || 'png');
    }

    get members()
    {
        return this._client.members.get(this.id);
    }

    get splashURL()
    {
        return this.splashURLFormat(this._client.options.imageFormat || 'png');
    }

    get textChannels()
    {
        return this._client.channels.filter((channel) => {
            return channel.guild_id === this.id && channel.type === Constants.ChannelTypes.GUILD_TEXT;
        });
    }

    get voiceChannels()
    {
        return this._client.channels.filter((channel) => {
            return channel.guild_id === this.id && channel.type === Constants.ChannelTypes.GUILD_VOICE;
        });
    }

    iconURLFormat(format)
    {
        const hash = this.icon;
        if (!hash) {return null;}

        format = (format || this._client.options.imageFormat || 'png').toLowerCase();
        const valid = ['png', 'jpg', 'jpeg', 'webp'];
        if (!valid.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return `${Constants.Endpoints.CDN.URL}${Constants.Endpoints.CDN.GUILD_ICON(this.id, hash, format)}`;
    }

    splashURLFormat(format)
    {
        const hash = this.splash;
        if (!hash) {return null;}

        format = (format || this._client.options.imageFormat || 'png').toLowerCase();
        const valid = ['png', 'jpg', 'jpeg', 'webp'];
        if (!valid.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return `${Constants.Endpoints.CDN.URL}${Constants.Endpoints.CDN.GUILD_SPLASH(this.id, hash, format)}`;
    }

    getRegions()
    {
        return this._client.rest.request({
            method: 'get',
            uri: Constants.Endpoints.REST.VOICE_REGIONS,
            useAuth: true
        });
    }

    getRegion()
    {
        return new Promise((resolve, reject) => {
            this.getRegions().then((regions) => {
                const region = regions.find((reg) => {
                    return reg.id === this.region;
                });
                if (region) {
                    resolve(region);
                } else {
                    reject(new Error('Couldn\'t find this server\'s region from discord.'));
                }
            }).catch(reject);
        });
    }

    toString()
    {
        return `${this.name} (${this.id})`;
    }
}

module.exports = Guild;