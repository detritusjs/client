class Context {
	constructor(message, client, commandClient) {
		Object.defineProperties(this, {
			message: {value: message},
			client: {value: client},
			commandClient: {value: commandClient}
		});
	}

	get shardId() {return this.client.shardId;}
	get shardCount() {return this.client.shardCount;}
	get rest() {return this.client.rest;}

	get channels() {return this.client.channels;}
	get emojis() {return this.client.emojis;}
	get guilds() {return this.client.guilds;}
	get members() {return this.client.members;}
	get messages() {return this.client.messages;}
	get presences() {return this.client.presences;}
	get users() {return this.client.users;}
	get voiceConnections() {return this.client.voiceConnections;}
	get voiceStates() {return this.client.voiceStates;}
	
	get channelId() {return this.message.channelId;}
	get guildId() {return this.message.guildId;}
	get messageId() {return this.message.id;}
	get userId() {return this.message.author.id;}

	get inDm() {return this.message.inDm;}

	get content() {return this.message.content;}
	get channel() {return this.message.channel;}
	get guild() {return this.message.guild;}
	get member() {return this.message.member;}
	get user() {return this.message.author;}

	reply(data) {return this.message.reply(data);}

	toJSON() {return this.message;}
	toString() {return `Context (${this.messageId})`;}
}

module.exports = Context;