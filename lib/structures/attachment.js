const BaseStructure = require('./basestructure');

const stringToMimetype = require('../utils').MimeTypes.find;

const defaults = {
	id: null,
	filename: '',
	size: 0,
	url: null,
	proxy_url: null,
	height: 0,
	width: 0
};

const EmbeddableRegexes = {
	audio: /mp3|ogg|wav|flac/i,
	image: /png|jpe?g|webp|gif/i,
	video: /mp4|webm|mov/i
};

const MimeClasses = [
	{type: 'mime', class: 'image', regex: /^image\//},
	{type: 'mime', class: 'photoshop', regex: /^image\/vnd.adobe.photoshop/},
	{type: 'mime', class: 'video', regex: /^video\//},
	{type: 'name', class: 'acrobat', regex: /\.pdf$/i},
	{type: 'name', class: 'ae', regex: /\.ae/i},
	{type: 'name', class: 'ai', regex: /\.ai$/i},
	{type: 'name', class: 'archive', regex: /\.(?:rar|zip|7z|tar|tar\.gz)$/i},
	{type: 'name', class: 'audio', regex: /\.(?:mp3|ogg|wav|flac)$/i},
	{type: 'name', class: 'code', regex: /\.(?:c\+\+|cpp|cc|c|h|hpp|mm|m|json|js|rb|rake|py|asm|fs|pyc|dtd|cgi|bat|rss|java|graphml|idb|lua|o|gml|prl|sls|conf|cmake|make|sln|vbe|cxx|wbf|vbs|r|wml|php|bash|applescript|fcgi|yaml|ex|exs|sh|ml|actionscript)$/i},
	{type: 'name', class: 'document', regex: /\.(?:txt|rtf|doc|docx|md|pages|ppt|pptx|pptm|key|log)$/i},
	{type: 'name', class: 'sketch', regex: /\.sketch$/i},
	{type: 'name', class: 'spreadsheet', regex: /\.(?:xls|xlsx|numbers|csv)$/i},
	{type: 'name', class: 'webcode', regex: /\.(?:html|xhtml|htm|js|xml|xls|xsd|css|styl)$/i}
];

class Attachment extends BaseStructure {
	constructor(message, data) {
		super(message.client, data, defaults);
		Object.defineProperty(this, 'message', {value: message});
	}

	get isEmbeddable() {return this.isAudio || this.isImage || this.isVideo;}

	get isAudio() {return !!EmbeddableRegexes.audio.exec(this.extension);}
	get isImage() {return !!EmbeddableRegexes.image.exec(this.extension);}
	get isVideo() {return !!EmbeddableRegexes.video.exec(this.extension);}

	get extension() {
		const filename = (this.filename || '').split('.');
		return (filename.length > 1) ? filename.pop() : null;
	}

	get mimetype() {return stringToMimetype(this.extension);}

	//for the file image, icon-file-{size}-{class}.svg
	get class() {
		const filename = this.filename;
		const mimetype = this.mimetype;
		const found = MimeClasses.find((search) => {
			switch (search.type) {
				case 'mime': return search.regex.exec(mimetype);
				case 'name': return search.regex.exec(filename);
			}
		});
		return (found) ? found.class : 'unknown';
	}

	fetchData(query) {return this.client.rest.request({method: 'get', url: this.url, query});}
	fetchDataProxy(query) {return this.client.rest.request({method: 'get', url: this.proxyUrl, query});}

	toString() {return this.filename;}
}


module.exports = Attachment;