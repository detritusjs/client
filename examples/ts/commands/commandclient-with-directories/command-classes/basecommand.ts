import { Command } from 'detritus-client';


// Use this to have just one class handle all the type errors
export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  triggerTypingAfter = 1000;

  onTypeError(context: Command.Context, args: Command.ParsedArgs, errors: Command.ParsedErrors) {
    const description = ['ERRORS'];
    for (let key in errors) {
      description.push(`**${key}**: ${errors[key].message}`);
    }
    return context.editOrReply(description.join('\n'));
  }
}
