class Argument
{
	constructor(info)
	{
		this.name = `-${info.name.toLowerCase()}`;
		this.aliases = (info.aliases || []).map((alias) => `-${alias.toLowerCase()}`);

		this.label = (info.label || info.name).toLowerCase();
		this.type = info.type || 'string';

		this.default = info.default || '';
		this.infinite = info.infinite || false;

		if (this.type === 'bool') {this.infinite = false;}

		this.options = info.options || {};
	}

	check(name)
	{
		return name === this.name || this.aliases.includes(name);
	}

	in(args)
	{
		return args.some((arg) => this.check(arg));
	}

	get(args)
	{
		for (let i in args) {
			if (this.check(args[i])) {
				return parseInt(i);
			}
		}
	}
}

module.exports = Argument;