const {
  CommandClient,
  Constants,
  Utils,
} = require('../lib');

// we dont have to pass in a token anymore since it'll get it from the env variables from the fork
const client = new CommandClient('', {
  prefix: '!!',
});


client.add({
  label: 'code',
  name: 'eval',
  args: [
    {default: false, name: 'noreply', type: 'bool'},
    {default: 2, name: 'jsonspacing', type: 'number'},
  ],
  onBefore: (context) => context.user.isClientOwner,
  onCancel: (context) => context.reply(`${context.user.mention}, you're not this bot's owner or part of it's team.`),
  run: async (context, args) => {
    const { matches } = Utils.regex(Constants.DiscordRegexNames.TEXT_CODEBLOCK, args.code);
    if (matches.length) {
      args.code = matches[0].text;
    }

    let language = 'js';
    let message;
    try {
      message = await Promise.resolve(eval(args.code));
      if (typeof(message) === 'object') {
        message = JSON.stringify(message, null, args.jsonspacing);
        language = 'json';
      }
    } catch(error) {
      message = (error) ? error.stack || error.message : error;
    }

    const max = 1990 - language.length;
    if (!args.noreply) {
      return context.reply([
        '```' + language,
        String(message).slice(0, max),
        '```',
      ].join('\n'));
    }
  },
  onError: (context, args, error) => {
    console.error(error);
  },
});


(async () => {
  await client.run();
})();
