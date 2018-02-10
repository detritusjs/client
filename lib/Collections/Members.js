const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Members extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        this.client = client;
        this.options = {
            enabled: (options.enabled === undefined) ? true : options.enabled,
            expireWhenOffline: options.expireWhenOffline || false
        };
    }

    get size()
    {
        var size = 0;
        this.forEach((cache) => {
            size += cache.size;
        });
        return size;
    }

    add(member)
    {
        if (!this.options.enabled) {
            return;
        }
        var guildMap;
        if (this.has(member.guildId)) {
            guildMap = super.get(member.guildId);
        } else {
            guildMap = new Map();
            this.set(member.guildId, guildMap);
        }
        guildMap.set(member.id, member);
    }

    get(id, guildId)
    {
        return new Promise((resolve, reject) => {
            if (this.has(guildId)) {
                resolve(super.get(guildId).get(id));
                return;
            } else {
                //get from rest api
            }
        });
    }

    getAll(id)
    {
        return new Promise((resolve, reject) => {
            const found = [];
            for (var cache of this.values()) {
                if (cache.has(id)) {
                    found.push(cache.get(id));
                }
            }
            resolve(found);
        });
    }
}

module.exports = Members;