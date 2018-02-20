const BaseCollection = require('../Collections/BaseCollection.js');
const BaseStructure = require('./BaseStructure.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    id: null,
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
        raw = Object.assign({}, def, raw);
        let cache = {
            channels: new BaseCollection(),
            emojis: new BaseCollection(),
            joined_at: new Date(raw.joined_at),
            members: new BaseCollection(),
            roles: new BaseCollection(),
            voice_states: new BaseCollection(),
            raw: {
                channels: raw.channels,
                emojis: raw.emojis,
                members: raw.members,
                presences: raw.presences,
                roles: raw.roles,
                voice_states: raw.voice_states
            }
        };

        super(client, raw, ['presences'].concat(Object.keys(cache)));

        for (let key in cache) {
            if (key === 'raw') {continue;}
            const camelKey = Utils.Tools.toCamelCase(key);
            Object.defineProperty(this, camelKey, {
                enumerable: false,
                writable: false,
                configurable: true,
                value: cache[key]
            });
            delete cache[key];
        }

        this.merge(cache.raw);
        cache = null;
    }

    get afkChannel()
    {

    }

    get categoryChannels()
    {
        const channels = new BaseCollection();
        this._client.channels.forEach((channel) => {
            if (channel.type === Constants.ChannelTypes.GUILD_CATEGORY && channel.guildId === this.id) {
                channels.set(channel.id, channel);
            }
        });
        return channels;
    }

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
    }

    get iconURL()
    {
        return this.iconURLFormat(this._client.options.imageFormat || 'png');
    }

    get members()
    {
        return this._client.members.get(this.id);
    }

    get owner()
    {

    }

    get presences()
    {
        const map = [];
        this._client.presences.forEach((presence) => {
            presence.forEach((prsnc) => {
                if (prsnc.guildIds.includes(this.id)) {
                    map.push(prsnc.presence);
                }
            });
        });
        return map;
    }

    get splashURL()
    {
        return this.splashURLFormat(this._client.options.imageFormat || 'png');
    }

    get systemChannel()
    {
        
    }

    get textChannels()
    {
        const channels = new BaseCollection();
        this._client.channels.forEach((channel) => {
            if (channel.type === Constants.ChannelTypes.GUILD_TEXT && channel.guildId === this.id) {
                channels.set(channel.id, channel);
            }
        });
        return channels;
    }

    get voiceChannels()
    {
        const channels = new BaseCollection();
        this._client.channels.forEach((channel) => {
            if (channel.type === Constants.ChannelTypes.GUILD_VOICE && channel.guildId === this.id) {
                channels.set(channel.id, channel);
            }
        });
        return channels;
    }

    iconFile(format)
    {
        return this._client.rest.request({
            method: 'get',
            url: this.iconURLFormat(format)
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

    merge(raw={})
    {
        console.log(raw);

        if (raw.hasOwnProperty('channels')) {
            raw.channels.forEach((data) => {
                if (this.channels.has(data.id)) {
                    this.channels.get(data.id).merge(data);
                } else {
                    var Channel = Structures.Channel;
                    switch (data.type)
                    {
                        case Constants.ChannelTypes.GUILD_TEXT:     Channel = Structures.ChannelText; break;
                        case Constants.ChannelTypes.GUILD_VOICE:    Channel = Structures.ChannelVoice; break;
                        case Constants.ChannelTypes.GUILD_CATEGORY: Channel = Structures.ChannelCategory; break;
                    }
                    const channel = new Channel(this._client, Object.assign(data, {guild_id: this.id}));
                    this._client.channels.update(channel);
                    this.channels.set(channel.id, channel);
                }
            });
            delete raw.channels;
        }

        if (raw.hasOwnProperty('emojis')) {
            raw.emojis.forEach((data) => {
                if (this.emojis.has(data.id)) {
                    this.emojis.get(data.id).merge(data);
                } else {
                    const emoji = new Structures.Emoji(this._client, Object.assign(data, {guild_id: this.id}));
                    this._client.emojis.update(emoji);
                    this.emojis.set(emoji.id, emoji);
                }
            });
            delete raw.emojis;
        }

        if (raw.hasOwnProperty('members')) {
            raw.members.forEach((data) => {
                if (this.members.has(data.id)) {
                    this.members.get(data.id).merge(data);
                } else {
                    const member = new Structures.Member(this._client, Object.assign(data, {guild_id: this.id}));
                    this._client.members.update(member);
                    this.members.set(member.id, member);
                }
            });
            delete raw.members;
        }

        if (raw.hasOwnProperty('presences')) {
            raw.presences.forEach((data) => {
                this._client.presences.update(new Structures.Presence(this._client, Object.assign(data, {guild_id: this.id})))
            });
            delete raw.presences;
        }

        if (raw.hasOwnProperty('roles')) {
            raw.roles.forEach((data) => {
                if (this.roles.has(data.id)) {
                    this.roles.get(data.id).merge(data);
                } else {
                    const role = new Structures.Role(this._client, Object.assign(data, {guild_id: this.id}));
                    this.roles.set(role.id, role);
                }
            });
            delete raw.roles;
        }

        if (raw.hasOwnProperty('voice_states')) {
            raw.voice_states.forEach((data) => {
                if (this.voiceStates.has(data.user_id)) {
                    this.voiceStates.get(data.user_id).merge(data);
                } else {
                    const voiceState = new Structures.VoiceState(this._client, Object.assign(data, {guild_id: this.id}));
                    this.voiceStates.set(voiceState.userId, voiceState);
                }
            });
            delete raw.voice_states;
        }

        for (let key in raw) {
            const camelKey = Utils.Tools.toCamelCase(key);
            Object.defineProperty(this, camelKey, {
                value: raw[key]
            });
            delete raw[key];
        }
        raw = null;
    }

    toString()
    {
        return `${this.name} (${this.id})`;
    }
}

module.exports = Guild;