'use strict';

class BaseCollection extends Map
{
	constructor(iterable, defaultKey)
	{
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

	clone() {return new BaseCollection(this.entries(), null);}
	every(func) {return this.toArray().every(func);}
	first() {return this.values().next().value;}
	reduce(cb, initialValue) {return this.toArray().reduce(cb, initialValue);}


	filter(key, value)
	{
		const func = (typeof(key) === 'function') ? key : (v) => v[key] === value;

		const map = [];
		for (let value of this.values()) {
			if (func(value)) {map.push(value);}
		}
		return map;
	}

	find(func)
	{
		for (let value of this.values()) {
			if (func(value)) {
				return value;
			}
		}
	}

	map(func)
	{
		const map = [];
		for (let value of this.values()) {
			map.push(func(value));
		}
		return map;
	}

	some(func)
	{
		for (let value of this.values()) {
			if (func(value)) {
				return true;
			}
		}
		return false;
	}
	
	toArray() {return Array.from(this.values());}
	toJSON() {return this.toArray();}
}

module.exports = BaseCollection;