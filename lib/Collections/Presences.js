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
        var size = 0;
        this.forEach((presences) => {
            presences.forEach((prsnc) => {
                size += prsnc.guildIds.size;
            });
        });
        return size;
    }

    get actualSize()
    {
        var size = 0;
        this.forEach((presences) => {
            size += presences.size;
        });
        return size;
    }

    get(userId, guildId)
    {
        if (!this.enabled) {
            return;
        }

        if (this.has(userId)) {
            presences = this._get(userId);
            for (let key in presences) {
                if (presences[key].guildIds.includes(guildId)) {
                    return presences[key].presence;
                }
            }
        }
    }

    update(presence)
    {
        if (!this.enabled) {
            return;
        }

        const guildId = presence.guildIds.values().next().value;

        var presences;
        if (this.has(presence.user.id)) {
            presences = this._get(presence.user.id);
        } else {
            presences = new Set();
            this._set(presence.user.id, presences);
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