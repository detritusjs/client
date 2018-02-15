const BaseStructure = require('./BaseStructure.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    game: null,
    guild_id: null,
    roles: [],
    status: '',
    user: {}
};

class Presence extends BaseStructure
{
    constructor(client, raw)
    {
        if (raw.game && !Object.keys(raw.game).length) {raw.game = null;}
        super(client, Object.assign({}, def, raw));

        if (!this._client.users.has(this.raw.user.id)) {
            this._client.users.update(new User(this._client, this.raw.user));
        }
    }

    get user()
    {
        return this._client.users.get(this.raw.user.id);
    }

    get roles()
    {

    }

    equals(presence)
    {
        return this.toString() === presence.toString();
    }

    toString()
    {
        return [
            'PRESENCE',
            this.user.id,
            this.status,
            JSON.stringify(this.game)
        ].join(' ');
    }
}

module.exports = Presence;