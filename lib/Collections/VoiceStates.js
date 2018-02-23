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
        return this.reduce((size, cache) => {
            return size + cache.size;
        });
    }

    update(voiceState)
    {
        if (!this.enabled) {
            return;
        }
        let guildMap;
        if (this.has(voiceState.guildId)) {
            guildMap = this.get(voiceState.guildId);
        } else {
            guildMap = new BaseCollection();
            this.set(voiceState.guildId, guildMap);
        }
        guildMap.set(voiceState.userId, voiceState);
    }

    delete(guildId, id)
    {
        if (!this.enabled || !super.has(guildId)) {
            return;
        }
        return (id) ? super.get(guildId).delete(id) : super.delete(guildId);
    }

    get(guildId, id)
    {
        if (!this.enabled || !super.has(guildId)) {
            return null;
        }
        return (id) ? super.get(guildId).get(id) : super.get(guildId);
    }

    has(guildId, id)
    {
        if (!this.enabled || !super.has(guildId)) {
            return false;
        }
        return (id) ? super.get(guildId).has(id) : true;
    }

    toString()
    {
        return `${this.size} VoiceStates`;
    }
}

module.exports = VoiceStates;