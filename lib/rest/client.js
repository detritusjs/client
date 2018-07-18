'use strict';

const DetritusRest = require('detritus-client-rest');

const BaseCollection = require('../collections/basecollection');
const Structures = require('../structures');

class RestClient extends DetritusRest.Client {
	constructor(token, options, client) {
		super(token, options);

		Object.defineProperty(this, 'client', {value: client});
	}

	createChannel(guildId, body) {
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

	createDm(recipient_id) {
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

	createGuild(body) {
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

	createGuildEmoji(guildId, body) {
		return super.createGuildEmoji.call(this, guildId, body).then((data) => {
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

	createGuildRole(guildId, body) {
		return super.createGuildRole.call(this, guildId, body).then((data) => {
			const role = new Structures.Role(this.client, Object.assign(data, {guild_id: guildId}));
			if (this.client.guilds.has(guildId)) {
				this.client.guilds.get(guildId).roles.set(role.id, role);
			}
			return role;
		});
	}

	createInvite(channelId, body) {
		return super.createInvite.call(this, channelId, body).then((data) => new Structures.Invite(this.client, data));
	}

	createMessage(channelId, body) {
		return super.createMessage.call(this, channelId, body).then((data) => {
			if (this.client.channels.has(data.channel_id)) {
				data.guild_id = this.client.channels.get(data.channel_id).guildId;
			}
			const message = new Structures.Message(this.client, data);
			this.client.messages.insert(message);
			return message;
		});
	}

	createWebhook(channelId, body) {
		return super.createWebhook.call(this, channelId, body).then((data) => new Structures.Webhook(this.client, data));
	}

	deleteChannel(channelId) {
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

	deleteInvite(code) {
		return super.deleteInvite.call(this, code).then((data) => new Structures.Invite(this.client, data));
	}

	editChannel(channelId, body) {
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

	//put these edits in cache? event wont have differences then

	editGuild(guildId, body) {
		return super.editGuild.call(this, guildId, body);
	}

	editGuildEmoji(guildId, emojiId, body) {
		return super.editGuildEmoji.call(this, guildId, emojiId, body);
	}

	editGuildMember(guildId, userId, body) {
		return super.editGuildMember.call(this, guildId, userId, body);
	}

	//returns role object
	editGuildRole(guildId, roleId, body) {
		return super.editGuildRole.call(this, guildId, roleId, body);
	}

	//returns list of role objects
	editGuildRolePositions(guildId, body) {
		return super.editGuildRolePositions.call(this, guildId, body);
	}

	editMessage(channelId, messageId, body) {
		return super.editMessage.call(this, channelId, messageId, body).then((data) => {
			let message;
			if (this.client.messages.has(data.id)) {
				message = this.client.messages.get(data.id);
				message.merge(data);
			} else {
				message = new Structures.Message(this.client, data);
				this.client.messages.insert(message);
			}
			return message;
		});
	}

	editSettings(body) {
		return super.editSettings.call(this, body).then((data) => {
			let settings;
			if (this.client.settings) {
				settings = this.client.settings;
				settings.merge(data);
			} else {
				settings = new Structures.UserSettings(data);
				Object.defineProperty(this.client, 'settings', {value: settings});
			}
			return settings;
		});
	}

	//returns user object of own user
	editUser(body) {
		return super.editUser.call(this, body);
	}

	editWebhook(webhookId, body) {
		return super.editWebhook.call(this, webhookId, body).then((data) => new Structures.Webhook(this.client, data));
	}

	editWebhookToken(webhookId, token, body) {
		return super.editWebhookToken.call(this, webhookId, token, body).then((data) => new Structures.Webhook(this.client, data));
	}
	
	executeWebhook(webhookId, token, body, compatible) {
		return super.executeWebhook.call(this, webhookId, token, body, compatible).then((data) => {
			if (body.wait) {
				const message = new Structures.Message(this.client, data);
				this.client.messages.insert(message);
				return message;
			} else {
				return data;
			}
		});
	}

	fetchApplications() {
		return super.fetchApplications.call(this).then((data) => {
			const applications = new BaseCollection();
			for (let raw of data) {
				applications.set(raw.id, new Structures.Application(this.client, raw));
			}
			return applications;
		});
	}

	fetchChannelInvites(channelId) {
		return super.fetchChannelInvites.call(this, channelId).then((data) => {
			const invites = new BaseCollection();
			for (let raw of data) {
				invites.set(raw.code, new Structures.Invite(this.client, raw));
			}
			return invites;
		});
	}

	fetchChannelWebhooks(channelId) {
		return super.fetchChannelWebhooks.call(this, channelId).then((data) => {
			const webhooks = new BaseCollection();
			for (let raw of data) {
				webhooks.set(raw.id, new Structures.Webhook(this.client, raw));
			}
			return webhooks;
		});
	}

	fetchDms() {
		return super.fetchDms.call(this).then((data) => {
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

	fetchGuilds() {
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

	fetchGuild(guildId) {
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

	fetchGuildAuditLogs(guildId, query) {
		return super.fetchGuildAuditLogs.call(this, guildId, query).then((data) => {
			const auditLogs = new BaseCollection();

			for (let raw of data.audit_log_entries) {
				let target;
				if (this.client.users.has(raw.target_id)) {
					target = this.client.users.get(raw.target_id);
					//target.merge(data.users.find((user) => user.id === raw.target_id));
				} else {
					target = data.users.find((user) => user.id === raw.target_id);
				}
				if (target) {
					target = new Structures.User(this.client, target);
				} else {
					target = data.webhooks.find((webhook) => webhook.id === raw.target_id);
					target = (target) ? new Structures.Webhook(this.client, target) : null;
				}

				Object.assign(raw, {target, guild_id: guildId});
				const auditLog = new Structures.AuditLog(this.client, raw);
				auditLogs.set(auditLog.id, auditLog);
			}
			
			return auditLogs;
		});
	}

	fetchGuildBans(guildId) {
		return super.fetchGuildBans.call(this, guildId).then((data) => {
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

	fetchGuildEmoji(guildId, emojiId) {
		return super.fetchGuildEmoji.call(this, guildId, emojiId).then((data) => {
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

	fetchGuildEmojis(guildId) {
		return super.fetchGuildEmojis.call(this, guildId).then((data) => {
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

	fetchGuildInvites(guildId) {
		return super.fetchGuildInvites.call(this, guildId).then((data) => {
			const invites = new BaseCollection();
			for (let raw of data) {
				invites.set(raw.code, new Structures.Invite(this.client, raw));
			}
			return invites;
		});
	}

	fetchGuildMember(guildId, userId) {
		return super.fetchGuildMember.call(this, guildId, userId).then((data) => {
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

	fetchGuildMembers(guildId, query) {
		return super.fetchGuildMembers.call(this, guildId, query).then((data) => {
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

	fetchGuildWebhooks(guildId) {
		return super.fetchGuildWebhooks.call(this, guildId).then((data) => {
			const webhooks = new BaseCollection();
			for (let raw of data) {
				webhooks.set(raw.id, new Structures.Webhook(this.client, raw));
			}
			return webhooks;
		});
	}

	fetchInvite(code, query) {
		return super.fetchInvite.call(this, code, query).then((data) => new Structures.Invite(this.client, data));
	}

	fetchMessage(channelId, messageId) {
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

	fetchMessages(channelId, query) {
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

	fetchOauth2Application(applicationId) {
		if (!applicationId) {applicationId = '@me';}
		return super.fetchOauth2Application.call(this, applicationId).then((data) => {
			if (applicationId !== '@me') {return data;}

			let user;
			if (this.client.users.has(data.owner.id)) {
				user = this.client.users.get(data.owner.id);
				user.merge(data.owner);
			} else {
				user = new Structures.User(this.client, data.owner);
				this.client.users.insert(user);
			}

			if (this.client.owner) {
				this.client.owner.merge(user);
			} else {
				Object.defineProperty(this.client, 'owner', {value: user});
			}

			return Object.assign(data, {owner: user});
		});
	}

	fetchPinnedMessages(channelId) {
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

	fetchProfile(userId) {
		return super.fetchProfile.call(this, userId).then((data) => new Structures.Profile(this.client, data));
	}

	fetchReactions(channelId, messageId, emoji, query) {
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

	fetchRoles(guildId) {
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

	fetchUser(userId) {
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

	fetchWebhook(webhookId) {
		return super.fetchWebhook.call(this, webhookId).then((data) => new Structures.Webhook(this.client, data));
	}

	fetchWebhookToken(webhookId, token) {
		return super.fetchWebhookToken.call(this, webhookId, token).then((data) => new Structures.Webhook(this.client, data));
	}
}

module.exports = RestClient;