'use strict';

const DetritusRest = require('detritus-client-rest');

const BaseCollection = require('../collections/basecollection');
const Structures = require('../structures');

class RestClient extends DetritusRest.Client
{
	constructor(token, options, client)
	{
		super(token, options);

		Object.defineProperty(this, 'client', {value: client});
	}

	createChannel(guildId, body)
	{
		return super.createChannel.call(this, guildId, body).then((data) => {
			let channel;
			if (this.client.channels.has(data.id)) {
				channel = this.client.channels.get(data.id);
				channel.merge(data);
				//this should never happen lol
			} else {
				channel = Structures.Channel.create(this.client, data);
				this.client.channels.insert(channel);
			}
			return channel;
		});
	}

	createDm(recipient_id)
	{
		return super.createDm.call(this, recipient_id).then((data) => {
			let channel;
			if (this.client.channels.has(data.id)) {
				channel = this.client.channels.get(data.id);
				channel.merge(data);
			} else {
				channel = Structures.Channel.create(this.client, data);
				this.client.channels.insert(channel);
			}
			return channel;
		});
	}

	createEmoji(guildId, body)
	{
		return super.createEmoji.call(this, guildId, body).then((data) => {
			let emoji;
			if (this.client.emojis.has(data.id)) {
				emoji = this.client.emojis.get(data.id);
				emoji.merge(data);
			} else {
				emoji = new Structures.Emoji(this.client, data);
				this.client.emojis.insert(emoji);
			}
			return emoji;
		});
	}

	createGuild(body)
	{
		return super.createGuild.call(this, body).then((data) => {
			let guild;
			if (this.client.guilds.has(data.id)) {
				guild = this.client.guilds.get(data.id);
				guild.merge(data);
			} else {
				guild = new Structures.Guild(this.client, data);
				this.client.guilds.insert(guild);
			}
			return guild;
		});
	}

	createInvite(channelId, body) {return super.createInvite.call(this, channelId, body).then((data) => new Structures.Invite(this.client, data));}

	createMessage(channelId, body)
	{
		return super.createMessage.call(this, channelId, body).then((data) => {
			const message = new Structures.Message(this.client, data);
			this.client.messages.insert(message);
			return message;
		});
	}

	createRole(guildId, body)
	{
		return super.createRole.call(this, guildId, body).then((data) => {
			const role = new Structures.Role(this.client, Object.assign(data, {guild_id: guildId}));
			if (this.client.guilds.has(guildId)) {
				this.client.guilds.get(guildId).roles.set(role.id, role);
			}
			return role;
		});
	}

	createWebhook(channelId, body) {return super.createWebhook.call(this, channelId, body).then((data) => new Structures.Webhook(this.client, data));}

	deleteChannel(channelId)
	{
		return super.deleteChannel.call(this, channelId).then((data) => {
			let channel;
			if (this.client.channels.has(data.id)) {
				channel = this.client.channels.get(data.id);
				this.client.channels.delete(data.id);
				channel.merge(data);
			} else {
				channel = Structures.Channel.create(this.client, data);
			}
			return channel;
		});
	}

	deleteInvite(code) {return super.deleteInvite.call(this, code).then((data) => new Structures.Invite(this.client, data));}

	editChannel(channelId, body)
	{
		return super.editChannel.call(this, channelId, body).then((data) => {
			let channel;
			if (this.client.channels.has(data.id)) {
				channel = this.client.channels.get(data.id);
				channel.merge(data);
			} else {
				channel = Structures.Channel.create(this.client, data);
				this.client.channels.insert(channel);
			}
			return channel;
		});
	}

	//put these in cache? event wont have differences then
	editEmoji(guildId, emojiId, body) {return super.editEmoji.call(this, guildId, emojiId, body);}
	editGuild(guildId, body) {return super.editGuild.call(this, guildId, body);}
	editMember(guildId, userId, body) {return super.editMember.call(this, guildId, userId, body);}
	editMessage(channelId, messageId, body) {return super.editMessage.call(this, channelId, messageId, body);}
	editRole(guildId, roleId, body) {return super.editRole.call(this, guildId, roleId, body);}//role object
	editRolePositions(guildId, body) {return super.editRolePositions.call(this, guildId, body);}//list of role objects
	editUser(body) {return super.editUser.call(this, body);}//user object of own user
	editWebhook(webhookId, body) {return super.editWebhook.call(this, webhookId, body).then((data) => new Structures.Webhook(this.client, data));}
	editWebhookToken(webhookId, token, body) {return super.editWebhookToken.call(this, webhookId, token, body).then((data) => new Structures.Webhook(this.client, data));}
	
	executeWebhook(webhookId, token, body, compatible)
	{
		return super.executeWebhook.call(this, webhookId, token, body, compatible).then((data) => {
			if (body.wait) {
				const message = new Structures.Message(this.client, message);
				this.client.messages.insert(message);
				return message;
			} else {
				return data;
			}
		});
	}

	fetchBans(guildId)
	{
		return super.fetchBans.call(this, guildId).then((data) => {
			const bans = new BaseCollection();
			for (let raw of data) {
				let user;
				if (this.client.users.has(raw.user.id)) {
					user = this.client.users.get(raw.user.id);
					user.merge(raw.user);
				} else {
					user = new Structures.User(this.client, raw.user);
					this.client.users.insert(user);
				}
				bans.set(user.id, {reason: raw.reason, user});
			}
			return bans;
		});
	}

	fetchChannelInvites(channelId)
	{
		return super.fetchChannelInvites.call(this, channelId).then((data) => {
			const invites = new BaseCollection();
			for (let raw of data) {
				invites.set(raw.code, new Structures.Invite(this.client, raw));
			}
			return invites;
		});
	}

	fetchChannelWebhooks(channelId)
	{
		return super.fetchChannelWebhooks.call(this, channelId).then((data) => {
			const webhooks = new BaseCollection();
			for (let raw of data) {
				webhooks.set(raw.id, new Structures.Webhook(this.client, raw));
			}
			return webhooks;
		});
	}

	fetchDMs()
	{
		return super.fetchDMs.call(this).then((data) => {
			const channels = new BaseCollection();
			for (let raw of data) {
				let channel;
				if (this.client.channels.has(raw.id)) {
					channel = this.client.channels.get(raw.id);
					channel.merge(raw);
				} else {
					channel = Structures.Channel.create(this.client, raw);
					this.client.channels.insert(channel);
				}
				channels.set(channel.id, channel);
			}
			return channels;
		});
	}

	fetchEmoji(guildId, emojiId)
	{
		return super.fetchEmoji.call(this, guildId, emojiId).then((data) => {
			let emoji;
			if (this.client.emojis.has(data.id)) {
				emoji = this.client.emojis.get(data.id);
				emoji.merge(data);
			} else {
				emoji = new Structures.Emoji(this.client, Object.assign(data, {guild_id: guildId}));
				this.client.emojis.insert(emoji);
			}
			return emoji;
		});
	}

	fetchEmojis(guildId)
	{
		return super.fetchEmojis.call(this, guildId).then((data) => {
			const emojis = new BaseCollection();
			for (let raw of data) {
				let emoji;
				if (this.client.emojis.has(raw.id)) {
					emoji = this.client.emojis.get(raw.id);
					emoji.merge(raw);
				} else {
					emoji = new Structures.Emoji(this.client, Object.assign(raw, {guild_id: guildId}));
					this.client.emojis.insert(emoji);
				}
				emojis.set(emoji.id, emoji);
			}
			return emojis;
		});
	}

	fetchGuilds()
	{
		return super.fetchGuilds.call(this).then((data) => {
			const guilds = new BaseCollection();
			for (let raw of data) {
				let guild;
				if (this.client.guilds.has(raw.id)) {
					guild = this.client.guilds.get(raw.id);
					guild.merge(raw);
				} else {
					guild = new Structures.Guild(this.client, raw);
				}
				guilds.set(guild.id, guild);
			}
			return guilds;
		});
	}

	fetchGuild(guildId)
	{
		return super.fetchGuild.call(this, guildId).then((data) => {
			let guild;
			if (this.client.guilds.has(data.id)) {
				guild = this.client.guilds.get(data.id);
				guild.merge(data);
			} else {
				guild = new Structures.Guild(this.client, data);
			}
			return guild;
		});
	}

	fetchAuditLogs(guildId, query)
	{
		return super.fetchAuditLogs.call(this, guildId, query);
	}

	fetchGuildInvites(guildId)
	{
		return super.fetchGuildInvites.call(this, guildId).then((data) => {
			const invites = new BaseCollection();
			for (let raw of data) {
				invites.set(raw.code, new Structures.Invite(this.client, raw));
			}
			return invites;
		});
	}

	fetchGuildWebhooks(guildId)
	{
		return super.fetchGuildWebhooks.call(this, guildId).then((data) => {
			const webhooks = new BaseCollection();
			for (let raw of data) {
				webhooks.set(raw.id, new Structures.Webhook(this.client, raw));
			}
			return webhooks;
		});
	}

	fetchInvite(code, query) {return super.fetchInvite.call(this, code, query).then((data) => new Structures.Invite(this.client, data));}

	fetchMember(guildId, userId)
	{
		return super.fetchMember.call(this, guildId, userId).then((data) => {
			let member;
			if (this.client.members.has(guildId, userId)) {
				member = this.client.members.get(guildId, userId);
				member.merge(data);
			} else {
				member = new Structures.Member(this.client, Object.assign(data, {guild_id: guildId}));
			}
			return member;
		});
	}

	fetchMembers(guildId, query)
	{
		return super.fetchMembers.call(this, guildId, query).then((data) => {
			const members = new BaseCollection();
			for (let raw of data) {
				let member;
				if (this.client.members.has(guildId, raw.user.id)) {
					member = this.client.members.get(guildId, raw.user.id);
					member.merge(raw);
				} else {
					member = new Structures.Member(this.client, Object.assign(raw, {guild_id: guildId}));
				}
				members.set(raw.user.id, member);
			}
			return members;
		});
	}

	fetchMessage(channelId, messageId)
	{
		return super.fetchMessage.call(this, channelId, messageId).then((data) => {
			let message = this.client.messages.get(data.id);
			if (message) {
				message.merge(data);
			} else {
				message = new Structures.Message(this.client, data);
			}
			//dont insert into cache and dont check cache id because rest api doesnt return guild id yet
			return message;
		});
	}

	fetchMessages(channelId, query)
	{
		return super.fetchMessages.call(this, channelId, query).then((data) => {
			const messages = new BaseCollection();
			for (let raw of data) {
				let message = this.client.messages.get(raw.id);
				if (message) {
					message.merge(raw);
				} else {
					message = new Structures.Message(this.client, raw);
				}
				//dont insert into cache and dont check cache id because rest api doesnt return guild id yet
				messages.set(message.id, message);
			}
			return messages;
		});
	}

	fetchPinnedMessages(channelId)
	{
		return super.fetchPinnedMessages.call(this, channelId).then((data) => {
			const messages = new BaseCollection();
			for (let raw of data) {
				let message = this.client.messages.get(raw.id);
				if (message) {
					message.merge(raw);
				} else {
					message = new Structures.Message(this.client, raw);
				}
				messages.set(message.id, message);
			}
			return messages;
		});
	}

	fetchReactions(channelId, messageId, emoji, query)
	{
		return super.fetchReactions.call(this, channelId, messageId, emoji, query).then((data) => {
			const users = new BaseCollection();
			for (let raw of data) {
				let user;
				if (this.client.users.has(raw.id)) {
					user = this.client.users.get(raw.id);
					user.merge(raw);
				} else {
					user = new Structures.User(this.client, raw);
					this.client.users.insert(user);
					//maybe no insert
				}
				users.set(user.id, user);
			}
			return users;
		});
	}

	fetchRoles(guildId)
	{
		return super.fetchRoles.call(this, guildId).then((data) => {
			let roles;
			if (this.client.guilds.has(guildId)) {
				roles = this.client.guilds.get(guildId).roles;
				roles.clear();
			} else {
				roles = new BaseCollection();
			}
			for (let raw of data) {
				roles.set(raw.id, new Structures.Role(this.client, Object.assign(raw, {guild_id: guildId})));
			}
			return roles;
		});
	}

	fetchUser(userId)
	{
		return super.fetchUser.call(this, userId).then((data) => {
			let user;
			if (this.client.users.has(data.id)) {
				user = this.client.users.get(data.id);
				user.merge(data);
			} else {
				user = new Structures.User(this.client, data);
				this.client.users.insert(user);
				//maybe no insert
			}
			return user;
		});
	}
	
	fetchWebhook(webhookId) {return super.fetchWebhook.call(this, webhookId).then((data) => new Structures.Webhook(this.client, data));}
	fetchWebhookToken(webhookId, token) {return super.fetchWebhookToken.call(this, webhookId, token).then((data) => new Structures.Webhook(this.client, data));}
}

module.exports = RestClient;