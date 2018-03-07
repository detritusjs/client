const BaseCollection = require('./BaseCollection.js');
const Presence = require('../Structures').Presence;
const Utils = require('../Utils');

class Presences extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        options = options || {};
        Object.defineProperties(this, {
            client: {writable: false, value: client},
            enabled: {enumerable: true, writable: true, value: (options.enabled === undefined) ? true : !!options.enabled},
            storeOffline: {enumerable: true, writable: true, value: (options.storeOffline === undefined) ? false : !!options.storeOffline}
        });

        this.defaults = {};
        for (let key in Utils.Constants.Gateway.STATUS) {
            const presence = new Presence(this.client, {
                status: Utils.Constants.Gateway.STATUS[key]
            });
            this.defaults[key] = presence;
        }
    }

    get size()
    {
        return this.reduce((size, presences) => {
            return size + presences.size;
        });
    }

    get actualSize()
    {
        const hashes = new Set(Object.keys(this.defaults).map((p)=>p.hash));
        for (let presences of super.values()) {
            for (let presence of presences.values()) {
                hashes.add(presence.hash);
            }
        }
        return hashes.size;
    }

    delete(guildId, userId)
    {
        if (!this.enabled || (!userId && !guildId)) {return;}

        if (guildId) {
            if (!super.has(guildId)) {return;}
            if (userId) {
                const presences = super.get(guildId);
                presences.delete(userId);
                if (presences.size) {return;}
            }
            super.delete(guildId);
        } else {
            for (let presences of this.values()) {
                if (!presences.has(userId)) {continue;}
                presences.delete(userId);
            }
        }
    }

    get(guildId, userId)
    {
        if (!this.enabled || (!guildId && !userId)) {return;}

        if (guildId) {
            if (!super.has(guildId)) {return;}
            return (userId) ? super.get(guildId).get(userId) : super.get(guildId);
        } else {
            for (let presences of this.values()) {
                if (!presences.has(userId)) {continue;}
                return presences.get(userId);
            }
        }
    }

    has(guildId, userId)
    {
        if (!this.enabled || (!guildId && !userId)) {return false;}

        if (guildId) {
            if (!super.has(guildId)) {return false;}
            return (userId) ? super.get(guildId).has(userId) : true;
        } else {
            for (let presences of this.values()) {
                if (!presences.has(userId)) {continue;}
                return true;
            }
        }
    }

    update(guildId, userId, presence)
    {
        if (!this.enabled) {return;}

        let presences;
        if (super.has(guildId)) {
            presences = super.get(guildId);
        } else {
            presences = new BaseCollection();
            super.set(guildId, presences);
        }

        let found;
        for (let key in this.defaults) {
            if (!this.defaults[key].equals(presence)) {continue;}
            presence = this.defaults[key];
            found = true;
            break;
        }
        if (!found) {
            for (let values of super.values()) {
                if (found) {break;}
                for (let value of values.values()) {
                    if (value.hash !== presence.hash) {continue;}
                    presence = value;
                    found = true;
                    break;
                }
            }
        }
        if (!this.storeOffline && presence.hash === this.defaults.OFFLINE.hash) {
            if (presences.has(userId)) {presences.delete(userId);}
            if (!presences.size) {this.delete(guildId);}
        } else {
            presences.set(userId, presence);
        }
    }

    toString()
    {
        return `${this.size} Presences`;
    }
}

module.exports = Presences;