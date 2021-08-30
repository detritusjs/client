import { BaseSlashCommand } from '../../basecommand';

import { AvatarCommand } from './avatar';


export default class UserGroupCommand extends BaseSlashCommand {
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
