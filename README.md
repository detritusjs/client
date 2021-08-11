# Detritus
![npm](https://img.shields.io/npm/v/detritus-client?style=flat-square)

A wheels-attached, pure-TypeScript library for the Discord API.

- [API Documentation](https://detritusjs.com)
- [Discord Help Server](https://discord.gg/NEq6wws)
- [npm](https://www.npmjs.com/package/detritus-client)

## Installation

Detritus is distributed via npm. A high-level wrapper over the Discord API is provided
in this package, `detritus-client`. Low-level wrappers over Discord's REST API and Gateway
are provided through [`detritus-client-rest`](https://github.com/detritusjs/client-rest) and
[`detritus-client-socket`](https://github.com/detritusjs/client-socket).

- `$ npm i detritus-client`
- `$ yarn add detritus-client`

## Usage

Detritus is operated through the Clients classes:

- `ShardClient` provides a base client for connecting to the Discord API and receiving events.
- `ClusterClient` provides a client that creates `ShardClient` classes inside of it for easier sharding
- `CommandClient` wraps over the `ClusterClient` or `ShardClient` to provide support for bot commands.
- `InteractionCommandClient` wraps over the `ClusterClient` or `ShardClient` to provide support for interaction commands.
- `ClusterManager` provides a manager that'll spawn in multiple `ClusterClient` processes for big shardings

More Examples are provided under the [`examples/`](https://github.com/detritusjs/client/tree/master/examples)
directory.

### Command Client Sample

```js
const { CommandClient } = require('detritus-client');

// Note: it is not advised to hard-code your bot token directly into the bot source.
//
// Tokens should be considered secrets and stored in a configuration file that is not
// part of your version control system, or an environment variable.
// By default, the CommandClient will use the ClusterClient
// The ShardClient/ClusterClient will be under CommandClient.client as soon as you create the object
const token = '';
const commandClient = new CommandClient(token, {
  // Prefix `..`, if you want multiple prefixes pass in `prefixes: ['..', '...']`
  prefix: '..',
});

// Simple ping/pong command
commandClient.add({
  // name describes the command trigger; in this case, ..ping
  name: 'ping',
  run: (context, args) => {
    // Commands should return a promise to ensure that errors are handled
    return context.reply('pong!');
  },
});

// Command demonstrating command pipelines
commandClient.add({
  name: 'owner',
  // onBefore should return a boolean to indicate whether or not the command should proceed
  onBefore: (context) => context.client.isOwner(context.userId),
  onCancel: (context) => context.reply('This command is only available to the bot owner.'),
  run: async (context) => {
    // Commands may also run asynchronously.
    await context.reply('You are the owner of the bot!');
  },
});

// Spawn the client in an async context
//
// Note: Due to how Node handles tasks, the script will block until the Detritus client
// is killed.
(async () => {
  const client = await commandClient.run();
  console.log(`Client has loaded with a shard count of ${client.shardCount}`);
})();
```

### InteractionCommand Client Sample

```js
const { Constants, InteractionCommandClient } = require('detritus-client');
const { ApplicationCommandTypes, InteractionCallbackTypes, MessageFlags } = Constants;

// Note: it is not advised to hard-code your bot token directly into the bot source.
//
// Tokens should be considered secrets and stored in a configuration file that is not
// part of your version control system, or an environment variable.
// By default, the InteractionCommandClient will use the ClusterClient
// The ShardClient/ClusterClient will be under InteractionCommandClient.client as soon as you create the object
const token = '';
const interactionClient = new InteractionCommandClient(token);

// Simple ping/pong command
interactionClient.add({
  description: 'Ping!',
  name: 'ping',
  run: (context, args) => {
    // Commands should return a promise to ensure that errors are handled
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, 'pong!');
  },
});

// Command demonstrating command pipelines
interactionClient.add({
  description: 'Are you the owner or part of the team for this application?',
  name: 'owner',
  // onBefore should return a boolean to indicate whether or not the command should proceed
  onBefore: (context) => context.client.isOwner(context.userId),
  // we want the error to only show to the user to not clunk up the chat
  onCancel: (context) => {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: 'This command is only available to the bot owner.'),
      flags: MessageFlags.EPHEMERAL,
    });
  },
  run: async (context) => {
    // Commands may also run asynchronously.
    await context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, 'You are the owner of the bot!');
  },
});

// Context Menu User Command
interactionClient.add({
  name: 'Poke',
  type: ApplicationCommandTypes.USER,
  run: async (context, args) => {
    await context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
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

// Spawn the client in an async context
//
// Note: Due to how Node handles tasks, the script will block until the Detritus client
// is killed.
(async () => {
  // Interaction Client will compare the local commands w/ commands stored on discord
  // If any of them differ, it will call `.bulkOverwriteApplicationCommands()` with the local commands
  // Guild-specific Interaction commands are not supported right now
  const client = await interactionClient.run();
  console.log(`Client has loaded with a shard count of ${client.shardCount}`);
})();
```

### Shard Client Sample

```js
const { ShardClient } = require('detritus-client');

// Note: it is not advised to hard-code your bot token directly into the bot source.
//
// Tokens should be considered secrets and stored in a configuration file that is not
// part of your version control system, or an environment variable.
const token = '';
const client = new ShardClient(token, {
  gateway: {
    // This will tell our client to fill our Members cache on any of our guilds that are larger than the large threshold you pass in (default 250)
    loadAllMembers: true,
  },
});

// listen to our client's eventemitter
client.on('guildCreate', async ({fromUnavailable, guild}) => {
  if (fromUnavailable) {
    console.log(`Guild ${guild.name} has just came back from being unavailable`);
  } else {
    console.log(`Joined Guild ${guild.name}, bringing us up to ${client.guilds.length} guilds.`);
  }
});

// listen to our client's eventemitter
client.on('messageCreate', async ({message}) => {
  if (message.content === '!ping') {
    const reply = await message.reply('pong!, deleting message in 5 seconds...');
    setTimeout(async () => {
      await reply.delete();
    }, 5000);
  }
});

(async () => {
  await client.run();
  console.log('Successfully connected to Discord!');
  console.log(`Currently have ${client.guilds.length} guilds in cache.`);
  // set our presence, we can pass this into the client's options too under `gateway.presence`
  client.gateway.setPresence({
    activity: {
      // What comes after our activity type, x.
      name: 'with Detritus',
      // Type 0 sets our message to `Playing x`
      type: 0,
    },
    // do-not-disturb us
    status: 'dnd',
  });
})();
```

### Cluster Client Sample

```js
const { ClusterClient } = require('detritus-client');

// Note: it is not advised to hard-code your bot token directly into the bot source.
//
// Tokens should be considered secrets and stored in a configuration file that is not
// part of your version control system, or an environment variable.
const token = '';
const cluster = new ClusterClient(token, {
  gateway: {
    // Pass in a presence we will send with the identify payload
    presence: {
      activity: {
        // What comes after our activity type, x.
        name: 'with Detritus ClusterClient',
        // Type 0 sets our message to `Playing x`
        type: 0,
      },
      // do-not-disturb us
      status: 'dnd',
    },
  },
});

// listen to our client's eventemitter
// `shard` (which is the ShardClient the event originated from) is added onto EVERY event that you listen to on the cluster client
cluster.on('guildCreate', async ({fromUnavailable, guild, shard}) => {
  if (fromUnavailable) {
    console.log(`Shard #${shard.shardId}:`, `Guild ${guild.name} has just came back from being unavailable`);
  } else {
    console.log(`Shard #${shard.shardId}:`, `Joined Guild ${guild.name}, bringing us up to ${client.guilds.length} guilds.`);
  }
});

// listen to our client's eventemitter
// `shard` (which is the ShardClient the event originated from) is added onto EVERY event that you listen to on the cluster client
cluster.on('messageCreate', async ({message, shard}) => {
  if (message.content === '!ping') {
    const reply = await message.reply(`pong on shard #${shard.shardId}!, deleting message in 5 seconds...`);
    setTimeout(async () => {
      await reply.delete();
    }, 5000);
  }
});

(async () => {
  // shards are made after the cluster is ran, found in `ClusterClient.shards`.
  await cluster.run();
  console.log(`Successfully launched shards ${cluster.shardStart} to ${cluster.shardEnd} with a shardCount of ${cluster.shardCount}`);
})();
```

## Contributing

Detritus is licensed under the BSD-2 license; see the [LICENSE](LICENSE).

To contribute, please first open an issue describing your requested changes,
and then open a pull request.
