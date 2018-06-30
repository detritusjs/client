const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Users extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	insert(user) {
		if (!this.enabled) {return;}
		this.set(user.id, user);
	}

	toString() {return `${this.size} Users`;}
}

module.exports = Users;