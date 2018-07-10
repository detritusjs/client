const Structures = {
	User: require('./user')
};

const defaults = Object.assign({
	email: null,
	locale: null,
	mfa_enabled: false,
	verified: false
}, Structures.User.defaults);

class UserFull extends Structures.User {
	constructor(client, data) {
		super(client, data, defaults);
	}

	get isClaimed() {return !this.bot && !!this.email;}
}

module.exports = UserFull;