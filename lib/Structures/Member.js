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
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: cache[key]
            });
        }

        this.merge(cache.raw);
    }

    get avatarURL()
    {
        return this.user.avatarURLFormat();
    }

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
    }

    get defaultAvatarURL()
    {
        return this.user.defaultAvatarUrl;
    }

    get guild()
    {
        return this.client.guilds.get(this.guildId);
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

    get presence()
    {
        
    }

    avatarURLFormat(format)
    {
        return this.user.avatarURLFormat(format);
    }

    merge(raw={})
    {
        for (let key in raw) {
            switch (key)
            {
                case 'roles':
                    const guild = this.guild;
                    this.roles.clear();
                    for (let value of raw[key]) {
                        if (guild && guild.roles.has(value)) {
                            this.roles.set(value, guild.roles.get(value));
                        } else {
                            this.roles.set(value, null);
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
        return this.user.toString();
    }
}

module.exports = Member;