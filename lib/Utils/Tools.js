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