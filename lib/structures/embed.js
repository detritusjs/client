const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Structures = {
	EmbedAuthor: require('./embedauthor'),
	EmbedData: require('./embeddata'),
	EmbedFooter: require('./embedfooter')
};

const Utils = require('../utils');
const Tools = Utils.Tools;

const EmbedTypes = Utils.Constants.Discord.EmbedTypes;

const defaults = {
	title: null,
	type: 'rich',
	description: null,
	url: null,
	timestamp: null,
	color: null,
	author: null,
	fields: null,
	footer: null,
	image: null,
	provider: null,
	thumbnail: null,
	video: null
};

const ignore = ['fields'];

class Embed extends BaseStructure {
	constructor(message, data) {
		super(message.client, data, defaults, ignore);

		Object.defineProperties(this, {
			message: {value: message},
			fields: {enumerable: true, configurable: true, value: null}
		});

		this.merge({fields: data.fields});
	}

	get isArticle() {return this.type === EmbedTypes.ARTICLE;}
	get isGifV() {return this.type === EmbedTypes.GIFV;}
	get isImage() {return this.type === EmbedTypes.IMAGE;}
	get isLink() {return this.type === EmbedTypes.LINK;}
	get isRich() {return this.type === EmbedTypes.RICH;}
	get isTweet() {return this.type === EmbedTypes.TWEET;}
	get isVideo() {return this.type === EmbedTypes.VIDEO;}

	get colorHex() {return Tools.intToHex(this.color);}
	get colorRGB() {return Tools.intToRGB(this.color);}

	fetchAuthorIcon() {return (this.author) ? this.author.fetchIcon() : Promise.reject(new Error('This embed has no author'));}
	fetchAuthorIconProxy() {return (this.author) ? this.author.fetchIcon() : Promise.reject(new Error('This embed has no author'));}

	fetchFooterIcon() {return (this.footer) ? this.footer.fetchIcon() : Promise.reject(new Error('This embed has no footer'));}
	fetchFooterIconProxy() {return (this.footer) ? this.footer.fetchIcon() : Promise.reject(new Error('This embed has no footer'));}

	fetchImage() {return (this.image) ? this.image.fetchData() : Promise.reject(new Error('This embed has no image'));}
	fetchImageProxy() {return (this.image) ? this.image.fetchDataProxy() : Promise.reject(new Error('This embed has no image'));}

	fetchThumbnail() {return (this.thumbnail) ? this.thumbnail.fetchData() : Promise.reject(new Error('This embed has no thumbnail'));}
	fetchThumbnailProxy() {return (this.thumbnail) ? this.thumbnail.fetchDataProxy() : Promise.reject(new Error('This embed has no thumbnail'));}

	fetchVideo() {return (this.video) ? this.video.fetchData() : Promise.reject(new Error('This embed has no video'));}
	fetchVideoProxy() {return (this.video) ? this.video.fetchDataProxy() : Promise.reject(new Error('This embed has no video'));}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		if (!value) {return;}

		switch (key) {
			case 'author': {
				value = new Structures.EmbedAuthor(this, value);
			}; break;
			case 'fields': {
				if (!this.fields) {
					Object.defineProperty(this, 'fields', {value: new BaseCollection()});
				}
				this.fields.clear();
				for (let i = 0; i < value.length; i++) {
					this.fields.set(i, value[i]);
				}
			}; return;
			case 'footer': {
				value = new Structures.EmbedFooter(this, value);
			}; break;
			case 'provider': {

			}; break;
			case 'image':
			case 'thumbnail':
			case 'video': {
				value = new Structures.EmbedData(this, value);
			}; break;
		}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = Embed;