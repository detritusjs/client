const { BaseContextMenuUserCommand } = require('../../basecommand');


const COMMAND_NAME = 'Information';

class InformationCommand extends BaseContextMenuUserCommand {
  name = COMMAND_NAME;

  async run(context, args) {
    return context.editOrRespond(`information about ${args.member || args.user} here`);
  }
}

module.exports = InformationCommand;
