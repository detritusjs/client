const User = require('./user');

const defaults = Object.assign({
	email: null,
	mfa_enabled: false,
	verified: false
}, User.defaults);

class UserFull extends User
{
	constructor(client, data) {super(client, data, defaults);}

	get isClaimed() {return !this.bot && !!this.email;}
}

module.exports = UserFull;