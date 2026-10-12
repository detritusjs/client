const { BaseCommand } = require('../basecommand');


const COMMAND_NAME = 'ping';

class PingCommand extends BaseCommand {
  constructor(client, options) {
    super(client, {...options, name: COMMAND_NAME});
  }

  async run(context) {
    const { gateway, rest } = await context.client.ping();
    return context.editOrReply({
      content: `Pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`,
      reference: true,
    });
  }
}

module.exports = PingCommand;
