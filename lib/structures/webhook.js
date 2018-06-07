const BaseStructure = require('./basestructure');

const Structures = {User: require('./user')};

const Utils = require('../utils');
const Constants = Utils.Constants;

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

class Webhook extends BaseStructure
{
	constructor(client, data)
	{
		super(client, data, defaults, ignore);

		if (data.user) {this.merge({user: data.user});}
	}

	get avatarURL() {return this.avatarURLFormat();}
	get createdAt() {return new Date(this.createdAtUnix);}
	get createdAtUnix() {return Utils.Snowflake.timestamp(this.id);}
	get defaultAvatarURL() {return Constants.Rest.Endpoints.CDN.URL + Constants.Rest.Endpoints.CDN.AVATAR_DEFAULT(this.discriminator % 5);}
	get mention() {return `<@${this.id}>`;}

	get guild() {return this.client.guilds.get(this.guildId);}

	avatarURLFormat(format)
	{
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
		return Constants.Rest.Endpoints.CDN.URL + Constants.Rest.Endpoints.CDN.AVATAR(this.id, hash, format);
	}

	createMessage(data, compatible) {return this.execute(data, compatible);}
	delete() {return (this.token) ? this.client.rest.deleteWebhookToken(this.id, this.token) : this.client.rest.deleteWebhook(this.id);}
	execute(data, compatible) {return this.client.rest.executeWebhook(this.id, this.token, data, compatible);}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'user': {
					let user;
					if (this.client.users.has(data[key].id)) {
						user = this.client.users.get(data[key].id);
						user.merge(data[key]);
					} else {
						user = new Structures.User(this.client, data[key]);
						this.client.users.insert(user);
					}
					data[key] = user;
				}; break;
			}

			this.mergeValue(key, data[key]);
		}
	}

	toString() {return `${this.name}#${this.discriminator}`;}
}

module.exports = Webhook;