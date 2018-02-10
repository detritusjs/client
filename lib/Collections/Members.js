'use strict';

const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Members extends BaseCollection
{
    constructor(client, options={})
    {
        super();

        Object.defineProperties(this, {
            client: {enumberable: false, writable: false, value: client},
            enabled: {enumberable: false, writable: true, value: (options.enabled === undefined) ? true : options.enabled},
            expireWhenOffline: {enumberable : false, writable: true, value: !!(options.expireWhenOffline || false)}
        });
    }

    get size()
    {
        var size = 0;
        this.forEach((cache) => {
            size += cache._size;
        });
        return size;
    }

    update(member)
    {
        if (!this.enabled) {
            return;
        }
        var guildMap;
        if (this.has(member.guildId)) {
            guildMap = this._get(member.guildId);
        } else {
            guildMap = new BaseCollection();
            this._set(member.guildId, guildMap);
        }
        guildMap._set(member.id, member);
    }

    fetch(guildId, id)
    {
        //get from rest api
    }

    get(guildId, id)
    {
        if (!this.enabled) {
            return;
        }
        if (this.has(guildId)) {
            const guildMap = this._get(guildId);
            if (id) {
                return guildMap._get(id);
            } else {
                return guildMap;
            }
        }
    }

    toString()
    {
        return `${this.size} Members`;
    }
}

module.exports = Members;