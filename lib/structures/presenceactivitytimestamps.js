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

	get elapsedTime() {
		const total = this.totalTime;
		const elapsed = Date.now() - this.start;
		return (total) ? Math.min(elapsed, total) : elapsed;
	}
	get totalTime() {return (this.end) ? this.end - this.start : 0;}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		if (value === null) {return;}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = PresenceActivityTimestamps;