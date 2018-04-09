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
		if (typeof cmd === 'function') {cmd = {class: cmd};}

		const command = new cmd.class(this);
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
		return new Promise((resolve, reject) => {
			fs.readdir(directory, (error, files) => {
				return (error) ? reject(error) : resolve(files);
			});
		}).then((files) => {
			files.forEach((file) => {
				const filePath = path.resolve(directory, file);
				const command = require(filePath);
				if (typeof command === 'function') {
					this.registerCommand({
						class: command,
						file: filePath
					});
				}
			});
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
				return reject(new Error('Message is not from a user.'));
			}
			if (message.editedTimestamp && false) {
				return reject(new Error('Edit timestamp higher than max edit.'));
			} //check editedTimestamp for the max edit duration thing

			const attributes = this.getAttributes(message.content.split(' '));
			if (!attributes) {return reject(new Error('Does not start with any allowed prefixes.'));}

			const command = this.getCommand(attributes.args);
			if (!command) {return reject(new Error('No command found.'));}

			if (!command.responseOptional && !channel.isDm) {
				const bot = this.client.members.get(channel.guildId, this.client.user.id);
				if (!bot) {
					const error = new Error('Cannot send messages in this channel.');
					error.code = 0;
					error.command = command;
					return reject(error);
				} //do permission check
			}

			if (command.ratelimit) {
				let ratelimitId;
				switch (command.ratelimit.settings.type) {
					case 'channel': {
						ratelimitId = channel.id;
					}; break;
					case 'guild': {
						ratelimitId = (channel.isDm) ? channel.id : channel.guildId;
					}; break;
					default: {
						ratelimitId = message.author.id;
					};
				}
				const ratelimit = command.getRatelimit(ratelimitId);
				if (ratelimit.usages + 1 > command.ratelimit.settings.limit) {
					const error = new Error('Ratelimited');
					error.code = 1;
					error.command = command;
					error.ratelimit = ratelimit;
					return reject(error);
				} else {
					ratelimit.usages++;
				}
			}

			if (command.disableDm && channel.isDm) {
				const error = new Error('Command with DMs disabled used in DM.');
				error.code = 0;
				error.command = command;
				message.reply(`Cannot use \`${command.name}\` in DMs.`);
				return reject(error);
			}

			resolve({command, attributes});
		}).then(({command, attributes}) => {
			const prefix = attributes.prefix;
			const args = command.getArgs(attributes.args);
	
			return Promise.resolve(command.run(message, args)).then(() => {
				this.emit('COMMAND_RUN_SUCCESS', {message, command, prefix, args});
			}).catch((error) => {
				this.emit('COMMAND_RUN_FAIL', {message, command, prefix, args, error});
			});
		}).catch((error) => {
			switch (error.code) {
				case 0: {
					this.emit('COMMAND_FAIL', {message, error});
				}; break;
				case 1: {
					const remaining = (error.ratelimit.start + (error.command.ratelimit.settings.duration * 1000) - Utils.Tools.now());
					this.emit('COMMAND_FAIL_RATELIMIT', {message, error, remaining});
				}; break;
				default: {
					this.emit('COMMAND_NONE', {message, error});
				};
			}
		});
	}

	run(options)
	{
		options = Object.assign({}, options, {waitUntilReady: true, thirdPartyLaunch: true});
		return new Promise((resolve, reject) => {
			this.client.on('MESSAGE_CREATE', this.handle.bind(this, 'MESSAGE_CREATE'));
			this.client.on('MESSAGE_UPDATE', this.handle.bind(this, 'MESSAGE_UPDATE'));
			this.client.run(options).then(() => {
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