const { Command } = require('../../../../../../../lib');
const { Embed, Markup } = require('../../../../../../../lib/utils');
const { Timers } = require('detritus-utils');


class BaseCommand extends Command.Command {
  permissionsIgnoreClientOwner = true;
  triggerTypingAfter = 2000;

  async onRatelimit(context, ratelimits, metadata) {
    const { message } = context;
    if (!message.canReply && !message.canReact) {
      return;
    }
    const { global } = metadata;

    let replied = false;
    for (const {item, ratelimit, remaining} of ratelimits) {
      if (remaining < 1000 || replied || item.replied) {
        // skip replying
        item.replied = true;
        continue;
      }
      replied = item.replied = true;

      let noun = 'You idiots are';
      switch (ratelimit.type) {
        case 'channel': {
          noun = 'This channel is';
        }; break;
        case 'guild': {
          noun = 'This guild is';
        }; break;
        case 'user': {
          noun = 'You are';
        }; break;
      }

      let content;
      if (global) {
        content = `${noun} using commands WAY too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`;
      } else {
        content = `${noun} using ${this.fullName} too fast, wait ${(remaining / 1000).toFixed(1)} seconds.`;
      }

      try {
        const reply = await context.reply(content);
        await Timers.sleep(Math.max(remaining / 2, 2000));
        item.replied = false;
        if (!reply.deleted) {
          await reply.delete();
        }
      } catch(e) {
        item.replied = false;
      }
    }
  }

  async onRunError(context, args, error) {
    const embed = new Embed();
    embed.setTitle(`⚠ Command Error`);
    embed.setDescription(Markup.codestring(String(error)));

    return context.editOrReply({embed, reference: true});
  }

  onTypeError(context, args, errors) {
    const embed = new Embed();
    embed.setTitle('⚠ Command Argument Error');

    const store = {};

    const description = ['Invalid Arguments' + '\n'];
    for (let key in errors) {
      const message = errors[key].message;
      if (message in store) {
        description.push(`**${key}**: Same error as **${store[message]}**`);
      } else {
        description.push(`**${key}**: ${message}`);
      }
      store[message] = key;
    }

    embed.setDescription(description.join('\n'));
    return context.editOrReply({embed, reference: true});
  }
}

module.exports = { BaseCommand };
