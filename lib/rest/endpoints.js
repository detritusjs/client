const RestClient = require('detritus-client-rest');

const Structures = require('../structures');

class Endpoints extends RestClient.Endpoints
{
	constructor(rest)
	{
		super(rest);
	}

	get client() {return this.rest.client;}

	createChannel(guildId, body)
	{
		return super.createChannel.call(this, guildId, body).then((response) => {
			let channel;
			if (this.client.channels.has(response.data.id)) {
				channel = this.client.channels.get(response.data.id);
				channel.merge(response.data);
				//this should never happen lol
			} else {
				channel = Structures.Channel.create(this.client, response.data);
				this.client.channels.insert(channel);
			}
			return channel;
		});
	}

	createDm(recipient_id)
	{
		return super.createDm.call(this, recipient_id).then((response) => {
			let channel;
			if (this.client.channels.has(response.data.id)) {
				channel = this.client.channels.get(response.data.id);
				channel.merge(response.data);
			} else {
				channel = Structures.Channel.create(this.client, response.data);
				this.client.channels.insert(channel);
			}
			return channel;
		});
	}

	createEmoji(guildId, body)
	{
		return super.createEmoji.call(this, guildId, body).then((response) => {
			let emoji;
			if (this.client.emojis.has(response.data.id)) {
				emoji = this.client.emojis.get(response.data.id);
				emoji.merge(response.data);
			} else {
				emoji = new Structures.Emoji(this.client, response.data);
				this.client.emojis.insert(emoji);
			}
			return emoji;
		});
	}

	createGuild(body)
	{
		return super.createGuild.call(this, body).then((response) => {
			let guild;
			if (this.client.guilds.has(response.data.id)) {
				guild = this.client.guilds.get(response.data.id);
				guild.merge(response.data);
			} else {
				guild = new Structures.Guild(this.client, response.data);
				this.client.guilds.insert(guild);
			}
			return guild;
		});
	}

	createGuildIntegration(guildId, body) {}

	createInvite(channelId, body) {return super.createInvite.call(this, channelId, body).then((response) => new Structures.Invite(this.client, response.data));}

	createMessage(channelId, body)
	{
		return super.createMessage.call(this, channelId, body).then((response) => {
			const message = new Structures.Message(this.client, response.data);
			this.client.messages.insert(message);
			return message;
		});
	}

	createReaction(channelId, messageId, emoji) {return super.createReaction.call(this, channelId, messageId, emoji).then(() => {});}

	createRole(guildId, body)
	{
		return super.createRole.call(this, guildId, body).then((response) => {
			const role = new Structures.Role(this.client, Object.assign(response.data, {guild_id: guildId}));
			if (this.client.guilds.has(guildId)) {
				this.client.guilds.get(guildId).roles.set(role.id, role);
			}
			return role;
		});
	}

	createWebhook(channelId, body) {return super.createWebhook.call(this, channelId, body).then((response) => new Structures.Webhook(this.client, response.data));}

	deleteChannel(channelId)
	{
		return super.deleteChannel.call(this, channelId).then((response) => {
			let channel;
			if (this.client.channels.has(response.data.id)) {
				channel = this.client.channels.get(response.data.id);
				this.client.channels.delete(response.data.id);
				channel.merge(response.data);
			} else {
				channel = Structures.Channel.create(this.client, response.data);
			}
			return channel;
		});
	}

	deleteChannelOverwrite(channelId, overwriteId) {return super.deleteChannelOverwrite.call(this, channelId, overwriteId).then(() => {});}
	deleteEmoji(guildId, emojiId) {return super.deleteEmoji.call(this, guildId, emojiId).then(() => {});}
	deleteGuild(guildId) {return super.deleteGuild.call(this, guildId).then(() => {});}
	
	deleteInvite(code)
	{
		return super.deleteInvite.call(this, code).then((response) => {

		});
	}

	fetchGateway() {return super.fetchGateway.call(this).then((r) => r.data);}
	fetchGatewayBot() {return super.fetchGatewayBot.call(this).then((r) => r.data);}

	fetchVoiceRegions() {return super.fetchVoiceRegions.call(this).then((r) => r.data);}
}

module.exports = Endpoints;