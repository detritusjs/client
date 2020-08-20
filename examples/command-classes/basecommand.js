const { Command } = require('../../lib');


// Use this to have just one class handle all the type errors
class BaseCommand extends Command.Command {
  triggerTypingAfter = 1000;

  onTypeError(context, args, errors) {
    const description = ['ERRORS'];
    for (let key in errors) {
      description.push(`**${key}**: ${errors[key].message}`);
    }
    return context.editOrReply(description.join('\n'));
  }
}

module.exports.BaseCommand = BaseCommand;
