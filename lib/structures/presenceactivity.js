const BaseStructure = require('./basestructure');

const Structures = {
	PresenceActivityAssets: require('./presenceactivityassets'),
	PresenceActivityParty: require('./presenceactivityparty'),
	PresenceActivityTimestamps: require('./presenceactivitytimestamps')
};

const ActivityTypes = require('../utils').Constants.Gateway.Gateway.ActivityTypes;

const defaults = {
	application_id: null,
	assets: null,
	details: null,
	flags: 0,
	name: null,
	party: null,
	session_id: null,
	state: null,
	sync_id: null,
	timestamps: null,
	type: null,
	url: null
};

const xboxApplicationId = '438122941302046720';

class PresenceActivity extends BaseStructure {
	constructor(presence, data) {
		super(presence.client, data, defaults);
		Object.defineProperty(this, 'presence', {value: presence});
	}

	get application() {return this.client.applications.find((application) => application.name === this.name);}

	get isPlaying() {return this.type === ActivityTypes.PLAYING;}
	get isStreaming() {return this.type === ActivityTypes.STREAMING;}
	get isListening() {return this.type === ActivityTypes.LISTENING;}
	get isWatching() {return this.type === ActivityTypes.WATCHING;}

	get typeText() {
		switch (this.type) {
			case ActivityTypes.PLAYING: return 'Playing';
			case ActivityTypes.STREAMING: return 'Streaming';
			case ActivityTypes.LISTENING: return 'Listening to';
			case ActivityTypes.WATCHING: return 'Watching';
			default: return 'Unknown';
		}
	}

	get imageURL() {return this.imageURLFormat();}
	
	imageURLFormat(format) {
		if (this.assets) {
			return this.assets.imageURLFormat(format);
		}

		const application = this.application;
		return (application) ? application.iconURLFormat(format) : null;
	}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		if (value === null) {return;}

		switch (key) {
			case 'assets': {
				value = new Structures.PresenceActivityAssets(this, value);
			}; break;
			case 'party': {
				value = new Structures.PresenceActivityParty(this, value);
			}; break;
			case 'timestamps': {
				value = new Structures.PresenceActivityTimestamps(this, value);
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}

	toString() {return `${this.typeText} ${this.name}`;}
}

module.exports = PresenceActivity;