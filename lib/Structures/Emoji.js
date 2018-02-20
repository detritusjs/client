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

    get endpointFormat()
    {
        return (this.id) ? `${this.name}:${this.id}` : this.name;
    }

    get guild()
    {
        return (this.guildId) ? this._client.guilds.get(this.guildId) : null;
    }

    get URL()
    {
        return this.URLFormat(this._client.options.imageFormat || 'png');
    }

    URLFormat(format)
    {
        if (!this.id) {
            throw new Error('Cannot get a URL of a standard Emoji.');
        }
        format = (format || this._client.options.imageFormat || 'png').toLowerCase();
        const valid = ['png', 'gif'];
        if (!valid.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return [
            Constants.Endpoints.CDN.URL,
            Constants.Endpoints.CDN.EMOJI(this.id, format)
        ].join('');
    }

    edit(args)
    {
        if (!this.id) {
            return Promise.reject(new Error('Cannot edit a standard Emoji.'));
        }
        const data = {
            roles: this.raw.roles
        };
        if (typeof(args) === 'string') {
            data.name = args;
        } else {
            data.name = (args.name !== undefined) ? args.name : this.name;
            if (args.roles !== undefined) {
                if (!args.rolesAdd) {
                    data.roles = [];
                }
                args.roles.forEach((role) => {
                    if (typeof(role) === 'object') {
                        data.roles.push(role.id);
                    } else {
                        data.roles.push(role);
                    }
                });
            }
        }
        return this._client.rest.request({
            method: 'PATCH',
            uri: Constants.Endpoints.REST.GUILDS.EMOJI(this.guildId, this.id),
            useAuth: true,
            body: data,
            json: true
        });
    }

    delete()
    {
        if (!this.id) {
            return Promise.reject(new Error('Cannot delete a standard Emoji.'));
        }
        return this._client.rest.request({
            method: 'DELETE',
            uri: Constants.Endpoints.REST.GUILDS.EMOJI(this.guildId, this.id),
            useAuth: true
        });
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
        return (this.id) ? `<${(this.animated) ? 'a:' : ''}${this.name}:${this.id}>` : this.name;
    }
}

module.exports = Emoji;