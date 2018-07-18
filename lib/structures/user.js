const BaseStructure = require('./basestructure');

const Utils = require('../utils');

const CDN = Utils.Constants.Endpoints.CDN;
const RelationshipFlags = Utils.Constants.Discord.Relationships;

const defaults = {
	id: null,
	username: '',
	discriminator: '0000',
	avatar: null,
	bot: false
};

class User extends BaseStructure {
	constructor(client, data, def) {
		super(client, data, def || defaults);
	}

	get isMe() {return this.id === this.client.user.id;}

	get createdAt() {return new Date(this.createdAtUnix);}
	get createdAtUnix() {return Utils.Snowflake.timestamp(this.id);}
	get isWebhook() {return this.discriminator === '0000';}
	get mention() {return `<@${this.id}>`;}
	get note() {return this.client.notes.get(this.id) || '';}
	get relationship() {return this.client.relationships.get(this.id);}

	get avatarURL() {return this.avatarURLFormat();}
	get defaultAvatarURL() {return CDN.URL + CDN.AVATAR_DEFAULT(this.discriminator % 5);}

	get presence() {return this.client.presences.get(this.id);}

	avatarURLFormat(format) {
		if (!this.avatar) {return this.defaultAvatarURL;}

		const hash = this.avatar;
		if (!format) {
			format = this.client.options.imageFormat || 'png';
			if (hash.slice(0, 2) === 'a_') {
				format = 'gif';
			}
		}
		format = format.toLowerCase();

		const valid = ['png', 'jpeg', 'jpg', 'webp', 'gif'];
		if (!valid.includes(format)) {
			throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
		}
		return CDN.URL + CDN.AVATAR(this.id, hash, format);
	}

	createDm() {return this.client.rest.createDm(this.id);}

	createMessage(data) {
		return new Promise((resolve, reject) => {
			const channel = this.client.channels.find((c) => c.isDmSingle && c.recipients.has(this.id));
			
			return (channel) ? resolve(channel) : this.createDm().then(resolve).catch(reject);
		}).then((channel) => channel.createMessage(data));
	}

	deleteRelationship() {return this.client.rest.deleteRelationship(this.id);}

	editNote(note) {return this.client.rest.editNote(this.id, {note});}
	editRelationship(data) {return this.client.rest.editRelationship(this.id, data);}
	fetchProfile() {return this.client.rest.fetchProfile(this.id);}

	add() {return this.editRelationship({type: RelationshipFlags.FRIEND});}
	block() {return this.editRelationship({type: RelationshipFlags.BLOCKED});}
	unadd() {return this.deleteRelationship();}
	unblock() {return this.deleteRelationship();}

	toString() {return `${this.username}#${this.discriminator}`;}
}

User.defaults = defaults;
module.exports = User;