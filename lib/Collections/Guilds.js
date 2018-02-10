const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Guilds extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        this.client = client;
        this.options = {
            enabled: (options.enabled === undefined) ? true : options.enabled
        };
    }

    add(guild)
    {
        if (!this.options.enabled) {
            return;
        }
        this.set(guild.id, guild);
    }

    get(id)
    {
        return new Promise((resolve, reject) => {
            if (this.has(id)) {
                resolve(super.get(id));
                return;
            } else {
                //get from rest api
            }
        });
    }
}

module.exports = Guilds;