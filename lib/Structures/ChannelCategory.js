const BaseCollection = require('../Collections/BaseCollection.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    guild_id: null,
    name: '...',
    nsfw: false,
    parent_id: null,
    permission_overwrites: [],
    position: -1
};

class ChannelCategory extends Structures.Channel
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

    get children()
    {
        const children = new BaseCollection();
        this.client.channels.forEach((channel) => {
            if ((channel.isText || channel.isVoice) && channel.parentId === this.id) {
                children.set(channel.id, channel);
            }
        });
        return children;
    }

    merge(raw={})
    {
        for (let key of Object.keys(raw)) {
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

module.exports = ChannelCategory;