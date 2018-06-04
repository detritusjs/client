const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Users extends BaseCollection
{
	constructor(client, options)
	{
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

	insert(user) {return (this.enabled) ? this.set(user.id, user) : false;}

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