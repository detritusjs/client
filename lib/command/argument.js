const defaults = {
	aliases: [],
	type: 'string',
	default: '',
	infinite: false
};

class Argument {
	constructor(info) {
		info = Object.assign({}, defaults, info);

		Object.defineProperties(this, {
			name: {enumerable: true, value: `-${info.name.toLowerCase()}`},
			aliases: {enumerable: true, value: info.aliases.map((alias) => `-${alias.toLowerCase()}`)},
			label: {enumerable: true, value: (info.label || info.name).toLowerCase()},
			type: {enumerable: true, value: info.type},
			default: {enumerable: true, value: info.default},
			infinite: {enumerable: true, value: (info.type === 'bool') ? false : !!info.infinite}
		});

		this.options = Object.assign({}, info.options);
	}

	check(name) {
		return name === this.name || this.aliases.includes(name);
	}

	in(args) {
		return args.some((arg) => this.check(arg));
	}

	getPosition(args) {
		for (let i in args) {
			if (this.check(args[i])) {
				return parseInt(i);
			}
		}
	}
}

module.exports = Argument;