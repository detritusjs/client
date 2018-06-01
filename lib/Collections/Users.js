const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true,
	expire: false
};

class Users extends BaseCollection
{
	constructor(client, options)
	{
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = options || {};
		Object.keys(defaults).forEach((key) => {
			const set = this['set' + key.slice(0, 1).toUpperCase() + key.slice(1).toLowerCase()];
			set.call(this, (options[key] === undefined) ? defaults[key] : options[key]);
		});
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}
	setExpire(enabled) {return Object.defineProperty(this, 'expire', {enumerable: true, configurable: true, value: !!enabled});}

	insert(user) {return (this.enabled) ? this.set(user.id, user) : false;} //expire offline users if enabled
	fetch(id) {return this.client.rest.endpoints.fetchUser(id);}

	clear(shardId)
	{
		if (this.client.shardCount === 1 || shardId === undefined) {return super.clear.call(this);}
		for (let user of this.values()) {
			if (user.client.shardId === shardId) {
				this.delete(user.id);
			}
		}
	}

	toString() {return `${this.size} Users`;}
}

module.exports = Users;