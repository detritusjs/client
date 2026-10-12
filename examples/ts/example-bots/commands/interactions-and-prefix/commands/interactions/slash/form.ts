import { Interaction } from 'detritus-client';
import { InteractionModal, InteractionModalArgs, InteractionModalContext } from 'detritus-client/lib/utils';

import { BaseSlashCommand } from '../basecommand';


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
      run: (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
        // args will use the defined customId in the text inputs (args.birds, args.cats)
        const { birds, cats } = args as QuestionnaireArgs;
        return modalContext.createMessage(`${birds}, ${cats}`);
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

    // pass the modal itself (not its json), so its `run` gets called when it's submitted
    return context.respond(modal);
  }
}
