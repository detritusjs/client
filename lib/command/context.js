class Context
{
	constructor(message, client)
	{
		Object.defineProperties(this, {
			message: {enumerable: true, value: message},
			client: {enumerable: true, value: client}
		});
	}

	get shardId() {return this.client.shardId;}
	get rest() {return this.client.rest;}
	
	get channelId() {return this.message.channelId;}
	get guildId() {return this.message.guildId;}
	get userId() {return this.message.author.id;}

	get content() {return this.message.content;}
	get channel() {return this.message.channel;}
	get guild() {return this.message.guild;}
	get member() {return this.message.member;}
	get user() {return this.message.author;}

	reply(data) {return this.message.reply(data);}
}

module.exports = Context;