const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Presences extends BaseCollection
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

    get size()
    {
        return this.reduce((size, presences) => {
            return size + Array.from(presences.values()).reduce((s, p) => {
                return s + p.guildIds.size;
            }, 0);
        });
    }

    get actualSize()
    {
        return this.reduce((size, presences) => {
            return size + presences.size;
        });
    }

    get(userId, guildId)
    {
        if (!this.enabled || !super.has(userId)) {
            return null;
        }

        for (let value of super.get(userId).values()) {
            if (value.guildIds.has(guildId)) {
                return value;
            }
        }
    }

    has(userId, guildId)
    {
        if (!this.enabled || !super.has(userId)) {
            return false;
        }

        return (guildId) ? super.get(userId).has(guildId) : true;
    }

    update(presence)
    {
        if (!this.enabled) {
            return;
        }

        const guildId = presence.guildIds.values().next().value;

        var presences;
        if (super.has(presence.user.id)) {
            presences = super.get(presence.user.id);
        } else {
            presences = new Set();
            super.set(presence.user.id, presences);
        }

        presences.forEach((prsnc) => {
            if (prsnc.equals(presence)) {
                prsnc.merge({
                    guild_id: guildId
                });
            } else {
                if (prsnc.guildIds.has(guildId)) {
                    prsnc.guildIds.delete(guildId);
                    if (!prsnc.guildIds.size) {
                        presences.delete(prsnc);
                    }
                }
            }
        });

        for (let prsnc of presences.values()) {
            if (prsnc.guildIds.has(presence.guildId)) {
                return;
            }
        }
        presences.add(presence);
    }

    toString()
    {
        return `${this.size} Presences`;
    }
}

module.exports = Presences;