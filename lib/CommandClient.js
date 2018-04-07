const fs = require('fs');
const path = require('path');

const Client = require('./Client.js');
const Utils = require('./Utils');

class CommandClient extends Utils.EventEmitter
{
	constructor(options, client)
	{
		super();

		this.options = options || {};
		this.client = client || new Client(this.options);

		this.prefixes = {
			custom: (this.options.prefixes || []).sort((x, y) => x.length < y.length),
			mention: []
		};
		
		this.maxEditDuration = this.options.maxEditDuration || 0;

		this.commands = [];
	}

	clearCommands()
	{
		this.commands.forEach((command) => {
			if (!command.file) {return;}
			const mod = require.resolve(command.file);
			if (!mod) {return;}
			delete require.cache[mod];
		});
		this.commands.length = 0;
	}

	registerCommand(cmd)
	{
		console.log(cmd);
		if (typeof cmd === 'function') {cmd = {class: cmd};}

		const command = new cmd.class(this.client);
		command.file = cmd.file || null;

		if (this.commands.some((c) => c.name === command.name || c.aliases.includes(command.name))) {
			throw new Error(`Alias/name ${command.name} already exists.`);
		}

		for (let alias of command.aliases) {
			if (this.commands.some((c) => c.name === alias || c.aliases.includes(alias))) {
				throw new Error(`Alias/name ${alias} already exists.`);
			}
		}

		this.commands.push(command);
	}

	registerCommands(commands)
	{
		commands.forEach((cmd) => {
			this.registerCommand(cmd);
		});
	}

	registerCommandsIn(directory)
	{
		fs.readdirSync(directory).forEach((file) => {
			const filePath = path.resolve(directory, file);
			const command = require(filePath);
			if (typeof command === 'function') {
				this.registerCommand({
					class: command,
					file: filePath
				});
			}
		});
	}

	getAttributes(args)
	{
		const attributes = {args};

		if (!attributes.args.length) {return;}

		if (this.options.prefixSpace) {
			attributes.prefix = args.shift().toLowerCase();
			if (!this.prefixes.custom.includes(attributes.prefix) && !this.prefixes.mention.includes(attributes.prefix)) {return;}
			if (!args.length) {return;}
		} else {
			const first = attributes.args[0].toLowerCase();
			for (let prefix of this.prefixes.custom) {
				if (first.startsWith(prefix)) {
					attributes.prefix = first.substring(0, prefix.length);
					break;
				}
			}
			if (attributes.prefix) {
				attributes.args[0] = attributes.args[0].substring(attributes.prefix.length);
			} else {
				for (let prefix of this.prefixes.mention) {
					if (first === prefix) {
						attributes.prefix = attributes.args.shift();
					}
				}
			}
		}

		if (!attributes.prefix) {return;}

		return attributes;
	}

	getCommand(args)
	{
		const command = args.shift().toLowerCase();
		return this.commands.find((cmd) => cmd.check(command));
	}

	handle(name, event)
	{
		let message;
		switch (name) {
			case 'MESSAGE_CREATE': {
				message = event.message;
			}; break;
			case 'MESSAGE_UPDATE': {
				message = event.new;
			}; break;
		}
		if (!message) {return;}

		const channel = message.channel;
		if (!channel) {return;}

		return new Promise((resolve, reject) => {
			if (!message.fromUser) {
				return resolve({error: new Error('Message is not from a user.')});
			}
			if (message.editedTimestamp && false) {
				return resolve({error: new Error('Edit timestamp higher than max edit.')});
			} //check editedTimestamp for the max edit duration thing

			const attributes = this.getAttributes(message.content.split(' '));
			if (!attributes) {return resolve();}

			const command = this.getCommand(attributes.args);
			if (!command) {return resolve();}

			if (!command.responseOptional && !channel.isDm) {
				const bot = this.client.members.get(channel.guildId, this.client.user.id);
				if (!bot) {
					return resolve({command, error: 'Cannot send messages in this channel.'});
				} //do permission check
			}

			if (command.ratelimit) {
				const ratelimitType = command.ratelimit.type || 'user';
				let ratelimitId;
				if (ratelimitType === 'channel' || channel.isDm) {
					ratelimitId = channel.id;
				} else if (ratelimitType === 'guild') {
					ratelimitId = message.guild.id;
				} else {
					ratelimitId = message.author.id;
				}
				const ratelimit = command.getRatelimit(ratelimitId);
				if (ratelimit.usages + 1 > command.ratelimit.limit) {
					if (!ratelimit.replied) {
						const remaining = (ratelimit.start + (command.ratelimit.duration * 1000) - Utils.Tools.now()) / 1000;
						const noun = (ratelimitType === 'guild' || ratelimitType === 'channel') ? 'you guys' : 'you';
						message.reply(`You're using \`${command.name}\` too fast, ${noun} cannot use it for another ${remaining.toFixed(1)} seconds.`).catch(() => {});
						ratelimit.replied = setTimeout(() => {
							ratelimit.replied = false;
						}, remaining * 1000);
					}
					return resolve({command, error: new Error('Ratelimited')});
				} else {
					ratelimit.usages++;
				}
			}

			if (command.disableDm && channel.isDm) {
				message.reply(`Cannot use \`${command.name}\` in DMs.`);
				return resolve({command, error: 'Command with DMs disabled used in DM.'});
			}

			resolve({
				prefix: attributes.prefix,
				args: command.getArgs(attributes.args),
				command
			});
		}).then((info) => {
			if (!info) {return this.emit('COMMAND_NONE', {message});}

			if (info.error) {
				return this.emit('COMMAND_FAIL', Object.assign(info, {message}));
			}

			return Promise.resolve(info.command.run(message, info.args)).then((response) => {
				this.emit('COMMAND_RUN_SUCCESS', Object.assign(info, {message}));
			}).catch((e) => {
				this.emit('COMMAND_RUN_FAIL', Object.assign(info, {message}));
			});
		}).catch(console.error);
	}

	run()
	{
		return new Promise((resolve, reject) => {
			this.client.on('MESSAGE_CREATE', this.handle.bind(this, 'MESSAGE_CREATE'));
			this.client.on('MESSAGE_UPDATE', this.handle.bind(this, 'MESSAGE_UPDATE'));
			this.client.run({waitUntilReady: true}).then(() => {
				if (this.options.mentions) {
					this.prefixes.mention.push(this.client.user.mention);
					this.prefixes.mention.push(`<@!${this.client.user.id}>`);
				}
				resolve();
			}).catch(reject);
		});
	}
}

CommandClient.Command = require('./Command');
module.exports = CommandClient;