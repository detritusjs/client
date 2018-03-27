'use strict';

const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class VoiceConnections extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        options = options || {};
        Object.defineProperties(this, {
            client: {enumberable: false, writable: false, value: client}
        });
    }

    update(voiceConnection)
    {
		if (this.has(voiceConnection.guildId)) {
			this.get(voiceConnection.guildId).merge(voiceConnection);
		} else {
			this.set(voiceConnection.guildId, voiceConnection);
		}
    }

    toString()
    {
        return `${this.size} VoiceConnections`;
    }
}

module.exports = VoiceConnections;