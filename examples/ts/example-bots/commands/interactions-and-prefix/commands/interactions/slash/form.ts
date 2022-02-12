import { Interaction } from 'detritus-client';
import { InteractionModal, InteractionModalContext } from 'detritus-client/lib/utils';

import { BaseSlashCommand } from '../baseslashcommand';


export interface QuestionnaireArgs {
  cats: string,
  birds: string,
}


export const COMMAND_NAME = 'form';

export default class FormCommand extends BaseSlashCommand {
  description = 'some random form';
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext) {
    const modal = new InteractionModal({
      timeout: 5 * 60 * 1000, // 5 mins, (default is 10 minutes)
      title: 'My Cool Questionaire!',
      run: (modalContext: InteractionModalContext, args: QuestionnaireArgs) => {
        // args will use the defined customId in the text inputs (args.birds, args.cats)
        return modalContext.createMessage(`${args.birds}, ${args.cats}`);
      },
      onTimeout: () => {
        return context.createMessage('Answer my questions faster next time please');
      },
    });

    modal.createInputText({
      customId: 'birds',
      label: 'Do you like birds?',
      maxLength: 120,
      minLength: 2,
      required: true,
    });

    modal.createInputText({
      customId: 'cats',
      label: 'Do you like cats?',
      maxLength: 120,
      minLength: 2,
      required: true,
    });

    return context.respond(modal);
  }
}
