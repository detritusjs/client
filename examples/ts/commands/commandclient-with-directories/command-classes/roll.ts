import { Command, CommandClient } from 'detritus-client';

import { BaseCommand } from './basecommand';


export interface CommandArgs {
  amount: number,
}

export default class RollCommand extends BaseCommand<CommandArgs> {
  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      name: 'roll',

      // choices will be [1, 2, ..., 20]
      choices: Array.from({length: 20}).map((v, key) => key + 1),
      default: 1,
      help: 'Can only roll 1 to 20 times',
      label: 'amount',
      type: Number,
    });
  }

  run(context: Command.Context, args: CommandArgs) {
    const { amount } = args;

    const rolls: Array<number> = [];
    for (let i = 0; i < amount; i++) {
      rolls.push(Math.round(Math.random() * 100));
    }
    return context.editOrReply(`Rolls: ${rolls.join(', ')}`);
  }
}
