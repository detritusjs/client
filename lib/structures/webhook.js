const BaseStructure = require('./basestructure');

const Structures = {User: require('./user')};

const Utils = require('../utils');
const CDN = Utils.Constants.Rest.Endpoints.CDN;

const defaults = {
	id: null,
	guild_id: null,
	channel_id: null,
	user: null,
	name: null,
	avatar: null,
	token: null,
	discriminator: '0000'
};

const ignore = ['user'];

class Webhook extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		this.merge({user: data.user});
	}

	get avatarURL() {return this.avatarURLFormat();}
	get createdAt() {return new Date(this.createdAtUnix);}
	get createdAtUnix() {return Utils.Snowflake.timestamp(this.id);}
	get defaultAvatarURL() {return CDN.URL + CDN.AVATAR_DEFAULT(this.discriminator % 5);}
	get mention() {return `<@${this.id}>`;}

	get guild() {return this.client.guilds.get(this.guildId);}

	avatarURLFormat(format) {
		if (!this.avatar) {return this.defaultAvatarURL;}

		const hash = this.avatar;
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
		return CDN.URL + CDN.AVATAR(this.id, hash, format);
	}

	createMessage(data, compatible) {return this.execute(data, compatible);}
	delete() {return (this.token) ? this.client.rest.deleteWebhookToken(this.id, this.token) : this.client.rest.deleteWebhook(this.id);}
	execute(data, compatible) {return this.client.rest.executeWebhook(this.id, this.token, data, compatible);}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'user': {
				let user;
				if (this.client.users.has(value.id)) {
					user = this.client.users.get(value.id);
					user.merge(value);
				} else {
					user = new Structures.User(this.client, value);
					this.client.users.insert(value);
				}
				value = user;
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}

	toString() {return `${this.name}#${this.discriminator}`;}
}

module.exports = Webhook;