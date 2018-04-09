const ArgumentsParser = require('./ArgumentsParser.js');
const Utils = require('../Utils');

class Command
{
	constructor(commandClient, info)
	{
		this.commandClient = commandClient;
		this.client = this.commandClient.client;

		this.name = info.name.toLowerCase();
		this.aliases = (info.aliases || []).map((alias) => alias.toLowerCase());

		this.label = (info.label || this.name).toLowerCase();

		this.args = new ArgumentsParser(info.args || []);
		this.disableDm = info.disableDm || false;
		this.responseOptional = info.responseOptional || false;

		this.ratelimit = (info.ratelimit) ? {
			settings: info.ratelimit,
			cache: new Map()
		} : null;

		this.options = info.options || {};
	}

	check(name)
	{
		return name === this.name || this.aliases.includes(name);
	}

	getArgs(args)
	{
		const parsedArgs = this.args.parse(args);
		parsedArgs[this.label] = args.join(' ');
		return parsedArgs;
	}

	getRatelimit(id)
	{
		if (!this.ratelimit) {return;}

		let ratelimit = this.ratelimit.cache.get(id);
		if (!ratelimit) {
			ratelimit = {
				start: Utils.Tools.now(),
				usages: 0,
				timeout: setTimeout(() => {
					this.ratelimit.cache.delete(id);
				}, this.ratelimit.settings.duration * 1000),
				replied: false
			};
			this.ratelimit.cache.set(id, ratelimit);
		}

		return ratelimit;
	}
}

module.exports = Command;