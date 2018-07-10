const BaseStructure = require('./basestructure');

const Utils = require('../utils');

const defaults = {
	id: null,
	color: 0,
	hoist: false,
	guild_id: null,
	managed: false,
	mentionable: false,
	name: '',
	permissions: 0,
	position: 0
};

class Role extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults);
	}

	get createdAt() {return new Date(this.createdAtUnix);}
	get createdAtUnix() {return Utils.Snowflake.timestamp(this.id);}
	get mention() {return `<@&${this.id}>`;}

	get guild() {return this.client.guilds.get(this.guildId);}

	can(permissions) {return Utils.Permissions.can(this.permissions, permissions);}

	delete() {return this.client.rest.deleteGuildRole(this.guildId, this.id);}
	edit(data) {return this.client.rest.editGuildRole(this.guildId, this.id);}

	toString() {return this.mention;}
}

module.exports = Role;