import { ShardClient } from 'detritus-client';
import { InteractionCallbackTypes, InteractionTypes } from 'detritus-client/lib/constants';
import { ComponentActionRow } from 'detritus-client/lib/utils';


const token = '';
const client = new ShardClient(token);

client.on('messageCreate', async ({message}) => {
  if (message.content === 'test' && message.author.isClientOwner) {
    const actionRow = new ComponentActionRow();
    actionRow.createButton({customId: 'test', label: 'Test'});

    await message.reply({
      content: 'test',
      components: [actionRow],
    });
  }
});

client.on('interactionCreate', async ({interaction}) => {
  switch (interaction.type) {
    case InteractionTypes.MESSAGE_COMPONENT: {
      await interaction.respond({type: InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE});
    }; break;
  }
});

(async () => {
  await client.run();
})();
