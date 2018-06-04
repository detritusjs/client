const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Structures = {User: require('./user')};

const Tools = require('../utils').Tools;

const defaults = {
	deaf: false,
	guild_id: null,
	joined_at: '',
	mute: false,
	nick: null,
	roles: [],
	user: {}
};

class Member extends BaseStructure
{
	constructor(client, data)
	{
		super(client, data, defaults, ['roles', 'joined_at', 'user']);

		Object.defineProperties(this, {
			roles: {enumerable: true, configurable: false, value: new BaseCollection()}
		});
		
		this.merge({
			joined_at: data.joined_at,
			roles: data.roles,
			user: data.user
		});
	}

	get id() {return this.user.id;}
	get bot() {return this.user.bot;}
	get createdAt() {return this.user.createdAt;}
	get createdAtUnix() {return this.user.createdAtUnix;}
	get discriminator() {return this.user.discriminator;}
	get joinedAtUnix() {return Date.parse(this.joinedAt);}
	get mention() {return (this.nick) ? `<@!${this.id}>` : this.user.mention;}
	get username() {return this.user.username;}
	get voiceChannel()
	{
		const voiceState = this.voiceState;
		return voiceState && voiceState.channel;
	}
	get voiceState() {return this.client.voiceStates.get(this.guildId, this.id);}

	get avatarURL() {return this.user.avatarURL;}
	get defaultAvatarURL() {return this.user.defaultAvatarURL;}
	
	get guild() {return this.client.guilds.get(this.guildId);}

	avatarURLFormat(format) {return this.user.avatarURLFormat(format);}

	addRole(roleId) {return this.client.rest.addMemberRole(this.guildId, this.id, roleId);}

	ban(query) {return this.client.rest.createBan(this.guildId, this.id, query);}

	edit(data) {return this.client.rest.editMember(this.guildId, this.id, data);}
	editNick(nick) {return (this.id === this.client.user.id) ? this.client.rest.editNick({nick}) : this.edit({nick});}

	remove() {return this.client.rest.removeGuildMember(this.guildId, this.id);}
	removeBan() {return this.client.rest.removeGuildBan(this.guildId, this.id);}
	removeRole(roleId) {return this.client.rest.removeMemberRole(this.guildId, this.id, roleId);}

	move(channelId) {return this.edit({channel_id: channelId});}
	setDeaf(deaf) {return this.edit({deaf});}
	setMute(mute) {return this.edit({mute});}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'joined_at': {
					data[key] = new Date(data[key]);
				}; break;
				case 'roles': {
					this.roles.clear();
					const guild = this.guild;
					for (let id of data[key]) {
						this.roles.set(id, (guild) ? guild.roles.get(id) : {id});
					}
				}; continue;
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

			Object.defineProperty(this, Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}
}

module.exports = Member;