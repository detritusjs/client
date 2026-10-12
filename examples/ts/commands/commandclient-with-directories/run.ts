import { CommandClient, Constants, Utils } from 'detritus-client';


const prefix = '!!';
const token = '';

const client = new CommandClient(token, {prefix});


client.add({
  name: 'ping',
  run: (context) => context.reply('pong'),
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
    if (matches.length && 'text' in matches[0]) {
      args.code = matches[0].text;
    }

    let language = 'js';
    let message: any;
    try {
      message = await Promise.resolve(eval(args.code));
      if (typeof(message) === 'object') {
        message = JSON.stringify(message, null, args.jsonspacing);
        language = 'json';
      }
    } catch(error: any) {
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

client.add({
  label: 'text',
  name: 'echo',
  args: [{aliases: ['backwards'], name: 'reverse', type: 'bool'}],
  onBeforeRun: (context, args) => !!args.text,
  onCancelRun: (context) => context.reply('give me text next time dummy'),
  run: (context, args) => {
    let text: string = args.text;
    if (args.reverse) {
      text = text.split('').reverse().join('');
    }
    return context.reply(text);
  },
});

client.add({
  args: [
    {name: 'deaf', type: 'bool'},
    {name: 'mute', type: 'bool'},
    {name: 'video', type: 'bool'},
  ],
  aliases: ['joinme'],
  disableDm: true,
  name: 'join',
  onBefore: (context) => !!context.member && !!context.member.voiceChannel,
  onCancel: (context) => context.reply('join a voice channel'),
  run: async (context, args) => {
    const voiceChannel = context.member!.voiceChannel!;
    if (!voiceChannel.canJoin) {
      return context.reply('cant join that channel');
    }
    if (context.voiceConnection) {
      if (context.voiceConnection.channelId === voiceChannel.id) {
        return context.reply('im already here bro');
      }
    }
    const voice = await voiceChannel.join(args);
    if (!voice) {
      return context.reply('couldnt join that channel');
    }
    if (voice.isNew) {
      return context.reply(`ok, joined ${voiceChannel}`);
    } else {
      return context.reply(`ok, moved to ${voiceChannel}`);
    }
  },
});

client.add({
  name: 'leave',
  onBefore: (context) => !!context.voiceConnection,
  onCancel: (context) => context.reply('im not in a channel??'),
  run: (context) => {
    context.voiceConnection!.kill();
    return context.reply('ok i left');
  },
});

client.add({
  name: 'color',
  choices: ['blue', 'red'],
  help: 'Choose from `blue` or `red`',
  type: (value: string) => value.toLowerCase(),
  run: (context, args) => {
    const { color } = args;
    switch (color) {
      case 'blue': {
        return context.editOrReply('I love blue!');
      };
      case 'red': {
        return context.editOrReply('I kinda like red');
      };
    }
  },
  onTypeError: (context, args, errors) => {
    const description = ['ERRORS'];
    for (let key in errors) {
      description.push(`**${key}**: ${errors[key].message}`);
    }
    return context.editOrReply(description.join('\n'));
  },
});

(async () => {
  // loads every command file in these folders (relative to this file)
  await client.addMultipleIn('./command-classes');
  await client.addMultipleIn('./commands');
  await client.run();
  // Client fetched the gateway url, got the ready payload, and filled the applications cache
  console.log('ready');
})();
