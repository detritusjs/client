const BaseCollection = require('../collections').BaseCollection;

const Structures = {
	ChannelDM: require('./channeldm'),
	User: require('./user')
};

const Constants = require('../utils').Constants;

const defaults = Object.assign({
	application_id: null,
	icon: null,
	name: '',
	owner_id: null
}, Structures.ChannelDM.defaults);

class ChannelDMGroup extends Structures.ChannelDM
{
	constructor(client, data)
	{
		super(client, data, defaults);
	}

	get owner() {return this.client.users.get(this.ownerId);}

	iconURLFormat(format)
	{
		if (!this.icon) {return Constants.Rest.Endpoints.CDN.URL + Constants.Rest.Endpoints.CDN.DM_GROUP;}

		format = (format || this.client.options.imageFormat || 'png').toLowerCase();
		const valid = ['jpeg', 'jpg', 'png', 'webp'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return Constants.Rest.Endpoints.CDN.URL + Constants.Rest.Endpoints.CDN.DM_ICON(this.id, this.icon, format);
	}

	addRecipient(userId, data) {return this.client.rest.addRecipient(this.id, userId, data);}

	removeRecipient(userId) {return this.client.rest.removeRecipient(this.id, userId);}
}

module.exports = ChannelDMGroup;