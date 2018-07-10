const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Utils = require('../utils');
const CDN = Utils.Constants.Endpoints.CDN;

const defaults = {
	action_type: -1,
	changes: null,
	id: null,
	guild_id: null,
	options: null,
	reason: null,
	target: null,
	user_id: null
};

const ignore = ['changes', 'target_id'];

class AuditLog extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		Object.defineProperties(this, {
			changes: {enumerable: true, configurable: false, value: new BaseCollection()}
		});

		this.merge({changes: data.changes});
	}

	get createdAt() {return new Date(this.createdAtUnix);}
	get createdAtUnix() {return Utils.Snowflake.timestamp(this.id);}

	mergeValue(key, value) {
		if (value === undefined) {return;}
		if (value === null) {return;}

		switch (key) {
			case 'changes': {
				this.changes.clear();
				for (let i = 0; i < value.length; i++) {
					this.changes.set(i, value[i]);
				}
			}; return;
		}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = AuditLog;