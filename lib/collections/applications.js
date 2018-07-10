const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Applications extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	insert(application) {
		if (!this.enabled) {return;}
		this.set(application.id, application);
	}

	fill() {
		if (!this.enabled) {return Promise.resolve();}
		this.clear();
		return this.client.rest.fetchApplications().then((applications) => {
			applications.forEach(this.insert.bind(this));
		});
	}

	toString() {return `${this.size} Applications`;}
}

module.exports = Applications;