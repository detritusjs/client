const BaseStructure = require('./basestructure');

const Structures = {
	User: require('./user')
};

const RelationshipFlags = require('../utils').Constants.Discord.Relationships;

const defaults = {
	id: null,
	type: RelationshipFlags.NONE,
	user: {}
};

class Relationship extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults);
	}

	get user() {return this.client.users.get(this.id);}

	get isNone() {return this.type === RelationshipFlags.NONE;}
	get isFriend() {return this.type === RelationshipFlags.FRIEND;}
	get isBlocked() {return this.type === RelationshipFlags.BLOCKED;}
	get isPendingIncoming() {return this.type === RelationshipFlags.PENDING_INCOMING;}
	get isPendingOutgoing() {return this.type === RelationshipFlags.PENDING_OUTGOING;}
	get isImplicit() {return this.type === RelationshipFlags.IMPLICIT;}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'user': {
				if (this.client.users.has(value.id)) {
					this.client.users.get(value.id).merge(value);
				} else {
					this.client.users.insert(new Structures.User(this.client, value));
				}
			}; return;
		}

		super.mergeValue.call(this, key, value);
	}
}

module.exports = Relationship;