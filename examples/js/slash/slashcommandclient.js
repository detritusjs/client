const { Constants, SlashCommandClient } = require('../../../lib');
const { ApplicationCommandOptionTypes, InteractionCallbackTypes } = Constants;


const guildId = '';
const token = '';
const slashClient = new SlashCommandClient(token);

slashClient.add({
  description: 'ping!',
  name: 'ping',
  run: (context) => context.respond({data: {content: 'pong'}, type: InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE}),
});

slashClient.add({
  description: 'cat stuff',
  name: 'cat',
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
          return context.respond({data: {content: 'cat video but long'}, type: InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE});
        }
        return context.respond({data: {content: 'cat video'}, type: InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE});
      },
    },
  ],
});


(async () => {
  const cluster = await slashClient.run();
  if (guildId) {
    await cluster.rest.bulkOverwriteApplicationGuildCommands(cluster.applicationId, guildId, slashClient.commands);
  } else {
    await cluster.rest.bulkOverwriteApplicationCommands(cluster.applicationId, slashClient.commands);
  }
  console.log('running');
})();
