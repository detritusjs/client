const fork = require('child_process').fork;

const RestClient = require('detritus-client-rest').Client;

//launch certain clusters, like intervals of 4, multi-threaded
class ClusterHandler
{
	constructor(token, options)
	{
		options = Object.assign({}, options);

		Object.defineProperties(this, {
			clusters: {enumerable: true, value: new Map()}
		});
	}

	run(options)
	{

	}
}

module.exports = ClusterHandler;