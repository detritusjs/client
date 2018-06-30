const BaseStructure = require('./basestructure');

const Structures = {Member: require('./member')};

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

const ignore = ['member'];

class VoiceState extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);
		this.merge({member: data.member});
	}

	get serverId() {return this.guildId || this.channelId;}

	get channel() {return (this.channelId) ? this.client.channels.get(this.channelId) : null;}
	get guild() {return (this.guildId) ? this.client.guilds.get(this.guildId) : null;}
	get member() {return (this.guildId) ? this.client.members.get(this.guildId, this.userId) : null;}
	get user() {return this.client.users.get(this.userId);}

	edit(data) {
		if (!this.guildId) {return Promise.reject(new Error('Cannot edit a user in a DM Call.'));}
		return this.client.rest.editMember(this.guildId, this.userId, data);
	}

	joinVoice(options) {return this.client.voiceConnect(this.guildId, this.channelId, options);}

	move(channelId) {return this.edit({channel_id: channelId});}
	setDeaf(deaf) {return this.edit({deaf});}
	setMute(mute) {return this.edit({mute});}

	difference(key, value) {
		switch (key) {
			case 'member': return;
		}

		return super.difference.call(this, key, value);
	}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'member': {
				//uses a getter because voice states from guild create dont have the member object
				if (this.client.members.has(this.guildId, value.user.id)) {
					this.client.members.get(this.guildId, value.user.id).merge(value);
				} else {
					Object.assign(value, {guild_id: this.guildId});
					this.client.members.insert(new Structures.Member(this.client, value));
				}
			}; return;
		}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = VoiceState;