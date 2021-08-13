const { Constants, InteractionCommandClient, Utils } = require('../../../lib');
const { ApplicationCommandOptionTypes, ApplicationCommandTypes, InteractionCallbackTypes, MessageFlags } = Constants;
const { ComponentActionRow } = Utils;


const guildId = '';
const token = '';
const interactionClient = new InteractionCommandClient(token);

interactionClient.add({
  description: 'ping!',
  name: 'ping',
  guildIds: [guildId],
  run: (context) => {
    const actionRow = new ComponentActionRow();
    actionRow.createButton({
      label: 'ping, but clear buttons',
      run: (componentContext) => componentContext.editOrRespond({content: 'pong from the button!', components: []}),
    });
    actionRow.createButton({
      label: 'ping, but respond',
      run: (componentContext) => {
        return componentContext.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
          content: 'pong!',
          flags: MessageFlags.EPHEMERAL,
        });
      },
    });
    return context.editOrRespond({content: 'pong!', components: [actionRow]});
  },
});


(async () => {
  const cluster = await interactionClient.run();
  console.log('running');
})();
