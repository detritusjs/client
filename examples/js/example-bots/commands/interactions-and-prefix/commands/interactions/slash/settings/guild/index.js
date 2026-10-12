const { BaseCommandOptionGroup } = require('../../../basecommand');

const { SettingsGuildTimezoneCommand } = require('./guild.timezone');


class SettingsGuildGroupCommand extends BaseCommandOptionGroup {
  description = '.';
  disableDm = true; // we want this command to only run in guilds
  name = 'guild';

  constructor() {
    super({
      options: [
        new SettingsGuildTimezoneCommand(),
      ],
    });
  }
}

module.exports = { SettingsGuildGroupCommand };
