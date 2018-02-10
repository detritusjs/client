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
            guildMap = new BaseCollection();
            this.set(member.guildId, guildMap);
        }
        guildMap.set(member.id, member);
    }

    fetch(guildId, id)
    {
        //get from rest api
    }

    get(guildId, id)
    {
        if (!this.has(guildId)) {
            return;
        }
        const guildMap = super.get(guildId);
        if (!id) {
            return guildMap;
        } else {
            return guildMap.get(id);
        }
    }

    getAll(id)
    {
        const found = [];
        for (var cache of this.values()) {
            if (cache.has(id)) {
                found.push(cache.get(id));
            }
        }
        return found;
    }
}

module.exports = Members;