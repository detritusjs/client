const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Channels extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        this.client = client;
        this.options = {
            enabled: (options.enabled === undefined) ? true : options.enabled
        };
    }

    add(channel)
    {
        if (!this.options.enabled) {
            return;
        }
        this.set(channel.id, channel);
    }

    fetch(id)
    {
        //fetch from api
    }
}

module.exports = Channels;