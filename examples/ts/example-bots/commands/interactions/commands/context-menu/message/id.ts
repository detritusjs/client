import { Interaction } from 'detritus-client';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export const COMMAND_NAME = 'ID';

export default class InformationCommand extends BaseContextMenuMessageCommand {
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: ContextMenuMessageArgs) {
    const { message } = args;
    return context.editOrRespond(`Message ID is ${message.id}, created at ${message.createdAt}`);
  }
}
