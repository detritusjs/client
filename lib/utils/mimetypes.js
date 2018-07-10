const mimetypes = require('./mimetypes.json');

module.exports = {
	mimetypes,
	find: function(extension, options) {
		options = Object.assign({filename: false}, options);
		if (options.filename) {
			extension = extension.split('.');
			if (extension.length <= 1) {
				return null;
			}
			extension = extension.pop();
		}
		if (!extension) {return null;}
		extension = extension.toLowerCase();

		const mimetype = mimetypes.find((mimetype) => mimetype.extension === extension);
		return (mimetype) ? mimetype.mime : null;
	}
};