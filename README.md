# Detritus
A more perfect, wheels-attached JavaScript wrapper for Discord

## Example Usage
```js
const Detritus = require('detritus-client');

const client = new Detritus.CommandClient('token', {
    prefix: '..'
});

client.registerCommand({
    name: 'ping',
    run: (context, args) => context.reply('pong')
});

client.registerCommand({
    name: 'owner',
    onBefore: (context) => context.user.id === context.client.owner.id,
    onCancel: (context) => context.reply('ur not owner lol'),
    run: (context) => context.reply('hey ur the owner!!')
});

client.run().then((cluster) => {
    console.log(`loaded ${cluster.shardCount} shards`);
});
```
