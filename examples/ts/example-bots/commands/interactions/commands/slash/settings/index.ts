import { BaseSlashCommand } from '../../basecommand';

import { SettingsGuildGroupCommand } from './guild';


export default class SettingsGroupCommand extends BaseSlashCommand {
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
