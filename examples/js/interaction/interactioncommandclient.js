const { Constants, InteractionCommandClient } = require('../../../lib');
const { ApplicationCommandOptionTypes, ApplicationCommandTypes, InteractionCallbackTypes, MessageFlags } = Constants;


const guildId = '';
const token = '';
const interactionClient = new InteractionCommandClient(token);

interactionClient.add({
  description: 'ping!',
  name: 'ping',
  run: (context) => context.respond({data: {content: 'pong'}, type: InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE}),
});

interactionClient.add({
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


// default values and custom values
interactionClient.add({
  name: 'search',
  description: 'Search Something',
  options: [
    // options will default as a string
    {name: 'query', description: 'Search Query', required: true, value: (value, context) => value.slice(0, 2000)}, // `value: (value, context) => any` errors will be given in the invoker's function `onValueError: (context, args, errors) => any`
    {name: 'randomize', description: 'Randomize the results', default: true, type: ApplicationCommandOptionTypes.BOOLEAN}, // or `default: (context) => true`
  ],
  run: (context, args) => {
    // args.randomize should default as true if the user doesn't input anything
    // args.query should be limited to 2000 characters, can return anything though
  },
});

// Context Menu User Command
interactionClient.add({
  name: 'Poke',
  type: ApplicationCommandTypes.USER,
  run: (context, args) => {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `You poked ${args.member || args.user}`,
      flags: MessageFlags.EPHEMERAL,
    });
  },
});

// Context Menu Message Command (tells you when the message was created)
interactionClient.add({
  name: 'Creation Date',
  guildIds: [], // you can make it a guild command
  type: ApplicationCommandTypes.MESSAGE,
  run: async (context, args) => {
    const { message } = args;
    await context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `${message.id} was made at ${message.createdAt}`,
      flags: MessageFlags.EPHEMERAL,
    });
  },
});


(async () => {
  const cluster = await interactionClient.run();
  console.log('running');
})();
