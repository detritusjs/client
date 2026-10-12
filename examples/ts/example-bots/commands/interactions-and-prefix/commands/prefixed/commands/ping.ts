import { Command, CommandClient } from 'detritus-client';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ping';

export default class PingCommand extends BaseCommand {
  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {...options, name: COMMAND_NAME});
  }

  async run(context: Command.Context) {
    const { gateway, rest } = await context.client.ping();
    return context.editOrReply({
      content: `Pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`,
      reference: true,
    });
  }
}
