const {
  CommandClient,
  Constants,
  Utils,
} = require('../lib');

const prefix = '!!';
const token = '';

const commandClient = new CommandClient(token, {
  gateway: {loadAllMembers: true},
  prefix,
});

commandClient.add({
  name: 'ping',
  run: (context) => context.reply('pong'),
});

// '!!custom'
commandClient.add({
  name: 'custom',
  label: 'now',
  type: (value, context) => Date.now(),
  run: (context, args) => context.reply(`Command was ran at ${args.now}`),
});

// '!!eval some code here'
commandClient.add({
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

// '!!echo some text here'
// '!!echo some text here -reverse'
// '!!echo some text here -backwards'
commandClient.add({
  label: 'text',
  name: 'echo',
  args: [{aliases: ['backwards'], name: 'reverse', type: 'bool'}],
  onBeforeRun: (context, args) => !!args.text,
  onCancelRun: (context) => context.reply('give me text next time dummy'),
  run: (context, args) => {
    let text = args.text;
    if (args.reverse) {
      text = text.split('').reverse().join('');
    }
    return context.reply(text);
  },
});

// '!!join -deaf -mute -video'
commandClient.add({
  args: [
    {name: 'deaf', type: 'bool'},
    {name: 'mute', type: 'bool'},
    {name: 'video', type: 'bool'},
  ],
  aliases: ['joinme'],
  disableDm: true,
  name: 'join',
  onBefore: (context) => !!context.member.voiceChannel,
  onCancel: (context) => context.reply('join a voice channel'),
  run: async (context, args) => {
    const voiceChannel = context.member.voiceChannel;
    if (!voiceChannel.canJoin) {
      return context.reply('cant join that channel');
    }
    if (context.voiceConnection) {
      if (context.voiceConnection.channelId === voiceChannel.id) {
        return context.reply('im already here bro');
      }
    }
    const voice = await voiceChannel.join(args);
    if (voice.isNew) {
      return context.reply(`ok, joined ${voiceChannel}`);
    } else {
      return context.reply(`ok, moved to ${voiceChannel}`);
    }
  },
});

// '!!leave'
commandClient.add({
  name: 'leave',
  onBefore: (context) => !!context.voiceConnection,
  onCancel: (context) => context.reply('im not in a channel??'),
  run: (context) => {
    context.voiceConnection.kill();
    return context.reply('ok i left');
  },
});


// '!!remind test'
commandClient.add({
  name: 'remind',
  label: 'text',
  run: (context, args) => context.reply(`remind you about ${args.text}`),
});

// '!!remind delete test'
commandClient.add({
  name: 'remind delete',
  label: 'text',
  priority: 1,
  run: (context, args) => context.reply(`delete reminder that matches ${args.text}`),
});

/*
// Or just have one command do it all

// '!!remind test -delete'
commandClient.add({
  name: 'remind',
  args: [{name: 'delete', type: Boolean}],
  label: 'text',
  run: (context, args) => {
    if (args.delete) {
      return context.reply(`delete reminder that matches ${args.text}`);
    } else {
      return context.reply(`remind you about ${args.text}`);
    }
  },
})
*/


// You can set custom prefixes to args, default is '-'
// '!!argtest +custom some-text'
// '!!argtest +custom some-text -default some-other-text'
commandClient.add({
  name: 'argtest',
  args: [{name: 'custom', prefix: '+'}, {name: 'default'}],
  run: (context, args) => context.reply(`Default prefix for args is '-', but you're able to change it. (default: ${args.default}), (custom: ${args.custom})`),
});

(async () => {
  await commandClient.run();
  // Client fetched the gateway url, got the ready payload, and filled the applications cache
  console.log('ready');
})();
