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
            joined_at: new Date(raw.joined_at),
            roles: new BaseCollection(),
            raw: {
                channels: raw.channels,
                emojis: raw.emojis,
                members: raw.members,
                presences: raw.presences,
                roles: raw.roles,
                voice_states: raw.voice_states
            }
        };

        super(client, raw, Object.keys(cache.raw).concat(Object.keys(cache)));

        for (let key in cache) {
            if (key === 'raw') {continue;}
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: cache[key]
            });
        }

        this.merge(cache.raw);
    }

    get afkChannel()
    {

    }

    get categoryChannels()
    {
        return new BaseCollection(this.client.channels.filter((c) => c.isCategory && c.guildId === this.id));
    }

    get channels()
    {
        return new BaseCollection(this.client.channels.filter((c) => c.isGuildChannel && c.guildId === this.id));
    }

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
    }

    get emojis()
    {
        return new BaseCollection(this.client.emojis.filter((e) => e.guildId === this.id));
    }

    get iconURL()
    {
        return this.iconURLFormat();
    }

    get members()
    {
        return this.client.members.get(this.id);
    }

    get owner()
    {

    }

    get presences()
    {
        const presences = new BaseCollection();
        this.client.presences.forEach((userPresences) => {
            for (let presence of userPresences.values()) {
                if (!presence.guildIds.has(this.id)) {
                    presences.set(presence.user.id, presence);
                    return;
                }
            }
        });
        return presences;
    }

    get splashURL()
    {
        return this.splashURLFormat();
    }

    get systemChannel()
    {
        
    }

    get textChannels()
    {
        return new BaseCollection(this.client.channels.filter((c) => c.isText && c.guildId === this.id));
    }

    get voiceChannels()
    {
        return new BaseCollection(this.client.channels.filter((c) => c.isVoice && c.guildId === this.id));
    }

    get voiceStates()
    {
        return this.client.voiceStates.get(this.id);
    }

    iconFile(format)
    {
        return this.client.rest.request({
            method: 'get',
            url: this.iconURLFormat(format)
        });
    }

    iconURLFormat(format)
    {
        if (!this.icon) {
            return;
        }

        format = (format || this.client.options.imageFormat || 'png').toLowerCase();
        const valid = ['png', 'jpg', 'jpeg', 'webp'];
        if (!valid.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return [
            Constants.Endpoints.CDN.URL,
            Constants.Endpoints.CDN.GUILD_ICON(this.id, this.icon, format)
        ].join('');
    }

    splashURLFormat(format)
    {
        if (!this.splash) {
            return;
        }

        format = (format || this.client.options.imageFormat || 'png').toLowerCase();
        const valid = ['png', 'jpg', 'jpeg', 'webp'];
        if (!valid.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return [
            Constants.Endpoints.CDN.URL,
            Constants.Endpoints.CDN.GUILD_SPLASH(this.id, this.splash, format)
        ].join('');
    }

    fetchRegion()
    {
        return new Promise((resolve, reject) => {
            this.client.restHandler.fetchRegions(this.id).then((regions) => {
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
        //console.log(raw);

        if (raw.hasOwnProperty('channels')) {
            this.channels.forEach((channel) => {
                if (raw.channels.some((c) => c.id === channel.id)) {
                    return;
                }
                this.client.channels.delete(channel.id);
            });

            raw.channels.forEach((data) => {
                if (this.client.channels.has(data.id)) {
                    this.client.channels.get(data.id).merge(data);
                } else {
                    this.client.channels.update(Structures.Channel.create(this.client, Object.assign(data, {guild_id: this.id})));
                }
            });
            raw.channels = undefined;
        }

        if (raw.hasOwnProperty('emojis')) {
            this.emojis.forEach((emoji) => {
                if (raw.emojis.some((e) => e.id === emoji.id)) {
                    return;
                }
                this.client.emojis.delete(emoji.id);
            });

            raw.emojis.forEach((data) => {
                if (this.client.emojis.has(data.id)) {
                    this.client.emojis.get(data.id).merge(data);
                } else {
                    this.client.emojis.update(new Structures.Emoji(this.client, Object.assign(data, {guild_id: this.id})));
                }
            });
            raw.emojis = undefined;
        }

        if (raw.hasOwnProperty('members')) {
            raw.members.forEach((data) => {
                if (this.client.members.has(this.id, data.user.id)) {
                    this.client.members.get(this.id, data.user.id).merge(data);
                } else {
                    this.client.members.update(new Structures.Member(this.client, Object.assign(data, {guild_id: this.id})));
                }
            });
            raw.members = undefined;
        }

        if (raw.hasOwnProperty('presences')) {
            raw.presences.forEach((data) => {
                this.client.presences.update(new Structures.Presence(this.client, Object.assign(data, {guild_id: this.id})))
            });
            raw.presences = undefined;
        }

        if (raw.hasOwnProperty('roles')) {
            this.roles.clear();
            raw.roles.forEach((data) => {
                if (this.roles.has(data.id)) {
                    this.roles.get(data.id).merge(data);
                } else {
                    this.roles.set(data.id, new Structures.Role(this.client, Object.assign(data, {guild_id: this.id})));
                }
            });
            raw.roles = undefined;
        }

        if (raw.hasOwnProperty('voice_states')) {
            (raw.voice_states || []).forEach((data) => {
                if (this.client.voiceStates.has(this.id, data.user_id)) {
                    this.client.voiceStates.get(this.id, data.user_id).merge(data);
                } else {
                    this.client.voiceStates.update(new Structures.VoiceState(this.client, Object.assign(data, {guild_id: this.id})));
                }
            });
            //temp fix to a problem, dont get the cached stuff at the top in the cloning process
            raw.voice_states = undefined;
        }

        Object.keys(raw).forEach((key) => {
            if (raw[key] === undefined) {return;}
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: raw[key]
            });
        });
    }

    toString()
    {
        return `${this.name} (${this.id})`;
    }
}

module.exports = Guild;