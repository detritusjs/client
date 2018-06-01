const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true,
	expire: false
};

class Members extends BaseCollection
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

	get size() {return this.reduce((size, cache) => size + cache.size, 0);}

	insert(member)
	{
		if (!this.enabled) {return;}

		let cache;
		if (super.has(member.guildId)) {
			cache = super.get(member.guildId);
		} else {
			cache = new BaseCollection();
			super.set(member.guildId, cache);
		}
		cache.set(member.id, member);
	}

	delete(guildId, id)
	{
		if (!this.enabled) {return;}
		if (super.has(guildId)) {
			return (id) ? super.get(guildId).delete(id) : super.delete(guildId);
		} else {
			//search each
		}
	}

	get(guildId, id)
	{
		if (!this.enabled || !super.has(guildId)) {return null;}
		return (id) ? super.get(guildId).get(id) : super.get(guildId);
	}

	has(guildId, id)
	{
		if (!this.enabled || !super.has(guildId)) {return false;}
		return (id) ? this.get(guildId).has(id) : true;
	}

	fetch(guildId, id) {return this.client.rest.endpoints.fetchMember(guildId, id);}

	clear(shardId)
	{
		if (this.client.shardCount === 1 || shardId === undefined) {return super.clear.call(this);}
		for (let members of this.values()) {
			const first = members.first();
			if (first.client.shardId === shardId) {
				this.delete(first.guildId);
			}
		}
	}

	toString() {return `${this.size} Members`;}
}

module.exports = Members;