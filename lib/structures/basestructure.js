const Tools = require('../utils').Tools;

class BaseStructure {
	constructor(client, data, defaults, ignore) {
		Object.defineProperties(this, {
			client: {value: client},
			_defaults: {value: defaults},
			_ignore: {value: ignore || []}
		});

		if (!defaults) {return;}

		data = Object.assign({}, defaults, data);

		for (let key in data) {
			if (this._ignore.includes(key)) {continue;}
			this.mergeValue(key, data[key]);
		}
	}

	get shardId() {return this.client.shardId;}

	difference(key, value) {
		const camelKey = Tools.toCamelCase(key);
		const old = this[camelKey];
		const difference = {};
		if (old !== value) {
			difference[camelKey] = old;
		}
		return difference;
	}

	differences(data) {
		const obj = {};
		for (let key in data) {
			Object.assign(obj, this.difference(key, data[key]));
		}
		return obj;
	}

	mergeValue(key, value) {
		if (!(key in this._defaults)) {return;}
		if (value === undefined) {return;}

		Object.defineProperty(this, Tools.toCamelCase(key), {
			configurable: true,
			enumerable: true,
			value
		});
	}

	merge(data) {
		for (let key in data) {
			this.mergeValue(key, data[key]);
		}
	}

	toJSON() {
		const obj = {};
		for (let key in this._defaults) {
			obj[key] = this[Tools.toCamelCase(key)];
		}
		return obj;
	}
}

module.exports = BaseStructure;