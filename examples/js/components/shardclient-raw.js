const { ShardClient } = require('../../../lib');
const { InteractionCallbackTypes, InteractionTypes, MessageComponentTypes } = require('../../../lib/constants');


const token = '';
const client = new ShardClient(token);

client.on('messageCreate', async ({message}) => {
  if (message.content === 'test' && message.author.isClientOwner) {
    await message.reply({
      content: 'test',
      components: [
        {
          components: [
            {customId: 'test', label: 'Test', type: MessageComponentTypes.BUTTON},
          ],
          type: MessageComponentTypes.ACTION_ROW,
        }
      ],
    });
  }
});

client.on('interactionCreate', async ({interaction}) => {
  switch (interaction.type) {
    case InteractionTypes.MESSAGE_COMPONENT: {
      await interaction.respond({type: InteractionCallbackTypes.DEFERRED_MESSAGE_UPDATE});
    }; break;
  }
});

(async () => {
  await client.run();
})();
