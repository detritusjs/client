const BaseStructure = require('./basestructure');

const defaults = {
	start: 0,
	end: null
};

class PresenceActivityTimestamps extends BaseStructure {
	constructor(activity, data) {
		super(activity.client, data, defaults);
		Object.defineProperty(this, 'activity', {value: activity});
	}

	get elapsedTime() {return (this.end || Date.now()) - this.start;}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		if (value === null) {return;}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = PresenceActivityTimestamps;