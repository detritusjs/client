const BaseStructure = require('./basestructure');

const Structures = {
	Channel: require('./channel'),
	Guild: require('./guild'),
	User: require('./user')
};

const Utils = require('../utils');
const Constants = Utils.Constants;

const defaults = {
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
	constructor(client, data)
	{
		super(client, data, defaults, ['channel', 'guild', 'inviter']);
		
		this.merge({
			channel: data.channel,
			guild: data.guild,
			inviter: data.inviter
		});
	}

	get URL() {return Constants.Rest.Endpoints.INVITE.SHORT(this.code);}

	accept() {return this.client.rest.endpoints.acceptInvite(this.code);}
	delete() {return this.client.rest.endpoints.deleteInvite(this.code);}

	merge(data)
	{
		for (let key in data) {
			switch (key) {
				case 'channel': {
					let channel;
					if (this.client.channels.has(data[key].id)) {
						channel = this.client.channels.get(data[key].id);
						channel.merge(data[key]);
					} else {
						channel = Structures.Channel.create(this.client, data[key]);
					}
					data[key] = channel;
				}; break;
				case 'guild': {
					let guild;
					if (this.client.guilds.has(data[key].id)) {
						guild = this.client.guilds.get(data[key].id);
						guild.merge(data[key]);
					} else {
						guild = new Structures.Guild(this.client, data[key]);
					}
					data[key] = guild;
				}; break;
				case 'inviter': {
					let inviter;
					if (this.client.users.has(data[key].id)) {
						user = this.client.users.get(data[key].id);
						user.merge(data[key]);
					} else {
						user = new Structures.User(this.client, data[key]);
					}
					data[key] = user;
				}; break;
			}

			Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}
}

module.exports = Invite;