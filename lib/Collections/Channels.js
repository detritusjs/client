const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Channels extends BaseCollection
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

    update(channel)
    {
        if (!this.enabled) {
            return;
        }
        this._set(channel.id, channel);
    }

    fetch(id)
    {
        //fetch from api
    }

    toString()
    {
        return `${this.size} Channels`;
    }
}

module.exports = Channels;