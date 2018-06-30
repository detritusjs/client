const BaseStructure = require('./basestructure');

const Utils = require('../utils');
const Constants = Utils.Constants;

const defaults = {
	id: null,
	type: Constants.Discord.ChannelTypes.BASE
};

class Channel extends BaseStructure{
	constructor(client, data, def, ignore) {
		super(client, data, def || defaults, ignore);
	}

	get createdAt() {return new Date(this.createdAtUnix);}
	get createdAtUnix() {return Utils.Snowflake.timestamp(this.id);}
	get mention() {return `<#${this.id}>`;}
	
	get isDm() {return this.isDmSingle || this.isDmGroup;}
	get isDmSingle() {return this.type === Constants.Discord.ChannelTypes.DM;}
	get isDmGroup() {return this.type === Constants.Discord.ChannelTypes.GROUP_DM;}

	get isGuildChannel() {return this.isCategory || this.isText || this.isVoice;}
	get isCategory() {return this.type === Constants.Discord.ChannelTypes.GUILD_CATEGORY;}
	get isText() {return this.type === Constants.Discord.ChannelTypes.GUILD_TEXT;}
	get isVoice() {return this.type === Constants.Discord.ChannelTypes.GUILD_VOICE;}

	get canAddReactions() {return this.canMessage;}
	get canAttachFiles() {return this.canMessage;}
	get canEmbedLinks() {return this.canMessage;}
	get canMentionEveryone() {return this.canMessage;}
	get canSendTTSMessage() {return this.canMessage && !this.isDm;}
	get canMessage() {return this.isDm || this.isText;}
	
	get canJoin() {return this.isDm || this.isVoice;}
	get canSpeak() {return this.isDm || this.isVoice;}

	get canEdit() {return this.isDm;}
	get canManageMessages() {return false;}
	get canView() {return this.isDm;}

	delete() {return this.client.rest.deleteChannel(this.id);}
	edit(data) {return this.client.rest.editChannel(this.id, data);}

	toString() {return (this.isDmSingle) ? 'DM Channel' : `#${this.name}`;}
}

Channel.defaults = defaults;
module.exports = Channel;

const Structures = {
	ChannelGuildCategory: require('./channelguildcategory'),
	ChannelDM: require('./channeldm'),
	ChannelDMGroup: require('./channeldmgroup'),
	ChannelGuildText: require('./channelguildtext'),
	ChannelGuildVoice: require('./channelguildvoice')
};

Channel.create = function(client, data) {
	let Class = Channel;
	switch (data.type) {
		case Constants.Discord.ChannelTypes.GUILD_TEXT:     Class = Structures.ChannelGuildText; break;
		case Constants.Discord.ChannelTypes.DM:             Class = Structures.ChannelDM; break;
		case Constants.Discord.ChannelTypes.GUILD_VOICE:    Class = Structures.ChannelGuildVoice; break;
		case Constants.Discord.ChannelTypes.GROUP_DM:       Class = Structures.ChannelDMGroup; break;
		case Constants.Discord.ChannelTypes.GUILD_CATEGORY: Class = Structures.ChannelGuildCategory; break;
	}
	return new Class(client, data);
};