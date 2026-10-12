const { BaseSlashCommand } = require('../../basecommand');

const { AvatarCommand } = require('./avatar');


class UserGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'user';

  constructor() {
    super({
      options: [
        new AvatarCommand(),
      ],
    });
  }
}

module.exports = UserGroupCommand;
