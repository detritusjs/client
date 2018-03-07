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
            this.client.rest.endpoints.fetchRegions(this.id).then((regions) => {
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
        for (let key in raw) {
            switch (key)
            {
                case 'channels':
                    if (!this.client.channels.enabled) {continue;}
                    this.channels.forEach((channel) => {
                        if (raw[key].some((c) => c.id === channel.id)) {return;}
                        this.client.channels.delete(channel.id);
                    });

                    for (let value of raw[key]) {
                        if (this.client.channels.has(value.id)) {
                            this.client.channels.get(value.id).merge(value);
                        } else {
                            Object.assign(value, {'guild_id': this.id});
                            this.client.channels.update(Structures.Channel.create(this.client, value));
                        }
                    }
                    continue;
                case 'emojis':
                    if (!this.client.emojis.enabled) {continue;}
                    this.emojis.forEach((emoji) => {
                        if (raw[key].some((e) => e.id === emoji.id)) {return;}
                        this.client.emojis.delete(emoji.id);
                    });
                    
                    for (let value of raw[key]) {
                        if (this.client.emojis.has(value.id)) {
                            this.client.emojis.get(value.id).merge(value);
                        } else {
                            Object.assign(value, {'guild_id': this.id});
                            this.client.emojis.update(new Structures.Emoji(this.client, value));
                        }
                    }
                    continue;
                case 'members':
                    if (!this.client.members.enabled) {continue;}
                    for (let value of raw[key]) {
                        if (this.client.members.has(this.id, value.user.id)) {
                            this.client.members.get(this.id, value.user.id).merge(value);
                        } else {
                            Object.assign(value, {'guild_id': this.id});
                            this.client.members.update(new Structures.Member(this.client, value));
                        }
                    }
                    continue;
                case 'presences':
                    if (!this.client.presences.enabled) {continue;}
                    for (let value of raw[key]) {
                        this.client.presences.update(this.id, value.user.id, new Structures.Presence(this.client, value));
                    }
                    continue;
                case 'roles':
                    this.roles.clear();
                    for (let value of raw[key]) {
                        Object.assign(value, {'guild_id': this.id});
                        this.roles.set(value.id, new Structures.Role(this.client, value));
                    }
                    continue;
                case 'voice_states':
                    if (!this.client.voiceStates.enabled) {continue;}
                    this.client.voiceStates.delete(this.id);
                    for (let value of raw[key]) {
                        if (this.client.voiceStates.has(this.id, value.user_id)) {
                            this.client.voiceStates.get(this.id, value.user_id).merge(value);
                        } else {
                            Object.assign(value, {'guild_id': this.id});
                            this.client.voiceStates.update(new Structures.VoiceState(this.client, value));
                        }
                    }
                    continue;
            }
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: raw[key]
            });
        }
    }

    toString()
    {
        return `${this.name} (${this.id})`;
    }
}

module.exports = Guild;