const { BaseSlashCommand } = require('../basecommand');


const COMMAND_NAME = 'ping';

class PingCommand extends BaseSlashCommand {
  description = 'Ping';
  name = COMMAND_NAME;

  async run(context) {
    const { gateway, rest } = await context.client.ping();
    return context.editOrRespond(`pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
  }
}

module.exports = PingCommand;
