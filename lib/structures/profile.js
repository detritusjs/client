const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Structures = {
	ProfileConnectedAccount: require('./profileconnectedaccount')
};

const UserFlags = require('../utils').Constants.Discord.UserFlags;

const defaults = {
	connected_accounts: [],
	flags: 0,
	mutual_guilds: [],
	nicks: [],
	premium_since: null,
	user: {}
};

const ignore = ['connected_accounts', 'mutual_guilds'];

class Profile extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		Object.defineProperties(this, {
			connectedAccounts: {enumerable: true, value: new BaseCollection()},
			mutualGuilds: {enumerable: true, value: new BaseCollection()},
			nicks: {enumerable: true, value: new BaseCollection()}
		});

		this.merge({
			connected_accounts: data.connected_accounts,
			mutual_guilds: data.mutual_guilds
		});
	}

	get hasNitro() {return !!this.premiumSince;}

	get hasStaff() {return (this.flags & UserFlags.STAFF) === UserFlags.STAFF;}
	get hasPartner() {return (this.flags & UserFlags.PARTNER) === UserFlags.PARTNER;}
	get hasHypesquad() {return (this.flags & UserFlags.HYPESQUAD) === UserFlags.HYPESQUAD;}
	get hasBugHunter() {return (this.flags & UserFlags.BUG_HUNTER) === UserFlags.BUG_HUNTER;}
	get hasMFASMS() {return (this.flags & UserFlags.MFA_SMS) === UserFlags.MFA_SMS;}
	get hasPremiumPromoDismissed() {return (this.flags & UserFlags.PREMIUM_PROMO_DISMISSED) === UserFlags.PREMIUM_PROMO_DISMISSED;}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch(key) {
			case 'connected_accounts': {
				this.connectedAccounts.clear();

				for (let raw of value) {
					const account = new Structures.ProfileConnectedAccount(this, raw);
					this.connectedAccounts.set(account.id, account);
				}
			}; return;
			case 'mutual_guilds': {
				this.mutualGuilds.clear();
				this.nicks.clear();

				for (let raw of value) {
					let guild;
					if (this.client.guilds.has(raw.id)) {
						guild = this.client.guilds.get(raw.id);
					} else {
						guild = {id: raw.id};
					}

					this.mutualGuilds.set(guild.id, guild);
					this.nicks.set(raw.id, raw.nick);
				}
			}; return;
			case 'user': {
				let user;
				if (this.client.users.has(value.id)) {
					user = this.client.users.get(value.id);
					user.merge(value);
				} else {
					user = new Structures.User(this.client, value);
					this.client.users.insert(user);
				}

				this.merge({flag: value.flag});
				value = user;
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = Profile;