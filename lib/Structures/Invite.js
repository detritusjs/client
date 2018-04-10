const BaseCollection = require('../Collections/BaseCollection.js');
const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
	approximate_presence_count: null,
	approximate_member_count: null,
    channel: {},
    code: null,
    created_at: null,
    guild: {},
    inviter: {},
    max_uses: 0,
    revoked: false,
    temporary: false,
    uses: 0
};

class Invite extends BaseStructure
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            channel: client.channels.get(raw.channel.id),
            created_at: new Date(raw.created_at),
            guild: client.guilds.get(raw.guild.id)
        };

        if (!cache.channel) {
            cache.channel = new Structures.Channel(client, raw.channel);
        }
        if (!cache.guild) {
            cache.guild = new Structures.Guild(client, raw.guild);
		}
		
		if (raw.inviter) {
			if (client.users.has(raw.inviter.id)) {
				cache.inviter = client.users.get(raw.inviter.id);
			} else {
				cache.inviter = new Structures.User(client, raw.inviter);
			}
		}

        super(client, raw, Object.keys(cache));

        for (let key in cache) {
            if (key === 'raw') {continue;}
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: cache[key]
            });
        }
	}

    delete()
    {
        return this.client.rest.endpoints.deleteInvite(this.code);
    }
}

module.exports = Invite;