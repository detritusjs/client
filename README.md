# Detritus
A more perfect, wheels-attached JavaScript wrapper for Discord

# Typescript Docs
[detritusjs.com](https://detritusjs.com)


## Example Usage
```js
const { CommandClient } = require('detritus-client');

const token = ''
const client = new CommandClient(token, {
  prefix: '..'
});

client.add({
  name: 'ping',
  run: (context, args) => context.reply('pong')
});

client.add({
  name: 'owner',
  onBefore: (context) => context.client.isOwner(context.userId),
  onCancel: (context) => context.reply('ur not owner, stop it'),
  run: (context) => context.reply('hey ur the owner!!'),
});

(async () => {
  await client.run();
  // client has received the READY payload, do stuff now
  console.log(`Client has loaded on shard ${client.shardId}`);
})();
```
