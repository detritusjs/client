'use strict';

const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Members extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        options = options || {};
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

    delete(guildId, id)
    {
        if (!this.enabled) {
            return;
        }
        if (this.has(guildId)) {
            if (!id) {
                return this._delete(guildId);
            } else {
                return this._get(guildId).delete(id);
            }
        }
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

    has(guildId, id)
    {
        if (!this.enabled) {
            return false;
        }
        if (this._has(guildId)) {
            if (!id) {
                return true;
            } else {
                return this._get(guildId).has(id);
            }
        }
	}
	
	find(func)
	{
		for (let collection of this.values()) {
			const found = collection.find(func);
			if (found) {
				return found;
			}
		}
	}

    toString()
    {
        return `${this.size} Members`;
    }
}

module.exports = Members;