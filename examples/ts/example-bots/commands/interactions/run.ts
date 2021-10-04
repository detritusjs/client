import { InteractionCommandClient } from 'detritus-client';


const TOKEN = '';
const interactionClient = new InteractionCommandClient(TOKEN);

interactionClient.addMultipleIn('./commands');

(async () => {
  const client = await interactionClient.run();
  console.log(`Client has loaded with a shard count of ${client.shardCount}`);
})();
