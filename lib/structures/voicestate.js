const BaseStructure = require('./basestructure');

const Structures = {Member: require('./member')};

const Tools = require('../utils').Tools;

const defaults = {
	channel_id: null,
	deaf: false,
	guild_id: null,
	member: null,
	mute: false,
	self_deaf: false,
	self_mute: false,
	self_video: false,
	session_id: null,
	suppress: false,
	user_id: null
};

class VoiceState extends BaseStructure
{
	constructor(client, data)
	{
		super(client, data, defaults, ['member']);
		this.merge({member: data.member});
	}

	get serverId() {return this.guildId || this.channelId;}

	get channel() {return (this.channelId) ? this.client.channels.get(this.channelId) : null;}
	get guild() {return (this.guildId) ? this.client.guilds.get(this.guildId) : null;}
	get member() {return (this.guildId) ? this.client.members.get(this.guildId, this.userId) : null;}
	get user() {return this.client.users.get(this.userId);}

	edit(data)
	{
		if (!this.guildId) {return Promise.reject(new Error('Cannot edit a user in a DM Call.'));}
		return this.client.rest.editMember(this.guildId, this.userId, data);
	}

	joinVoice(options) {return this.client.voiceConnect(this.guildId, this.channelId, options);}

	move(channelId) {return this.edit({channel_id: channelId});}
	setDeaf(deaf) {return this.edit({deaf});}
	setMute(mute) {return this.edit({mute});}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'member': {
					Object.assign(data[key], {guild_id: this.guildId});

					let member;
					if (this.client.members.has(data[key].guild_id, data[key].user.id)) {
						member = this.client.members.get(data[key].guild_id, data[key].user.id);
					} else {
						member = new Structures.Member(this.client, data[key]);
						this.client.members.insert(member);
					}
					data[key] = member;
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

module.exports = VoiceState;