const Utils = require('detritus-utils');

module.exports = Object.assign({}, Utils, {
	Constants: require('./constants'),
	MimeTypes: require('./mimetypes')
});