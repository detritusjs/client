# Detritus
![npm](https://img.shields.io/npm/v/detritus-client?style=flat-square)

A wheels-attached, pure-TypeScript library for the Discord API.

- [API Documentation](https://detritusjs.com)
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
- `CommandClient` wraps over the `ShardClient` to provide support for bot commands.

More Examples are provided under the [`examples/`](https://github.com/detritusjs/client/tree/master/examples)
directory.

### Command Client Sample

```ts
const { CommandClient } = require('detritus-client');

// Note: it is not advised to hard-code your bot token directly into the bot source.
//
// Tokens should be considered secrets and stored in a configuration file that is not
// part of your version control system, or an environment variable.
const token = '';
const client = new CommandClient(token, {
  prefix: '..'
});

// Simple ping/pong command
client.add({
  // name describes the command trigger; in this case, ..ping
  name: 'ping',
  run: (context, args) => {
    // Commands should return a promise to ensure that errors are handled
    return context.reply('pong!');
  }
});

// Command demonstrating command pipelines
client.add({
  name: 'owner',
  // onBefore should return a boolean to indicate whether or not the command should proceed
  onBefore: (context) => context.client.isOwner(context.userId),
  onCancel: (context) => context.reply('This command is only available to the bot owner.'),
  run: async (context) => {
    // Commands may also run asynchronously.
    await context.reply('You are the owner of the bot!');
  }
});

// Spawn the client in an async context
//
// Note: Due to how Node handles tasks, the script will block until the Detritus client
// is killed.
(async () => {
  await client.run();
  // client has received the READY payload, do stuff now
  console.log(`Client has loaded on shard ${client.shardId}`);
})();
```

## Contributing

Detritus is licensed under the BSD-2 license; see the [LICENSE](LICENSE).

To contribute, please first open an issue describing your requested changes,
and then open a pull request.