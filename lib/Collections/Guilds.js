const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Guilds extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        options = options || {};
        Object.defineProperties(this, {
            client: {enumberable: false, writable: false, value: client},
            enabled: {enumberable: false, writable: true, value: (options.enabled === undefined) ? true : options.enabled}
        });
    }

    update(guild)
    {
        if (!this.enabled) {
            return;
        }
        this._set(guild.id, guild);
    }

    fetch(id)
    {
        //get from rest api
    }

    toString()
    {
        return `${this.size} Guilds`;
    }
}

module.exports = Guilds;