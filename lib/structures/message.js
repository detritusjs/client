const BaseCollection = require('../collections').BaseCollection;
const BaseStructure = require('./basestructure');

const Structures = {
	Member: require('./member'),
	Reaction: require('./reaction'),
	User: require('./user')
};

const Utils = require('../utils');
const Constants = Utils.Constants;

const defaults = {
    id: null,
    activity: null,
    application: null,
    attachments: [],
    author: {},
    call: null,
    channel_id: null,
    content: '',
    edited_timestamp: null,
	embeds: [],
	guild_id: null,
	member: null,
    mentions: [],
    mention_everyone: false,
    mention_roles: [],
    nonce: null,
    pinned: false,
    reactions: [],
    timestamp: '',
    tts: false,
    type: Constants.Discord.MessageTypes.BASE,
    webhook_id: null
};

const ignore = ['attachments', 'author', 'embeds', 'member', 'mentions', 'mention_roles', 'reactions'];

class Message extends BaseStructure {
	constructor(client, data) {
		super(client, data, defaults, ignore);

		Object.defineProperties(this, {
			attachments: {enumerable: true, configurable: false, value: new BaseCollection()},
			embeds: {enumerable: true, configurable: false, value: new BaseCollection()},
			mentions: {enumerable: true, configurable: false, value: new BaseCollection()},
			mentionRoles: {enumerable: true, configurable: false, value: new BaseCollection()},
			reactions: {enumerable: true, configurable: false, value: new BaseCollection()}
		});
		
		this.merge({
			attachments: data.attachments,
			author: data.author,
			content: data.content,
			embeds: data.embeds,
			member: data.member,
			mentions: data.mentions,
			mention_roles: data.mention_roles,
			reactions: data.reactions
		});
	}

	get createdAt() {return new Date(this.createdAtUnix);}
	get createdAtUnix() {return Utils.Snowflake.timestamp(this.id);}
	get editedAt() {return this.editedTimestamp && new Date(this.editedTimestamp);}
	get editedAtUnix() {return this.editedTimestamp && Date.parse(this.editedTimestamp);}
	get fromBot() {return this.author.bot;}
	get fromUser() {return !this.fromBot && !this.fromSystem && !this.fromWebhook;}
	get fromSystem() {return this.type !== Constants.Discord.MessageTypes.DEFAULT;}
	get fromWebhook() {return !!this.webhookId;}
	get inDm() {return !this.guildId;}
	get isEdited() {return !!this.editedTimestamp;}
	get timestampUnix() {return Date.parse(this.timestamp);}

	get channel() {return this.client.channels.get(this.channelId);}
	get guild() {return (this.guildId) ? this.client.guilds.get(this.guildId) : null;}

	get canReact() {
		const channel = this.channel;
		return channel && channel.canAddReactions;
	}

	get canReply() {
		if (this.inDm) {return true;}
		const channel = this.channel;
		return channel && channel.canMessage;
	}

	get canDelete() {
		if (this.author.id === this.client.user.id) {return true;}
		const channel = this.channel;
		return channel && channel.canManageMessages;
	}

	delete() {return this.client.rest.deleteMessage(this.channelId, this.id);}
	deleteReactions() {return this.client.rest.deleteReactions(this.channelId, this.id);}

	edit(data) {
		if (typeof(data) !== 'object') {data = {content: data};}
		return this.client.rest.editMessage(this.channelId, this.id, data);
	}

	pin() {return this.client.rest.addPinnedMessage(this.channelId, this.id);}
	react(emoji) {return this.client.rest.createReaction(this.channelId, this.id, emoji);}

	reply(data) {
		data = data || {};
		if (typeof(data) !== 'object') {
			data = {content: data};
		}
		if (data.mention) {
			data.content = [this.author.mention, data.content || null].filter((v) => v).join(', ');
		}
		return this.client.rest.createMessage(this.channelId, data);
	}

	unpin() {return this.client.rest.deletePinnedMessage(this.channelId, this.id);}

	difference(key, value) {
		switch (key) {
			case 'author': return;
			case 'attachments':
			case 'embeds':
			case 'mentions':
			case 'mention_roles': {
				if (key === 'mention_roles') {
					key = 'mentionRoles';
				}
				const old = this[key];
				if (value.length === old.size && !old.size) {return;} //maybe compare ids instead
				const payload = {};
				payload[key] = old.clone();
				return payload;
			}; break;
		}

		return super.difference.call(this, key, value);
	}

	mergeValue(key, value) {
		if (value === undefined) {return;}

		switch (key) {
			case 'attachments': {
				this.attachments.clear();
				for (let raw of value) {
					this.attachments.set(raw.id, raw);
				}
			}; return;
			case 'author': {
				let user;
				if (this.fromWebhook) {
					user = new Structures.User(this.client, value);
				} else {
					if (this.client.users.has(value.id)) {
						user = this.client.users.get(value.id);
						user.merge(value);
					} else {
						user = new Structures.User(this.client, value);
						this.client.users.insert(user);
					}
				}
				value = user;
			}; break;
			case 'content': {
				switch (this.type) {
					case Constants.Discord.MessageTypes.RECIPIENT_ADD: {
						value = Constants.Discord.SystemMessages.RecipientAdd
							.replace(/:user:/g, this.author.mention)
							.replace(/:user2:/g, this.mentions.first().mention);
					}; break;
					case Constants.Discord.MessageTypes.RECIPIENT_REMOVE: {
						const user = this.mentions.first();
						if (user && user.id !== this.author.id) {
							value = Constants.Discord.SystemMessages.RecipientRemove
								.replace(/:user:/g, this.author.mention)
								.replace(/:user2:/g, user.mention);
						} else {
							value = Constants.Discord.SystemMessages.RecipientRemoveSelf.replace(/:user:/g, this.author.mention);
						}
					}; break;
					case Constants.Discord.MessageTypes.CALL: {
						value = Constants.Discord.SystemMessages.CallStarted.replace(/:user:/g, this.author.mention);
					}; break;
					case Constants.Discord.MessageTypes.CHANNEL_NAME_CHANGE: {
						value = Constants.Discord.SystemMessages.ChannelNameChange
							.replace(/:user:/g, this.author.mention)
							.replace(/:name:/g, value);
					}; break;
					case Constants.Discord.MessageTypes.CHANNEL_ICON_CHANGE: {
						value = Constants.Discord.SystemMessages.ChannelIconChange.replace(/:user:/g, this.author.mention);
					}; break;
					case Constants.Discord.MessageTypes.CHANNEL_PINNED_MESSAGE: {
						value = Constants.Discord.SystemMessages.PinnedMessage.replace(/:user:/g, this.author.mention);
					}; break;
					case Constants.Discord.MessageTypes.GUILD_MEMBER_JOIN: {
						value = Constants.Discord.SystemMessages.GuildMemberJoin[
							this.createdAtUnix % Constants.Discord.SystemMessages.GuildMemberJoin.length
						].replace(/:user:/g, this.author.mention);
					}; break;
				}
			}; break;
			case 'embeds': {
				this.embeds.clear();
				for (let i = 0; i < value.length; i++) {
					this.embeds.set(i, value[i]);
				}
			}; return;
			case 'member': {
				let member;
				if (this.client.members.has(this.guildId, this.author.id)) {
					member = this.client.members.get(this.guildId, this.author.id);
					//maybe merge with value
				} else {
					Object.assign(value, {
						guild_id: this.guildId,
						user: (this.client.users.enabled) ? {id: this.author.id} : this.author.toJSON()
					});
					member = new Structures.Member(this.client, value);
					this.client.members.insert(member);
				}
				value = member;
			}; break;
			case 'mentions': {
				this.mentions.clear();
				for (let raw of value) {
					if (raw.member) {
						let member;
						if (this.client.members.has(this.guildId, raw.id)) {
							member = this.client.members.get(this.guildId, raw.id);
							//maybe merge member with raw.member
						} else {
							const memberRaw = raw.member;
							raw.member = undefined;

							Object.assign(memberRaw, {guild_id: this.guildId, user: raw});
							member = new Structures.Member(this.client, memberRaw);
							this.client.members.insert(member);
						}
						this.mentions.set(raw.id, member);
					} else {
						let user;
						if (this.client.users.has(raw.id)) {
							user = this.client.users.get(raw.id);
							user.merge(raw);
						} else {
							user = new Structures.User(this.client, raw);
							this.client.users.insert(user);
						}
						this.mentions.set(raw.id, user);
					}
				}
			}; return;
			case 'mention_roles': {
				this.mentionRoles.clear();

				const guild = this.guild;
				for (let raw of value) {
					const role = (guild) ? guild.roles.get(raw) : null;
					this.mentionRoles.set(raw, role || {id: raw, name: '@deleted-role'});
				}
			}; return;
			case 'reactions': {
				this.reactions.clear();
				for (let raw of value) {
					Object.assign(raw, {guild_id: this.guildId, channel_id: this.channelId, message_id: this.id});
					this.reactions.set(raw.emoji.id || raw.emoji.name, new Structures.Reaction(this.client, raw));
				}
			}; return;
		}

		super.mergeValue.call(this, key, value);
	}

	merge(data) {
		if (data.author) {
			this.mergeValue('author', data.author);
			data.author = undefined;
		}
		if (data.mentions && data.mentions.length) {
			this.mergeValue('mentions', data.mentions);
			data.mentions = undefined;
		}
		//load these first because of system messages and member object
		super.merge.call(this, data);
	}
}

module.exports = Message;