const BaseStructure = require('./basestructure');

const defaults = {
	id: null,
	allow: 0,
	channel_id: null,
	deny: 0,
	guild_id: null,
	type: null
};

class Overwrite extends BaseStructure
{
	constructor(client, data) {super(client, data, defaults);}

	get channel() {return (this.channelId) ? this.client.channels.get(this.channelId) : null;}
	get guild() {return (this.guildId) ? this.client.guilds.get(this.guildId) : null;}

	get isMember() {return this.type === 'member';}
	get isRole() {return this.type === 'role';}

	get member() {return (this.isMember) ? this.client.members.get(this.guildId, this.id) : null;}

	get role()
	{
		if (!this.isRole) {return null;}
		const guild = this.guild;
		return (guild) ? guild.roles.get(this.id) : null;
	}

	delete() {return this.client.rest.endpoints.deleteChannelOverwrite(this.channelId, this.id);}
	edit({allow, deny}) {return this.client.rest.endpoints.editChannelOverwrite(this.channelId, this.id, {allow, deny, type: this.type});}
}

module.exports = Overwrite;