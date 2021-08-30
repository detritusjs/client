import { Command } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';


export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  permissionsIgnoreClientOwner = true;
  triggerTypingAfter = 2000;

  async onRatelimit(
    context: Command.Context,
    ratelimits: Array<Command.CommandRatelimitInfo>,
    metadata: Command.CommandRatelimitMetadata,
  ) {
    const { message } = context;
    if (!message.canReply && !message.canReact) {
      return;
    }
    const { global } = metadata;
  
    let replied: boolean = false;
    for (const {item, ratelimit, remaining} of ratelimits) {
      if (remaining < 1000 || replied || item.replied) {
        // skip replying
        item.replied = true;
        continue;
      }
      replied = item.replied = true;
  
      let noun: string = 'You idiots are';
      switch (ratelimit.type) {
        case 'channel': {
          noun = 'This guild is';
        }; break;
        case 'guild': {
          noun = 'This channel is';
        }; break;
        case 'user': {
          noun = 'You are';
        }; break;
      }
  
      let content: string;
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

  async onRunError(context: Command.Context, args: ParsedArgsFinished, error: any) {
    const embed = new Embed();
    embed.setTitle(`⚠ Command Error`);
    embed.setDescription(Markup.codestring(String(error)));

    return context.editOrReply({embed, reference: true});
  }

  onTypeError(context: Command.Context, args: ParsedArgsFinished, errors: Command.ParsedErrors) {
    const embed = new Embed();
    embed.setTitle('⚠ Command Argument Error');

    const store: {[key: string]: string} = {};

    const description: Array<string> = ['Invalid Arguments' + '\n'];
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
