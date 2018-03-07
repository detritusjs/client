const BaseStructure = require('./BaseStructure.js');
const BaseCollection = require('../Collections/BaseCollection.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    id: null,
    animated: false,
    guild_id: null,
    managed: false,
    name: '...',
    require_colons: false,
    roles: [],
    user: {}
};

class Emoji extends BaseStructure
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            roles: new BaseCollection(),
            user: null,
            raw: {
                roles: raw.roles
            }
        };

        if (raw.user && Object.keys(raw.user).length) {
            cache.user = client.users.get(raw.user.id);
            if (!cache.user) {
                cache.user = new Structures.User(client, raw.user);
                client.users.update(cache.user);
            }
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

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
    }

    get endpointFormat()
    {
        return (this.id) ? `${this.name}:${this.id}` : this.name;
    }

    get guild()
    {
        return (this.guildId) ? this.client.guilds.get(this.guildId) : null;
    }

    get URL()
    {
        return this.URLFormat();
    }

    URLFormat(format)
    {
        if (!this.id) {
            throw new Error('Cannot get a URL of a standard Emoji.');
        }
        format = (format || this.client.options.imageFormat || 'png').toLowerCase();
        const valid = ['png', 'gif'];
        if (!valid.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return [
            Constants.Endpoints.CDN.URL,
            Constants.Endpoints.CDN.EMOJI(this.id, format)
        ].join('');
    }

    edit(data)
    {
        if (!this.id) {
            return Promise.reject(new Error('Cannot edit a standard Emoji.'));
        }

        return this.client.rest.endpoints.editEmoji(this.guildId, this.id, data);
    }

    delete()
    {
        if (!this.id) {
            return Promise.reject(new Error('Cannot delete a standard Emoji.'));
        }

        return this.client.rest.endpoints.deleteEmoji(this.guildId, this.id);
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
        return (this.id) ? `<${(this.animated) ? 'a:' : ''}${this.name}:${this.id}>` : this.name;
    }
}

module.exports = Emoji;