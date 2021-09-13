import { ClusterClient, CommandClient, InteractionCommandClient } from 'detritus-client';
import { ActivityTypes, PresenceStatuses } from 'detritus-client/lib/constants';


const PREFIX = '!';

const TOKEN = '';
const cluster = new ClusterClient(TOKEN, {
  gateway: {
    presence: {
      activity: {name: `for ${PREFIX}`, type: ActivityTypes.WATCHING},
      status: PresenceStatuses.ONLINE,
    },
  },
});

(async () => {
  try {
    await cluster.run();
    const shardsText = `Shards #(${cluster.shards.map((shard) => shard.shardId).join(', ')})`;
    console.log(`${shardsText} - Loaded`);

    {
      const commandClient = new CommandClient(cluster, {
        activateOnEdits: true,
        mentionsEnabled: true,
        prefix: PREFIX,
      });
      await commandClient.addMultipleIn('./commands/prefixed');
      await commandClient.run();
      console.log(`${shardsText} - Command Client Loaded`);
    }

    {
      const interactionClient = new InteractionCommandClient(cluster);
      await interactionClient.addMultipleIn('./commands/interactions');
      await interactionClient.run();
      console.log(`${shardsText} - Interaction Command Client Loaded`);
    }
  } catch(error) {
    console.log(error, error.errors);
  }
})();
