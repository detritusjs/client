const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Structures = {
	User: require('./user')
};

const defaults = {
	deaf: false,
	guild_id: null,
	joined_at: '',
	mute: false,
	nick: null,
	roles: [],
	user: {}
};

const ignore = ['roles', 'joined_at', 'user'];

class Member extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		Object.defineProperties(this, {
			roles: {enumerable: true, configurable: false, value: new BaseCollection()}
		});
		
		this.merge({
			joined_at: data.joined_at,
			roles: data.roles,
			user: data.user
		});
	}

	get isMe() {return this.user.isMe;}
	get id() {return this.user.id;}
	get bot() {return this.user.bot;}
	get createdAt() {return this.user.createdAt;}
	get createdAtUnix() {return this.user.createdAtUnix;}
	get discriminator() {return this.user.discriminator;}
	get guild() {return this.client.guilds.get(this.guildId);}
	get joinedAtUnix() {return Date.parse(this.joinedAt);}
	get mention() {return (this.nick) ? `<@!${this.id}>` : this.user.mention;}
	get presence() {return this.client.presences.get(this.id, this.guildId);}
	get username() {return this.user.username;}
	get voiceChannel() {
		const voiceState = this.voiceState;
		return voiceState && voiceState.channel;
	}
	get voiceState() {return this.client.voiceStates.get(this.guildId, this.id);}

	get avatarURL() {return this.user.avatarURL;}
	get defaultAvatarURL() {return this.user.defaultAvatarURL;}

	get permissions() {return this.roles.reduce((total, role) => total | role.permissions, 0);}

	permissionsFor(channel) {
		if (typeof(channel) === 'string') {channel = this.client.channels.get(channel);}
		if (!channel) {return null;}

		const overwrites = {allow: 0, deny: 0};
		if (channel.permissionOverwrites.has(channel.guildId)) {
			const overwrite = channel.permissionOverwrites.get(channel.guildId);
			overwrites.allow |= overwrite.allow;
			overwrites.deny |= overwrite.deny;
		}

		this.roles.forEach((role) => {
			if (channel.permissionOverwrites.has(role.id)) {
				const overwrite = channel.permissionOverwrites.get(role.id);
				overwrites.allow |= overwrite.allow;
				overwrites.deny |= overwrite.deny;
			}
		});

		if (channel.permissionOverwrites.has(this.id)) {
			const overwrite = channel.permissionOverwrites.get(this.id);
			overwrites.allow |= overwrite.allow;
			overwrites.deny |= overwrite.deny;
		}

		return (this.permissions & ~overwrites.deny) | overwrites.allow;
	}
	
	can(permissions) {return Utils.Permissions.can(this.permissions, permissions);}

	avatarURLFormat(format) {return this.user.avatarURLFormat(format);}

	addRole(roleId) {return this.client.rest.addGuildMemberRole(this.guildId, this.id, roleId);}

	ban(query) {return this.client.rest.createGuildBan(this.guildId, this.id, query);}

	createDm() {return this.user.createDm();}
	createMessage(data) {return this.user.createMessage(data);}

	edit(data) {return this.client.rest.editGuildMember(this.guildId, this.id, data);}
	editNick(nick) {return (this.isMe) ? this.client.rest.editGuildNick(this.guildId, {nick}) : this.edit({nick});}

	remove() {return this.client.rest.removeGuildMember(this.guildId, this.id);}
	removeBan() {return this.client.rest.removeGuildBan(this.guildId, this.id);}
	removeRole(roleId) {return this.client.rest.removeGuildMemberRole(this.guildId, this.id, roleId);}

	move(channelId) {return this.edit({channel_id: channelId});}
	setDeaf(deaf) {return this.edit({deaf});}
	setMute(mute) {return this.edit({mute});}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'joined_at': {
				value = new Date(value);
			}; break;
			case 'roles': {
				this.roles.clear();

				const guild = this.guild;
				this.roles.set(this.guildId, (guild) ? guild.defaultRole : {id: this.guildId});
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
}

Member.defaults = defaults;
Member.ignore = ignore;
module.exports = Member;