const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    id: null,
    animated: false,
    guildId: null,
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
        super(client, Object.assign({}, def, raw));
    }

    get guild()
    {
        if (!this.guildId) {
            return;
        }
        return this._client.guilds.get(this.guildId);
    }

    get roles()
    {
        return this.raw.roles;
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
        return `${Constants.Endpoints.CDN.URL}${Constants.Endpoints.CDN.EMOJI(this.id, format)}`;
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
            uri: Constants.Endpoints.REST.GUILDS.EMOJI(this.guild_id, this.id),
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
            uri: Constants.Endpoints.REST.GUILDS.EMOJI(this.guild_id, this.id),
            useAuth: true
        });
    }
}

module.exports = Emoji;