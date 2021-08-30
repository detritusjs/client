import { Interaction } from 'detritus-client';

import { BaseContextMenuUserCommand, ContextMenuUserArgs } from '../../basecommand';


export const COMMAND_NAME = 'Information';

export default class InformationCommand extends BaseContextMenuUserCommand {
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: ContextMenuUserArgs) {
    return context.editOrRespond(`information about ${args.member || args.user} here`);
  }
}
