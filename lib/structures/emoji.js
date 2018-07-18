const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Structures = {User: require('./user')};

const Utils = require('../utils');
const CDN = Utils.Constants.Endpoints.CDN;

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

const ignore = ['roles', 'user'];

class Emoji extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		Object.defineProperties(this, {
			roles: {enumerable: true, value: new BaseCollection()}
		});

		this.merge({
			roles: data.roles,
			user: data.user
		});
	}

	get createdAt() {return (this.id) ? new Date(this.createdAtUnix) : null;}
	get createdAtUnix() {return (this.id) ? Utils.Snowflake.timestamp(this.id) : null;}
	get endpointFormat() {return (this.id) ? `${this.name}:${this.id}` : this.name;}
	get format() {return (this.id) ? `<${(this.animated) ? 'a:' : ''}${this.name}:${this.id}>` : this.name;}
	get url() {return this.URL;}
	get URL() {return this.URLFormat();}

	get guild() {return (this.guildId) ? this.client.guilds.get(this.guildId) : null;}

	URLFormat(format) {
		if (!this.id) {throw new Error('Cannot get a URL of a standard Emoji.');}

		if (!format) {
			format = (this.animated) ? 'gif' : (this.client.options.imageFormat || 'png').toLowerCase();
		}

		const valid = ['png', 'gif'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return CDN.URL + CDN.EMOJI(this.id, format);
	}

	edit(data) {
		if (!this.id) {return Promise.reject(new Error('Cannot edit a standard Emoji.'));}
		return this.client.rest.editGuildEmoji(this.guildId, this.id, data);
	}

	delete() {
		if (!this.id) {return Promise.reject(new Error('Cannot delete a standard Emoji.'));}
		return this.client.rest.deleteGuildEmoji(this.guildId, this.id);
	}

	fetchData(options) {
		options = Object.assign({}, options);
		return this.client.rest.request({method: 'get', url: this.URLFormat(options.format), query: options.query});
	}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'roles': {
				this.roles.clear();
				const guild = this.guild;
				for (let id of value) {
					this.roles.set(id, (guild) ? guild.roles.get(id) : {id});
				}
			}; return;
			case 'user': {
				let user;
				if (this.client.users.has(value.id)) {
					user = this.client.users.get(value.id);
					user.merge(value);
				} else {
					user = new Structures.User(this.client, value);
					this.client.users.insert(user);
				}
				value = user;
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}

	toString() {return this.format;}
}

Emoji.defaults = defaults;
Emoji.ignore = ignore;
module.exports = Emoji;