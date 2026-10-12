const { BaseSlashCommand } = require('../../basecommand');

const { SettingsGuildGroupCommand } = require('./guild');


class SettingsGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'settings';

  constructor() {
    super({
      options: [
        new SettingsGuildGroupCommand(),
      ],
    });
  }
}

module.exports = SettingsGroupCommand;
