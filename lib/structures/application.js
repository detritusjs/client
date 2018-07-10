const BaseStructure = require('./basestructure');

const CDN = require('../utils').Constants.Endpoints.CDN;

const defaults = {
	aliases: null,
	application_id: null,
	developers: null,
	distributor_applications: null,
	executables: null,
	id: null,
	icon: null,
	name: null,
	publishers: null,
	splash: null,
	summary: null,
	youtube_trailer_video_id: null
};

class Application extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults);
	}

	get iconURL() {return this.iconURLFormat();}
	get splashURL() {return this.splashURLFormat();}

	iconURLFormat(format) {
		if (!format) {
			format = (this.client.options.imageFormat || 'png').toLowerCase();
		}

		const valid = ['png', 'jpg', 'jpeg', 'webp'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return CDN.URL + CDN.GAME_ICON(this.id, this.icon, format);
	}

	splashURLFormat(format) {
		if (!this.splash) {return null;}

		if (!format) {
			format = (this.client.options.imageFormat || 'png').toLowerCase();
		}

		const valid = ['png', 'jpg', 'jpeg', 'webp'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return CDN.URL + CDN.GAME_ICON(this.id, this.splash, format);
	}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		if (!value) {return;}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = Application;