const BaseStructure = require('./basestructure');

const Utils = require('../utils');
const Constants = Utils.Constants;

const defaults = {
	id: null,
	type: Constants.Discord.ChannelTypes.BASE
};

class Channel extends BaseStructure
{
	constructor(client, data, def) {super(client, data, def || defaults);}

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

	delete() {return this.client.rest.endpoints.deleteChannel(this.id);}
	edit(data) {return this.client.rest.endpoints.editChannel(this.id, data);}

	toString() {return (this.isDmSingle) ? 'DM Channel' : `#${this.name}`;}
}

Channel.defaults = defaults;
module.exports = Channel;

const Structures = {
	ChannelCategory: require('./channelcategory'),
	ChannelDM: require('./channeldm'),
	ChannelDMGroup: require('./channeldmgroup'),
	ChannelText: require('./channeltext'),
	ChannelVoice: require('./channelvoice')
};

Channel.create = function(client, data) {
	let Class = Channel;
	switch (data.type) {
		case Constants.Discord.ChannelTypes.GUILD_TEXT:     Class = Structures.ChannelText; break;
		case Constants.Discord.ChannelTypes.DM:             Class = Structures.ChannelDM; break;
		case Constants.Discord.ChannelTypes.GUILD_VOICE:    Class = Structures.ChannelVoice; break;
		case Constants.Discord.ChannelTypes.GROUP_DM:       Class = Structures.ChannelDMGroup; break;
		case Constants.Discord.ChannelTypes.GUILD_CATEGORY: Class = Structures.ChannelCategory; break;
	}
	return new Class(client, data);
};