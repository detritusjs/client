const ArgumentsParser = require('./argumentsparser');

const defaults = {
	aliases: [],
	disableDm: false,
	disableDmReply: false,
	ratelimit: null,
	responseOptional: false
};

const ratelimitDefaults = {
	duration: 5000,
	limit: 5,
	type: 'user'
};

class Command {
	constructor(commandClient, info) {
		Object.defineProperties(this, {
			commandClient: {value: commandClient},
			client: {value: commandClient.client}
		});

		info = Object.assign({}, defaults, info);
		
		Object.defineProperties(this, {
			name: {enumerable: true, value: info.name.toLowerCase()},
			aliases: {enumerabe: true, value: info.aliases.map((alias) => alias.toLowerCase())},
			label: {enumerable: true, value: (info.label || info.name).toLowerCase()},
			args: {enumerable: true, value: new ArgumentsParser(info.args)}
		});

		if (info.ratelimit) {
			const settings = {};
			Object.keys(ratelimitDefaults).forEach((key) => {
				settings[key] = (info.ratelimit[key] === undefined) ? ratelimitDefaults[key] : info.ratelimit[key];
			});
			info.ratelimit = {settings, cache: new Map()};
		}

		Object.defineProperties(this, {
			disableDm: {enumerable: true, value: !!info.disableDm},
			disableDmReply: {enumerale: true, value: !!info.disableDmReply},
			responseOptional: {enumerable: true, value: !!info.responseOptional},
			ratelimit: {enumerable: true, value: info.ratelimit}
		});

		this.options = Object.assign({}, info.options);

		Object.defineProperties(this, {
			onBefore: {writable: true, value: info.onBefore},
			onCancel: {writable: true, value: info.onCancel},
			run: {writable: true, value: info.run},
			onSuccess: {writable: true, value: info.onSuccess},
			onRunError: {writable: true, value: info.onRunError},
			onError: {writable: true, value: info.onError},
			onRatelimit: {wrtiable: true, value: info.onRatelimit}
		});
	}

	check(name) {
		return name === this.name || this.aliases.includes(name);
	}

	getArgs(args) {
		const parsed = this.args.parse(args);
		parsed[this.label] = args.join(' ');
		return parsed;
	}

	getRatelimit(id) {
		if (!this.ratelimit) {return;}
		
		let ratelimit;
		if (this.ratelimit.cache.has(id)) {
			ratelimit = this.ratelimit.cache.get(id);
		} else {
			ratelimit = {
				start: Date.now(),
				usages: 0,
				timeout: setTimeout(this.ratelimit.cache.delete.bind(this.ratelimit.cache, id), this.ratelimit.settings.duration)
			};
			this.ratelimit.cache.set(id, ratelimit);
		}
		return ratelimit;
	}
}

module.exports = Command;