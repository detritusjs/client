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
            size += presences.length;
        });
        return size;
    }

    get duplicateSize()
    {
        var size = 0;
        this.forEach((presences) => {
            presences.forEach((prsnc) => {
                size += prsnc.guildIds.length;
            });
        });
        return size;
    }

    update(presence)
    {
        if (!this.enabled) {
            return;
        }

        var presences;
        if (this.has(presence.user.id)) {
            presences = this._get(presence.user.id);
        } else {
            presences = [];
            this._set(presence.user.id, presences);
        }

        for (let i = 0; i < presences.length; i++)
        {
            const prsnc = presences[i];
            if (prsnc.presence.equals(presence)) {
                prsnc.presence = prsnc.presence.merge(presence.raw);
                if (!prsnc.guildIds.includes(presence.guild_id)) {
                    prsnc.guildIds.push(presence.guild_id);
                }
            } else {
                if (prsnc.guildIds.includes(presence.guildId)) {
                    prsnc.guildIds.splice(prsnc.guildIds.indexOf(presence.guild_id), 1);
                    if (!prsnc.guildIds) {
                        delete presences[i];
                    }
                }
            }
        }

        if (!presences.some((prsnc) => {return prsnc.guildIds.includes(presence.guild_id)})) {
            presences.push({
                presence: presence,
                guildIds: [presence.guild_id]
            });
        }
    }

    toString()
    {
        return `${this.size} Presences`;
    }
}

module.exports = Presences;