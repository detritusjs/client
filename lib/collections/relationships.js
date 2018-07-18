const BaseCollection = require('./basecollection');

const defaults = {
	enabled: true
};

class Relationships extends BaseCollection {
	constructor(client, options) {
		super();

		Object.defineProperty(this, 'client', {value: client});

		options = Object.assign({}, defaults, options);
		this.setEnabled(options.enabled);
	}

	get friends() {return new BaseCollection(this.filter((relationship) => relationship.isFriend));}
	get blocks() {return new BaseCollection(this.filter((relationship) => relationship.isBlocked));}
	get pendingIncoming() {return new BaseCollection(this.filter((relationship) => relationship.isPendingIncoming));}
	get pendingOutgoing() {return new BaseCollection(this.filter((relationship) => relationship.isPendingOutgoing));}

	setEnabled(enabled) {
		Object.defineProperty(this, 'enabled', {enumerable: true, configurable: true, value: !!enabled});
	}

	insert(relationship) {
		if (!this.enabled) {return;}
		this.set(relationship.id, relationship);
	}

	toString() {return `${this.size} Relationships`;}
}

module.exports = Relationships;