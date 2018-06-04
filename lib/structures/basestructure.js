const Tools = require('../utils').Tools;

class BaseStructure
{
	constructor(client, data, defaults, ignore)
	{
		Object.defineProperties(this, {
			client: {value: client},
			_defaults: {value: defaults}
		});

		if (!defaults) {return;}

		data = Object.assign({}, defaults, data);

		ignore = ignore || [];
		for (let key in data) {
			if (ignore.includes(key)) {continue;}

			Object.defineProperty(this, Tools.toCamelCase(key), {
				enumerable: true,
				configurable: true,
				value: data[key]
			});
		}
	}

	get shardId() {return this.client.shardId;}

	differences(data)
	{
		const obj = {};
		for (let key in data) {
			const camelKey = Tools.toCamelCase(key);
			const value = this[camelKey];
			if (data[key] !== value) {
				obj[camelKey] = value;
			}
		}
		return obj;
	}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			Object.defineProperty(this, Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}

	toJSON()
	{
		const obj = {};
		for (let key in this._defaults) {
			obj[key] = this[Tools.toCamelCase(key)];
		}
		return obj;
	}
}

module.exports = BaseStructure;