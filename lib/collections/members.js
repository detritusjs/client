const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Members extends BaseCollection
{
	constructor(client, options)
	{
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {return Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});}

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
		if (!this.enabled || !super.has(guildId)) {return;}
		if (id) {
			const members = super.get(guildId);
			members.delete(id);
			if (!members.size) {
				super.delete(guildId);
			}
		} else {
			super.delete(guildId);
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