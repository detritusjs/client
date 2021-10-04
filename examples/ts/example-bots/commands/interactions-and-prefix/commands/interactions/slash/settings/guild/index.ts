import { BaseCommandOptionGroup } from '../../../basecommand';

import { SettingsGuildTimezoneCommand } from './guild.timezone';


export class SettingsGuildGroupCommand extends BaseCommandOptionGroup {
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
