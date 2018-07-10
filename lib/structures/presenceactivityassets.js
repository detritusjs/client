const BaseStructure = require('./basestructure');

const CDN = require('../utils').Constants.Endpoints.CDN;

const defaults = {
	large_image: null,
	large_text: null,
	small_image: null,
	small_text: null
};

class PresenceActivityAssets extends BaseStructure {
	constructor(activity, data) {
		super(activity.client, data, defaults);
		Object.defineProperty(this, 'activity', {value: activity});
	}

	get imageURL() {return this.imageURLFormat();}
	get largeImageURL() {return this.largeImageURLFormat();}
	get smallImageURL() {return this.smallImageURLFormat();}

	imageURLFormat(format, hash) {
		if (hash === undefined) {hash = this.largeImage || this.smallImage;}
		if (!hash) {return null;}

		const parts = hash.split(':');
		const type = (parts.length === 1) ? 'discord' : parts.shift();
		const id = parts.shift();

		if (!format) {
			format = (this.client.options.imageFormat || 'png').toLowerCase();
		}

		const valid = ['png', 'jpg', 'jpeg', 'webp'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}

		switch (type) {
			case 'discord': {
				return CDN.URL + CDN.APP_ASSETS(this.activity.applicationId, id, format);
			};
			case 'spotify': {
				return CDN.ACTIVITY.SPOTIFY(id);
			};
			default: {throw new Error(`Unsupported type ${type}`);}
		}
	}

	largeImageURLFormat(format) {return this.imageURLFormat(format, this.largeImage || null);}
	smallImageURLFormat(format) {return this.imageURLFormat(format, this.smallImage || null);}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		if (!value) {return;}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = PresenceActivityAssets;