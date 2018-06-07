const Crypto = require('crypto');
const BaseStructure = require('./basestructure');

const defaults = {
	game: null,
	status: ''
};

const ignore = ['game'];

class Presence extends BaseStructure
{
	constructor(client, data)
	{
		super(client, {}, defaults, ignore);
		this.merge({game: data.game, status: data.status});
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

			this.mergeValue(key, data[key]);
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