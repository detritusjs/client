'use strict';

class BaseCollection extends Map {
	constructor(iterable, defaultKey) {
		if (iterable instanceof Map) {
			super(iterable.entries());
		} else {
			defaultKey = (defaultKey === undefined) ? 'id' : defaultKey;

			if (defaultKey) {
				super();
			} else {
				super(iterable);
			}

			if (defaultKey && iterable) {
				for (let value of iterable) {
					this.set(value[defaultKey], value);
				}
			}
		}
	}

	clone() {
		return new BaseCollection(this.entries(), null);
	}

	every(func) {
		return this.toArray().every(func);
	}

	filter(key, value) {
		const func = (typeof(key) === 'function') ? key : (v) => v[key] === value;

		const map = [];
		for (let value of this.values()) {
			if (func(value)) {
				map.push(value);
			}
		}
		return map;
	}

	find(func) {
		for (let value of this.values()) {
			if (func(value)) {
				return value;
			}
		}
	}

	first() {
		return this.values().next().value;
	}

	map(func) {
		const map = [];
		for (let value of this.values()) {
			map.push(func(value));
		}
		return map;
	}

	reduce(cb, initialValue) {
		return this.toArray().reduce(cb, initialValue);
	}

	some(func) {
		for (let value of this.values()) {
			if (func(value)) {
				return true;
			}
		}
		return false;
	}
	
	toArray() {
		return Array.from(this.values());
	}

	toJSON() {
		return this.toArray();
	}

	toString() {
		return `BaseCollection (${this.size} items)`;
	}
}

module.exports = BaseCollection;