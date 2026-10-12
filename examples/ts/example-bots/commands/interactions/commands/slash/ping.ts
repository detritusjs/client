import { Interaction } from 'detritus-client';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'ping';

export default class PingCommand extends BaseSlashCommand {
  description = 'Ping';
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext) {
    const { gateway, rest } = await context.client.ping();
    return context.editOrRespond(`pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
  }
}
