import { Interaction } from 'detritus-client';

import { BaseSlashCommand } from '../baseslashcommand';


const Tags = ['bot', 'botdiscord', 'botdetritus']; // just some random stuff


export interface CommandArgs {
  name: string,
}

export const COMMAND_NAME = 'tag';

export default class TagCommand extends BaseSlashCommand {
  description = 'Show a cool tag';
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag to show',
          onAutoComplete: (context: Interaction.InteractionAutoCompleteContext) => {
            let choices: Array<{name: string, value: string}>;
            if (context.value) {
              const value = context.value.toLowerCase();
              choices = Tags.filter((tag) => tag.includes(value)).map((x) => {
                return {name: x, value: x};
              });
            } else {
              choices = Tags.map((value) => ({name: value, value}));
            }
            return context.respond({choices});
          },
        },
      ],
    });
  }

  // args.name might be a custom value they typed in without selecting, so check it out
  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return Tags.includes(args.name);
  }

  onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return context.editOrRespond('You must choose from the list!');
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return context.editOrRespond(`Show tag content for ${args.name} here`);
  }
}
