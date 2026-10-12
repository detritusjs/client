const { BaseContextMenuMessageCommand } = require('../../basecommand');


const COMMAND_NAME = 'ID';

class InformationCommand extends BaseContextMenuMessageCommand {
  name = COMMAND_NAME;

  async run(context, args) {
    const { message } = args;
    return context.editOrRespond(`Message ID is ${message.id}, created at ${message.createdAt}`);
  }
}

module.exports = InformationCommand;
