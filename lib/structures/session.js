const BaseStructure = require('./basestructure');

const defaults = {
	client_info: {},
	game: null,
	session_id: null,
	status: 'offline'
};

class Session extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults);
	}
}

module.exports = Session;