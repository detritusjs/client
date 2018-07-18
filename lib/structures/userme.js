const Structures = {
	User: require('./user')
};

const UserFlags = require('../utils').Constants.Discord.UserFlags;

const defaults = Object.assign({
	email: null,
	flags: 0,
	mfa_enabled: false,
	mobile: false,
	phone: null,
	premium: false,
	verified: false
}, Structures.User.defaults);

class UserMe extends Structures.User {
	constructor(client, data) {
		super(client, data, defaults);
	}

	get hasNitro() {return this.premium;}

	get hasStaff() {return (this.flags & UserFlags.STAFF) === UserFlags.STAFF;}
	get hasPartner() {return (this.flags & UserFlags.PARTNER) === UserFlags.PARTNER;}
	get hasHypesquad() {return (this.flags & UserFlags.HYPESQUAD) === UserFlags.HYPESQUAD;}
	get hasBugHunter() {return (this.flags & UserFlags.BUG_HUNTER) === UserFlags.BUG_HUNTER;}
	get hasMFASMS() {return (this.flags & UserFlags.MFA_SMS) === UserFlags.MFA_SMS;}
	get hasPremiumPromoDismissed() {return (this.flags & UserFlags.PREMIUM_PROMO_DISMISSED) === UserFlags.PREMIUM_PROMO_DISMISSED;}

	get isClaimed() {return !this.bot && !!this.email;}
}

module.exports = UserMe;