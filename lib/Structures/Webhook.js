const BaseStructure = require('./BaseStructure.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
	id: null,
	guild_id: null,
	channel_id: null,
	user: null,
	name: null,
	avatar: null,
	token: null,
	discriminator: '0000'
};

class Webhook extends BaseStructure
{
    constructor(client, raw)
    {
		raw = Object.assign({}, def, raw);
		let cache = {
			user: null
		};

		if (raw.user) {
			if (client.users.has(raw.user.id)) {
				cache.user = client.users.get(raw.user.id);
				cache.user.merge(raw.user);
			} else {
				cache.user = new Structures.User(client, raw.user);
				client.users.update(cache.user);
			}
		}

		super(client, raw, Object.keys(cache));

		Object.keys(cache).forEach((key) => {
            if (key === 'raw') {return;}
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: cache[key]
            });
        });
    }

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
    }

    get mention()
    {
        return `<@${this.id}>`;
    }

    get defaultAvatarURL()
    {
        return `${Constants.Endpoints.CDN.URL}${Constants.Endpoints.CDN.AVATAR_DEFAULT(this.discriminator % 5)}`;
    }

    get avatarURL()
    {
        return this.avatarURLFormat();
    }

    avatarURLFormat(format)
    {
        const hash = this.avatar;
        if (!hash) {return this.defaultAvatarURL;}

        if (!format) {
            format = this.client.options.imageFormat || 'png';
            if (hash.slice(0, 2) === 'a_') {
                format = 'gif';
            }
        }
        format = format.toLowerCase();
        
        const valid = ['png', 'jpeg', 'jpg', 'webp', 'gif'];
        if (!valid.includes(format)) {
            throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
        }
        return `${Constants.Endpoints.CDN.URL}${Constants.Endpoints.CDN.AVATAR(this.id, hash, format)}`;
	}
	
	createMessage(body, compatible)
	{
		return new Promise((resolve, reject) => {
			this.client.rest.endpoints.executeWebhook(this.id, this.token, body, compatible).then(resolve).catch(reject);
		});
	}

	delete()
	{
		return new Promise((resolve, reject) => {
			if (this.token) {
				this.client.rest.endpoints.deleteWebhookToken(this.id, this.token).then(resolve).catch(reject);
			} else {
				this.client.rest.endpoints.deleteWebhook(this.id).then(resolve).catch(reject);
			}
		});
	}

    toString()
    {
        return `${this.name}#${this.discriminator}`;
    }
}

module.exports = Webhook;