'use strict';

const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class VoiceStates extends BaseCollection
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
        this.forEach((cache) => {
            size += cache._size;
        });
        return size;
    }

    update(voiceState)
    {
        if (!this.enabled) {
            return;
        }
        var guildMap;
        if (this.has(voiceState.guildId)) {
            guildMap = this._get(voiceState.guildId);
        } else {
            guildMap = new BaseCollection();
            this._set(voiceState.guildId, guildMap);
        }
        guildMap._set(voiceState.userId, voiceState);
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

    toString()
    {
        return `${this.size} VoiceStates`;
    }
}

module.exports = VoiceStates;