import { InteractionCommandClient } from 'detritus-client';


const TOKEN = '';
const interactionClient = new InteractionCommandClient(TOKEN);

(async () => {
  await interactionClient.addMultipleIn('./commands');
  const client = await interactionClient.run();
  console.log(`Client has loaded with a shard count of ${client.shardCount}`);
})();
