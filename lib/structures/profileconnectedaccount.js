const BaseStructure = require('./basestructure');

const ProviderIds = require('../utils').Constants.Discord.ProviderIds;

const defaults = {
	id: null,
	name: null,
	type: null,
	verified: false
};

class ProfileConnectedAccount extends BaseStructure {
	constructor(profile, data) {
		super(profile.client, data, defaults);
		Object.defineProperty(this, 'profile', {value: profile});
	}

	get url() {return this.URL;}
	get URL() {
		let url;

		switch (this.type) {
			case ProviderIds.BATTLENET: url = ''; break;
			case ProviderIds.FACEBOOK: url = `https://www.facebook.com/${this.id}`; break;
			case ProviderIds.LEAGUE_OF_LEGENDS: url = ''; break;
			case ProviderIds.REDDIT: url = `https://www.reddit.com/u/${this.name}`; break;
			case ProviderIds.SKYPE: url = `skype:${this.id}?userinfo`; break;
			case ProviderIds.SPOTIFY: url = `https://open.spotify.com/user/${this.id}`; break;
			case ProviderIds.STEAM: url = `https://steamcommunity.com/profiles/${this.id}`; break;
			case ProviderIds.TWITCH: url = `https://www.twitch.tv/${this.name}`; break;
			case ProviderIds.TWITTER: url = `https://twitter.com/${this.name}`; break;
			case ProviderIds.XBOX: url = ''; break;
			case ProviderIds.YOUTUBE: url = `https://www.youtube.com/channel/${this.id}`; break;
			default: url = '';
		}

		return url;
	}
}

module.exports = ProfileConnectedAccount;