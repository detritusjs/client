const BaseCollection = require('../Collections/BaseCollection.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    bitrate: 64000,
    guild_id: null,
    name: '...',
    nsfw: false,
    parent_id: null,
    permission_overwrites: [],
    position: -1,
    user_limit: 0
};

class ChannelVoice extends Structures.Channel
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            permission_overwrites: new BaseCollection(),
            raw: {
                permission_overwrites: raw.permission_overwrites
            }
        };
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

        this.merge(cache.raw);
    }

    get guild()
    {
        return this.client.guilds.get(this.guildId);
	}
	
	get joined()
	{
		return this.client.voiceConnections.has(this.guildId);
	}

    get parent()
    {
        return (this.parentId) ? this.client.channels.get(this.parentId) : null;
    }

    edit(data={})
    {
        return new Promise((resolve, reject) => {
            const payload = {};
            if (data.hasOwnProperty('name')) {
                data.name = String(data.name);
                if (data.name.length < 2 || 100 < data.name.length) {
                    reject(new Error('Channel name has to be between 2-100 characters.'));
                    return;
                }
            }
            if (data.hasOwnProperty('position')) {
                if (data.position !== this.position) {
                    payload.position = data.position;
                }
            }

            if (data.hasOwnProperty('bitrate')) {
                if (data.bitrate !== this.bitrate) {
                    payload.bitrate = data.bitrate;
                }
            }

            if (data.hasOwnProperty('userLimit')) {
                data.userLimit = parseInt(data.userLimit);
                if (data.userLimit === NaN) {
                    reject(new Error('User limit has to be an integer!'));
                    return;
                }
                if (data.userLimit < 0 || 99 < data.userLimit) {
                    reject(new Error('User limit has to be 0-99.'));
                    return;
                }
            }

            if (data.hasOwnProperty('parent')) {
                if (typeof(data.parent) === 'object') {
                    data.parent = data.parent.id;
                }
                if (data.parent) {
                    payload.parent = data.parent;
                }
            }

            this.client.restHandler.editChannel(this.id, payload).then(resolve).catch(reject);
        });
	}
	
	join(mute, deafen, force)
	{
		force = !!force;

		if (!this.joined && !force) {
			//do checks here
		}

		return this.client.joinVoiceChannel(this.guildId, this.id, {mute, deafen});
	}

    merge(raw={})
    {
        for (let key in raw) {
            switch (key)
            {
                case 'permission_overwrites':
                    this.permissionOverwrites.clear();
                    for (let value of raw[key]) {
                        Object.assign(value, {'channel_id': this.id, 'guild_id': this.guildId});
                        this.permissionOverwrites.set(value.id, new Structures.Overwrite(this.client, value));
                    }
                    continue;
            }
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: raw[key]
            });
        }
    }
}

module.exports = ChannelVoice;