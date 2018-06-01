const BaseCollection = require('../collections').BaseCollection;

const Structures = {
	Channel: require('./channel'),
	Overwrite: require('./overwrite')
};

const Tools = require('../utils').Tools;

const defaults = Object.assign({
	guild_id: null,
	name: '',
	nsfw: false,
	permission_overwrites: [],
	position: -1,
}, Structures.Channel.defaults);

class ChannelCategory extends Structures.Channel
{
	constructor(client, data)
	{
		super(client, data, defaults, ['permission_overwrites']);

		Object.defineProperties(this, {
			permissionOverwrites: {enumerable: true, configurable: false, value: new BaseCollection()}
		});

		this.merge({permission_overwrites: data.permission_overwrites});
	}

	get children() {return new BaseCollection(this.client.channels.filter((channel) => channel.isGuildChannel && channel.parentId === this.id));}
	get guild() {return this.client.guilds.get(this.guildId);}

	createInvite(data) {return this.client.rest.endpoints.createInvite(this.id, data);}
	fetchInvites() {return this.client.rest.endpoints.fetchChannelInvites(this.id);}

	differences(data)
	{
		const obj = {};
		for (let key in data) {
			const camelKey = Tools.toCamelCase(key);
			let value = this[camelKey];
			if (data[key] === value) {continue;}
			switch (key) {
				case 'permission_overwrites': {
					if (data[key].length === value.size && !value.size) {continue;}
					value = value.clone();
				}; break;
			}
			obj[camelKey] = value;
		}
		return obj;
	}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'permission_overwrites': {
					this.permissionOverwrites.clear();
					for (let value of data[key]) {
						Object.assign(value, {channel_id: this.id, guild_id: this.guildId});
						this.permissionOverwrites.set(value.id, new Structures.Overwrite(this.client, value));
					}
				}; continue;
			}

			Object.defineProperty(this, Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}
}

module.exports = ChannelCategory;