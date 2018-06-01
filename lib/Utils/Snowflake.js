const Constants = require('./constants');

const bits = {
	workerId: 5,
	processId: 5,
	sequence: 12
};

const max = {
	timestamp: 0x40000000000,
	workerId: -1 ^ (-1 << bits.workerId),
	processId: -1 ^ (-1 << bits.processId),
	sequence: -1 ^ (-1 << bits.sequence),
	middle: -1 ^ (-1 << (bits.workerId + bits.processId + bits.sequence))
};

const cache = {sequence: 0};

const defaults = {
	epoch: Constants.Discord.Epoch.SNOWFLAKE,
	workerId: 0,
	processId: 0
};

module.exports = {
	generate(options) {
		options = Object.assign({timestamp: Date.now()}, defaults, options);

		const snowflake = {id: ''};

		snowflake.timestamp = (options.timestamp - options.epoch) % max.timestamp;

		snowflake.workerId = options.workerId & max.workerId;
		snowflake.processId = options.processId & max.processId;
		if (options.sequence === undefined) {
			snowflake.sequence = cache.sequence = ++cache.sequence & max.sequence;
		} else {
			snowflake.sequence = options.sequence & max.sequence;
		}
		
		let timestamp = snowflake.timestamp.toString(2).padStart(42, '0');
		let workerId = snowflake.workerId.toString(2).padStart(5, '0');
		let processId = snowflake.processId.toString(2).padStart(5, '0');
		let sequence = snowflake.sequence.toString(2).padStart(12, '0');

		let binary = snowflake.binary = timestamp + workerId + processId + sequence;

        //thanks discord.js
        while (binary.length > 50) {
            const high = parseInt(binary.slice(0, -32), 2);
            const low = parseInt((high % 10).toString(2) + binary.slice(-32), 2);

            snowflake.id = (low % 10).toString() + snowflake.id;
            binary = Math.floor(high / 10).toString(2) + Math.floor(low / 10).toString(2).padStart(32, '0');
        }

        binary = parseInt(binary, 2);
        while (binary > 0) {
            snowflake.id = (binary % 10).toString() + snowflake.id;
            binary = Math.floor(binary / 10);
        }
        
        return snowflake;
	},
	deconstruct(id, options) {
		options = Object.assign({epoch: defaults.epoch}, options);

		const snowflake = {id};

		snowflake.binary = '';

		//thanks discord.js
		let high = parseInt(id.slice(0, -10)) || 0;
		let low = parseInt(id.slice(-10));
		while (low > 0 || high > 0) {
			snowflake.binary = (low & 1).toString() + snowflake.binary;
			low = Math.floor(low / 2);
			if (high > 0) {
				low += 5000000000 * (high % 2);
				high = Math.floor(high / 2);
			}
		}

		snowflake.binary = snowflake.binary.toString(2).padStart(64, '0');
		snowflake.timestamp = parseInt(snowflake.binary.slice(0, 42), 2) + options.epoch;
		snowflake.workerId = parseInt(snowflake.binary.slice(42, 47), 2);
		snowflake.processId = parseInt(snowflake.binary.slice(47, 52), 2);
		snowflake.sequence = parseInt(snowflake.binary.slice(52, 64), 2);
		return snowflake;
	},
	timestamp(id, options) {
		options = Object.assign({epoch: defaults.epoch}, options);
		return (id) ? parseInt((+id / max.middle) + options.epoch) : 0;
	}
};