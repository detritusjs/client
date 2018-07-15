const Constants = require('detritus-utils').Constants;

const Gateway = require('detritus-websocket').Utils.Constants;
const Rest = require('detritus-client-rest').Utils.Constants;

const VERSION = '0.0.5';
module.exports = Object.assign({}, Constants, Gateway, Rest, {
	VERSION,
	ApiVersions: Object.assign({}, Gateway.ApiVersions, Rest.ApiVersions),
	Versions: {
		CLIENT: VERSION,
		GATEWAY: Gateway.VERSION,
		REST: Rest.VERSION
	},
	Detritus: {
		MessageCacheTypes: ['global', 'guild', 'channel'],
		Command: {
			Errors: {
				GENERAL: 0,
				RATELIMIT: 1,
				RAN: 2
			},
			RatelimitTypes: ['guild', 'channel', 'user']
		}
	}
});