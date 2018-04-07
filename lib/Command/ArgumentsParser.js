const Argument = require('./Argument.js');

class ArgumentsParser
{
	constructor(args)
	{
		this.defaults = {};
		this.args = (args || []).map((arg) => {
			const Arg = new Argument(arg);
			this.defaults[Arg.label] = Arg.default;
			return Arg;
		});
	}

	parse(args)
	{
		const Args = Object.assign({}, this.defaults);

		this.args.forEach((Arg) => {
			if (Arg.infinite) {return;}
			if (!Arg.in(args)) {return;}

			const pos = Arg.get(args);
			if (Arg.type === 'bool') {
				args.splice(pos, 1);
				Args[Arg.label] = !Arg.default;
			} else {
				Args[Arg.label] = args.splice(pos, 2).pop();
			}
		});

		this.args.map((Arg) => {
			if (!Arg.infinite) {return;}
			if (!Arg.in(args)) {return;}

			return {label: Arg.label,pos: Arg.get(args)};
		}).filter((v) => v).sort((x, y) => x.pos < y.pos).forEach((position) => {
			Args[position.label] = args.splice(position.pos);
			Args[position.label].shift();
			Args[position.label] = Args[position.label].join(' ');
		});

		return Args;
	}
}

module.exports = ArgumentsParser;