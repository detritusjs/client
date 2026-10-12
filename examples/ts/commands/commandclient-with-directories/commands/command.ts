import { Command } from 'detritus-client';


export default {
  name: 'lol',
  run: (context: Command.Context) => context.reply('stop'),
};
