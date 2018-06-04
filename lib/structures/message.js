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

class Message extends BaseStructure
{
	constructor(client, data)
	{
		super(client, data, defaults, ['attachments', 'author', 'embeds', 'member', 'mentions', 'mention_roles', 'reactions']);

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
	get fromUser() {return !this.fromBot && !this.fromSystem;}
	get fromSystem() {return this.type !== Constants.Discord.MessageTypes.DEFAULT;}
	get fromWebhook() {return !!this.webhookId;}
	get inDm() {return !!this.guildId;}
	get isEdited() {return !!this.editedTimestamp;}
	get timestampUnix() {return Date.parse(this.timestamp);}

	get channel() {return this.client.channels.get(this.channelId);}
	get guild() {return (this.guildId) ? this.client.guilds.get(this.guildId) : null;}

	delete() {return this.client.rest.deleteMessage(this.channelId, this.id);}
	deleteReactions() {return this.client.rest.deleteReactions(this.channelId, this.id);}
	edit(data) {return this.client.rest.editMessage(this.channelId, this.id);}
	pin() {return this.client.rest.addPinnedMessage(this.channelId, this.id);}
	react(emoji) {return this.client.rest.createReaction(this.channelId, this.id, emoji);}

	reply(data)
	{
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

	differences(data)
	{
		const obj = {};
		for (let key in data) {
			const camelKey = Utils.Tools.toCamelCase(key);
			let value = this[camelKey];
			if (value === undefined) {
				obj[camelKey] = value;
				continue;
			}
			if (data[key] === value) {continue;}
			switch (key) {
				case 'author': {
					if (value.id === data[key].id) {continue;}
				}; break;
				case 'attachments':
				case 'embeds':
				case 'mentions':
				case 'mention_roles': {
					if (data[key].length !== value.size && !value.size) {continue;} //maybe compare ids instead
					value = value.clone();
				}; break;
			}
			obj[camelKey] = value;
		}
		return obj;
	}

	merge(data)
	{
		for (let key in data) {
			if (data[key] === undefined) {continue;}

			switch (key) {
				case 'attachments': {
					this.attachments.clear();
					for (let raw of data[key]) {
						this.attachments.set(raw.id, raw);
					}
				}; continue;
				case 'author': {
					let user;
					if (this.client.users.has(data[key].id)) {
						user = this.client.users.get(data[key].id);
						user.merge(data[key]);
					} else {
						user = new Structures.User(this.client, data[key]);
						this.client.users.insert(user);
					}
					data[key] = user;
				}; break;
				case 'content': {
					switch (this.type) {
						case Constants.Discord.MessageTypes.RECIPIENT_ADD: {
							data[key] = Constants.Discord.SystemMessages.RecipientAdd
								.replace(/:user:/g, this.author.mention)
								.replace(/:user2:/g, this.mentions.first().mention);
						}; break;
						case Constants.Discord.MessageTypes.RECIPIENT_REMOVE: {
							const user = this.mentions.first();
							if (user && user.id !== this.author.id) {
								data[key] = Constants.Discord.SystemMessages.RecipientRemove
									.replace(/:user:/g, this.author.mention)
									.replace(/:user2:/g, user.mention);
							} else {
								data[key] = Constants.Discord.SystemMessages.RecipientRemoveSelf.replace(/:user:/g, this.author.mention);
							}
						}; break;
						case Constants.Discord.MessageTypes.CALL: {
							data[key] = Constants.Discord.SystemMessages.CallStarted.replace(/:user:/g, this.author.mention);
						}; break;
						case Constants.Discord.MessageTypes.CHANNEL_NAME_CHANGE: {
							data[key] = Constants.Discord.SystemMessages.ChannelNameChange
								.replace(/:user:/g, this.author.mention)
								.replace(/:name:/g, data[key]);
						}; break;
						case Constants.Discord.MessageTypes.CHANNEL_ICON_CHANGE: {
							data[key] = Constants.Discord.SystemMessages.ChannelIconChange.replace(/:user:/g, this.author.mention);
						}; break;
						case Constants.Discord.MessageTypes.CHANNEL_PINNED_MESSAGE: {
							data[key] = Constants.Discord.SystemMessages.PinnedMessage.replace(/:user:/g, this.author.mention);
						}; break;
						case Constants.Discord.MessageTypes.GUILD_MEMBER_JOIN: {
							data[key] = Constants.Discord.SystemMessages.GuildMemberJoin[
								this.createdAtUnix % Constants.Discord.SystemMessages.GuildMemberJoin.length
							].replace(/:user:/g, this.author.mention);
						}; break;
					}
				}; break;
				case 'embeds': {
					this.embeds.clear();
					for (let i = 0; i < data[key].length; i++) {
						this.embeds.set(i, data[key][i]);
					}
				}; continue;
				case 'member': {
					Object.assign(data[key], {
						guild_id: this.guildId,
						user: (data.author instanceof Structures.User) ? data.author.toJSON() : data.author
					});

					let member;
					if (this.client.members.has(data[key].guild_id, data[key].user.id)) {
						member = this.client.members.get(data[key].guild_id, data[key].user.id);
					} else {
						member = new Structures.Member(this.client, data[key]);
						this.client.members.insert(member);
					}
					data[key] = member;
				}; break;
				case 'mentions': {
					this.mentions.clear();
					for (let value of data[key]) {
						let user;
						if (this.client.users.has(value.id)) {
							user = this.client.users.get(value.id);
							user.merge(value);
						} else {
							user = new Structures.User(this.client, value);
							this.client.users.insert(user);
						}
						this.mentions.set(value.id, user);
					}
				}; continue;
				case 'mention_roles': {
					this.mentionRoles.clear();
					const guild = this.guild;
					for (let value of data[key]) {
						this.mentionRoles.set(value, (guild) ? guild.roles.get(value) : null);
					}
				}; continue;
				case 'reactions': {
					this.reactions.clear();
					for (let value of data[key]) {
						Object.assign(value, {guild_id: this.guildId, channel_id: this.channelId, message_id: this.id});
						this.reactions.set(value.emoji.id || value.emoji.name, new Structures.Reaction(this.client, value));
					}
				}; continue;
			}

			Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
				configurable: true,
				enumerable: true,
				value: data[key]
			});
		}
	}
}

module.exports = Message;