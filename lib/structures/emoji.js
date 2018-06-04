const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Structures = {User: require('./user')};

const Utils = require('../utils');
const Constants = Utils.Constants;

const defaults = {
	id: null,
	animated: false,
	guild_id: null,
	managed: false,
	name: null,
	require_colons: false,
	roles: [],
	user: {}
};

class Emoji extends BaseStructure
{
	constructor(client, data)
	{
		super(client, data, defaults, ['roles', 'user']);

		Object.defineProperties(this, {
			roles: {enumerable: true, configurable: false, value: new BaseCollection()}
		});
		
		this.merge({
			roles: data.roles,
			user: data.user
		});
	}

	get createdAt() {return (this.id) ? new Date(this.createdAtUnix) : null;}
	get createdAtUnix() {return (this.id) ? Utils.Snowflake.timestamp(this.id) : null;}
	get endpointFormat() {return (this.id) ? `${this.name}:${this.id}` : this.name;}
	get URL() {return this.URLFormat();}

	get guild() {return (this.guildId) ? this.client.guilds.get(this.guildId) : null;}

	URLFormat(format)
	{
		if (!this.id) {throw new Error('Cannot get a URL of a standard Emoji.');}

		if (!format) {
			format = (this.animated) ? 'gif' : (this.client.options.imageFormat || 'png').toLowerCase();
		}

		const valid = ['png', 'gif'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return Constants.Endpoints.CDN.URL + Constants.Endpoints.CDN.EMOJI(this.id, format);
	}

	edit(data)
	{
		if (!this.id) {return Promise.reject(new Error('Cannot edit a standard Emoji.'));}
		return this.client.rest.editEmoji(this.guildId, this.id, data);
	}

	delete()
	{
		if (!this.id) {return Promise.reject(new Error('Cannot delete a standard Emoji.'));}
		return this.client.rest.deleteEmoji(this.guildId, this.id);
	}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'roles': {
					this.roles.clear();
					const guild = this.guild;
					for (let id of data[key]) {
						this.roles.set(id, (guild) ? guild.roles.get(id) : {id});
					}
				}; continue;
				case 'user': {
					if (data[key]) {
						let user;
						if (this.client.users.has(data[key].id)) {
							user = this.client.users.get(data[key].id);
							user.merge(data[key]);
						} else {
							user = new Structures.User(this.client, data[key]);
							this.client.users.insert(user);
						}
						data[key] = user;
					} else {
						data[key] = null;
					}
				}; break;
			}

			Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}

	toString() {return (this.id) ? `<${(this.animated) ? 'a:' : ''}${this.name}:${this.id}>` : this.name;}
}

module.exports = Emoji;