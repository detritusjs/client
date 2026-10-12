const { Constants, Interaction, Utils } = require('../../../../../../../lib');
const { ApplicationCommandTypes, ApplicationCommandOptionTypes, MessageFlags } = Constants;
const { Embed, Markup } = Utils;



class BaseInteractionCommand extends Interaction.InteractionCommand {
  error = 'Command';

  onDmBlocked(context) {
    const command = Markup.codestring(context.name);
    return context.editOrRespond({
      content: `⚠ ${this.error} ${command} cannot be used in a DM.`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  onRunError(context, args, error) {
    const embed = new Embed();
    embed.setTitle(`⚠ ${this.error} Error`);
    embed.setDescription(Markup.codestring(String(error)));

    return context.editOrRespond({
      embed,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  onValueError(context, args, errors) {
    const embed = new Embed();
    embed.setTitle(`⚠ ${this.error} Argument Error`);

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
    return context.editOrRespond({
      embed,
      flags: MessageFlags.EPHEMERAL,
    });
  }
}


class BaseCommandOption extends Interaction.InteractionCommandOption {
  type = ApplicationCommandOptionTypes.SUB_COMMAND;
}


class BaseCommandOptionGroup extends Interaction.InteractionCommandOption {
  type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
}



class BaseSlashCommand extends BaseInteractionCommand {
  error = 'Slash Command';
  type = ApplicationCommandTypes.CHAT_INPUT;
}


// args will be `{message}`
class BaseContextMenuMessageCommand extends BaseInteractionCommand {
  error = 'Message Context Menu';
  type = ApplicationCommandTypes.MESSAGE;
}


// args will be `{member?, user}`
class BaseContextMenuUserCommand extends BaseInteractionCommand {
  error = 'User Context Menu';
  type = ApplicationCommandTypes.USER;
}


module.exports = {
  BaseCommandOption,
  BaseCommandOptionGroup,
  BaseContextMenuMessageCommand,
  BaseContextMenuUserCommand,
  BaseInteractionCommand,
  BaseSlashCommand,
};
