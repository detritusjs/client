const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Emojis extends BaseCollection
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

    update(emoji)
    {
        if (!this.enabled) {
            return;
        }
        this._set(emoji.id, emoji);
    }

    fetch(guildId, id)
    {
        //get from rest api
    }

    toString()
    {
        return `${this.size} Emojis`;
    }
}

module.exports = Emojis;