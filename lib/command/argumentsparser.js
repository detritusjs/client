const Argument = require('./argument');

class ArgumentsParser
{
	constructor(args)
	{
		Object.defineProperty(this, 'defaults', {enumerable: true, value: {}});
		args = (args || []).map((arg) => {
			const Arg = new Argument(arg);
			this.defaults[Arg.label] = Arg.default;
			return Arg;
		});
		Object.defineProperty(this, 'args', {enumerable: true, value: args});
	}

	parse(args)
	{
		const parsed = Object.assign({}, this.defaults);

		this.args.forEach((arg) => {
			if (arg.infinite) {return;}
			if (!arg.in(args)) {return;}

			const pos = arg.getPosition(args);
			if (arg.type === 'bool') {
				args.splice(pos, 1);
				parsed[arg.label] = !arg.default;
			} else {
				parsed[arg.label] = args.splice(pos, 2).pop();
			}
		});

		this.args.map((arg) => {
			if (!arg.infinite) {return;}
			if (!arg.in(args)) {return;}

			return {label: arg.label, pos: arg.getPosition(args)};
		}).filter((v) => v).sort((x, y) => x.pos < y.pos).forEach(({label, pos}) => {
			parsed[label] = args.splice(pos);
			parsed[label].shift();
			parsed[label] = parsed[label].join(' ');
		});

		return parsed;
	}
}

module.exports = ArgumentsParser;