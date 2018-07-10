const BaseStructure = require('./basestructure');

const Structures = {
	Channel: require('./channel'),
	Guild: require('./guild'),
	User: require('./user')
};

const InviteURLs = require('../utils').Constants.Rest.Endpoints.INVITE;

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

const ignore = ['channel', 'guild', 'inviter'];

class Invite extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);
		
		this.merge({
			channel: data.channel,
			guild: data.guild,
			inviter: data.inviter
		});
	}

	get URL() {return InviteURLs.SHORT(this.code);}
	get longURL() {return InviteURLs.LONG(this.code);}

	accept() {return this.client.rest.acceptInvite(this.code);}
	delete() {return this.client.rest.deleteInvite(this.code);}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'channel': {
				let channel;
				if (this.client.channels.has(value.id)) {
					channel = this.client.channels.get(value.id);
					channel.merge(value);
				} else {
					channel = Structures.Channel.create(this.client, value);
				}
				value = channel;
			}; break;
			case 'guild': {
				let guild;
				if (this.client.guilds.has(value.id)) {
					guild = this.client.guilds.get(value.id);
					guild.merge(value);
				} else {
					guild = new Structures.Guild(this.client, value);
				}
				value = guild;
			}; break;
			case 'inviter': {
				let inviter;
				if (this.client.users.has(value.id)) {
					inviter = this.client.users.get(value.id);
					inviter.merge(value);
				} else {
					inviter = new Structures.User(this.client, value);
				}
				value = inviter;
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = Invite;