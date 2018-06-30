const BaseCollection = require('../collections').BaseCollection;

const Utils = require('../utils');

const Structures = {
	Channel: require('./channel'),
	Overwrite: require('./overwrite')
};

const defaults = Object.assign({
	guild_id: null,
	name: '',
	nsfw: false,
	parent_id: null,
	permission_overwrites: [],
	position: -1
}, Structures.Channel.defaults);

const ignore = ['permission_overwrites'];

class ChannelGuildBase extends Structures.Channel {
	constructor(client, data, def, ig) {
		super(client, data, def || defaults, ig || ignore);

		Object.defineProperties(this, {
			permissionOverwrites: {enumerable: true, configurable: false, value: new BaseCollection()}
		});

		this.merge({permission_overwrites: data.permission_overwrites});
	}

	get guild() {return this.client.guilds.get(this.guildId);}
	get parent() {return (this.parentId) ? this.client.channels.get(this.parentId) : null;}

	get canAddReactions() {return this.isText && this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ADD_REACTIONS']);}
	get canAttachFiles() {return this.isText && this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES']);}
	get canEmbedLinks() {return this.isText && this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS']);}
	get canMentionEveryone() {return this.isText && this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'MENTION_EVERYONE']);}
	get canSendTTSMessage() {return this.isText && this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES']);}
	get canUseExternalEmojis() {return this.isText && this.can(['VIEW_CHANNEL', 'SEND_MESSAGES', 'USE_EXTERNAL_EMOJIS']);}
	get canMessage() {return this.isText && this.can(['VIEW_CHANNEL', 'SEND_MESSAGES']);}
	get canReadHistory() {return this.isText && this.can(['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY']);}

	get canCreateInvite() {return !this.isCategory && this.can('CREATE_INSTANT_INVITE');}

	get canManageMessages() {return this.isText && this.can('MANAGE_MESSAGES');}
	get canManageWebhooks() {return this.isText && this.can('MANAGE_WEBHOOKS');}

	get canJoin() {return this.isVoice && this.can(['VIEW_CHANNEL', 'VOICE_CONNECT']);}
	get canSpeak() {return this.isVoice && this.can('VOICE_SPEAK');}
	get canMuteMembers() {return this.isVoice && this.can('VOICE_MUTE_MEMBERS');}
	get canDeafenMembers() {return this.isVoice && this.can('VOICE_DEAFEN_MEMBERS');}
	get canMoveMembers() {return this.isVoice && this.can('VOICE_MOVE_MEMBERS');}
	get canUseVAD() {return this.isVoice && this.can('VOICE_USE_VAD');}

	get canEdit() {return this.can('MANAGE_CHANNELS');}
	get canView() {return this.can('VIEW_CHANNEL');}

	can(permissions, member) {
		if (member === undefined) {member = this.client.members.get(this.guildId, this.client.user.id);}
		if (!member) {return null;}

		const guild = this.guild;
		if (guild && guild.isOwner(member.id)) {return true;}
		const total = member.permissionsFor(this);
		return Utils.Permissions.can(total, 'ADMINISTRATOR') || Utils.Permissions.can(total, permissions);
	}

	createInvite(data) {return this.client.rest.createInvite(this.id, data);}
	fetchInvites() {return this.client.rest.fetchChannelInvites(this.id);}
	//wont work with categories

	difference(key, value) {
		switch (key) {
			case 'permission_overwrites': {
				const old = this.permissionOverwrites;
				if (value.length === old.size && !old.size) {return;}
				return {permissionOverwrites: old.clone()};
			}; break;
		}

		return super.difference.call(this, key, value);
	}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'permission_overwrites': {
				this.permissionOverwrites.clear();
				for (let raw of value) {
					Object.assign(raw, {channel_id: this.id, guild_id: this.guildId});
					this.permissionOverwrites.set(raw.id, new Structures.Overwrite(this.client, raw));
				}
			}; return;
		}
		super.mergeValue.call(this, key, value);
	}
}


ChannelGuildBase.defaults = defaults;
ChannelGuildBase.ignore = ignore;
module.exports = ChannelGuildBase;