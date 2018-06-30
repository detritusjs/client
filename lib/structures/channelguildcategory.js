const BaseCollection = require('../collections').BaseCollection;

const Structures = {ChannelGuildBase: require('./channelguildbase')};

const defaults = Object.assign({
	bitrate: null,
	user_limit: null
}, Structures.ChannelGuildBase.defaults);

class ChannelGuildCategory extends Structures.ChannelGuildBase {
	constructor(client, data) {
		super(client, data, defaults);
	}

	get children() {return new BaseCollection(this.client.channels.filter((channel) => channel.isGuildChannel && channel.parentId === this.id));}
}

ChannelGuildCategory.defaults = defaults;
ChannelGuildCategory.ignore = Structures.ChannelGuildBase.ignore;
module.exports = ChannelGuildCategory;