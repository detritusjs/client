const URL = require('url');

const BaseStructure = require('./basestructure');

const stringToMimetype = require('../utils').MimeTypes.find;

const defaults = {
	height: 0,
	width: 0,
	proxy_url: null,
	url: null
};

class EmbedData extends BaseStructure {
	constructor(embed, data) {
		super(embed.client, data, defaults);
		Object.defineProperty(this, 'embed', {value: embed});
	}

	get filename() {return URL.parse(this.proxyUrl).pathname.split('/').pop();}
	get extension() {
		const filename = (this.filename || '').split('.');
		return (filename.length > 1) ? filename.pop() : null;
	}

	get mimetype() {return stringToMimetype(this.extension);}

	fetchData(query) {return this.client.rest.request({method: 'get', url: this.url, query});}
	fetchDataProxy(query) {return (this.proxyUrl) ? this.client.rest.request({method: 'get', url: this.proxyUrl, query}) : Promise.reject(new Error('Proxy url isn\'t here, use the regular url'));}
}

module.exports = EmbedData;