module.exports.now = function (unit='milli', round=false) {
	const hrTime = process.hrtime();

	let time;
	switch (unit)
	{
		case 'milli': time = hrTime[0] * 1000 + hrTime[1] / 1000000; break;
		case 'micro': time = hrTime[0] * 1000000 + hrTime[1] / 1000; break;
		case 'nano': time = hrTime[0] * 1000000000 + hrTime[1]; break;
		default: time = hrTime[0] * 1000000000 + hrTime[1];
	}

	return round ? Math.round(time) : time;
};

module.exports.toCamelCase = function (value) {
	value = value.split('_').map((v) => {
		return v.charAt(0).toUpperCase() + v.substr(1);
	}).join('');
	return value.charAt(0).toLowerCase() + value.substr(1);
};

module.exports.hexToInt = function(hex) {
	return parseInt(hex.replace('#', ''), 16);
};

module.exports.rgbToInt = function(r, g, b) {
	return ((r & 0x0ff) << 16) | ((g & 0x0ff) << 8) | (b & 0x0ff);
};

module.exports.intToRGB = function(int) {
	return {
		r: (int >> 16) & 0x0ff,
		g: (int >> 8) & 0x0ff,
		b: int & 0x0ff
	};
};

module.exports.intToHex = function(int, hashtag=false) {
	return `${(hashtag) ? '#' : ''}${int.toString(16).padStart(6, '0')}`;
};

module.exports.regex = function (type, string) {
	switch (type) {
		case 'emoji': {
			const match = string.match(/^<a?:(\w+):(\d+)>/);
			if (!match) {return null;}

			return {
				animated: Boolean(string.startsWith('<a')),
				name: match[1],
				id: match[2]
			};
		}; break;
		case 'channel': {
			const match = string.match(/^<#(\d+)>/);
			if (!match) {return null;}

			return {id: match[1]};
		}; break;
		case 'user': {
			const match = string.match(/^<@!?(\d+)>/);
			if (!match) {return null;}

			return {id: match[1]};
		}; break;
		case 'role': {
			const match = string.match(/^<@&(\d+)>/);
			if (!match) {return null;}

			return {id: match[1]};
		}; break;
		default: {
			throw new Error('Invalid Regex Type');
		};
	}
};