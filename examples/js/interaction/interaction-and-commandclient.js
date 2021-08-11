const { ClusterClient, CommandClient, Constants, InteractionCommandClient } = require('../../../lib');
const { ApplicationCommandOptionTypes, InteractionCallbackTypes } = Constants;

const token = '';
const cluster = new ClusterClient(token);


const commandClient = new CommandClient(cluster, {
  prefix: '..',
});

commandClient.add({
  name: 'ping',
  run: (context) => context.reply('pong!'),
});



const guildId = '';
const interactionClient = new InteractionCommandClient(cluster);

interactionClient.add({
  description: 'ping!',
  name: 'ping',
  guildIds: [guildId],
  run: (context) => context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, 'pong!'),
});

interactionClient.add({
  description: 'cat stuff',
  name: 'cat',
  guildIds: [guildId],
  options: [
    {
      description: 'cat image',
      name: 'image',
      run: (context) => context.respond({data: {content: 'cat image'}, type: InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE}),
    },
    {
      description: 'cat video',
      name: 'video',
      options: [
        {description: 'long videos only', name: 'long', type: ApplicationCommandOptionTypes.BOOLEAN},
      ],
      run: (context, args) => {
        if (args.long) {
          // get long videos here
          return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, 'cat video but long');
        }
        return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, 'cat video');
      },
    },
  ],
});


(async () => {
  await cluster.run();
  console.log('cluster ran');
  await commandClient.run();
  await interactionClient.run();
  console.log('running');
})();
