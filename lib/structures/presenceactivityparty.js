const BaseStructure = require('./basestructure');

const defaults = {
	id: null,
	size: null
};

class PresenceActivityParty extends BaseStructure {
	constructor(activity, data) {
		super(activity.client, data, defaults);
		Object.defineProperty(this, 'activity', {value: activity});
	}

	get currentSize() {return (this.size) ? this.size[0] : null;}
	get maxSize() {return (this.size) ? this.size[1] : null;}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		if (value === null) {return;}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = PresenceActivityParty;