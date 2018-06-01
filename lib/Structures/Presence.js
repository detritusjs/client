const Crypto = require('crypto');
const BaseStructure = require('./basestructure');
const Tools = require('../utils').Tools;

const defaults = {
	game: null,
	status: ''
};

class Presence extends BaseStructure
{
	constructor(client, data)
	{
		data = {game: data.game, status: data.status};
		super(client, data, defaults, ['game']);
		this.merge({game: data.game});
	}

	equals(presence) {return this.hash === presence.hash;}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'game': {
					if (data[key] && !Object.keys(data[key]).length) {
						data[key] = null;
					}
				}; break;
			}

			Object.defineProperty(this, Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}

		Object.defineProperty(this, 'hash', {
			configurable: true,
			enumerable: true,
			value: Crypto.createHash('md5').update(this.toString()).digest('hex')
		});
	}

	toString() {return ['PRESENCE', this.status, this.game && JSON.stringify(this.game)].filter((v) => v).join('.');}
}

module.exports = Presence;