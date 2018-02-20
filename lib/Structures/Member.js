const BaseCollection = require('../Collections/BaseCollection.js');
const BaseStructure = require('./BaseStructure.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    deaf: false,
    guild_id: null,
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
        raw = Object.assign({}, def, raw);
        let cache = {
            id: raw.user.id,
            joined_at: new Date(raw.joined_at),
            roles: new BaseCollection(),
            user: client.users.get(raw.user.id),
            raw: {
                roles: raw.roles
            }
        };

        if (!cache.user) {
            cache.user = new Structures.User(client, raw.user);
            client.users.update(cache.user);
        }

        super(client, raw, Object.keys(cache));

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

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
    }

    get guild()
    {
        return this._client.guilds.get(this.guildId);
    }

    get joinedAtUnix()
    {
        return Date.parse(this.joinedAt);
    }

    get mention()
    {
        if (this.nick) {
            return `<@!${this.id}>`;
        } else {
            return this.user.mention;
        }
    }

    get defaultAvatarURL()
    {
        return this.user.defaultAvatarUrl;
    }

    get avatarURL()
    {
        return this.user.avatarURLFormat();
    }

    avatarURLFormat(format)
    {
        return this.user.avatarURLFormat(format);
    }

    merge(raw={})
    {
        if (raw.hasOwnProperty('roles')) {
            const guild = this.guild;
            this.roles.clear();
            raw.roles.forEach((data) => {
                if (guild && guild.roles.has(data)) {
                    this.roles.set(data, guild.roles.get(data));
                } else {
                    this.roles.set(data, {id: data});
                }
            });
            delete raw.roles;
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
        return this.user.toString();
    }
}

module.exports = Member;