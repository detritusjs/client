const { Utils } = require('../../../../../../../../../lib');
const { Embed } = Utils;

const { BaseCommandOption } = require('../../../basecommand');


const Timezones = Object.freeze({
  CST: 'Central Standard Time',
  EST: 'Eastern Standard Time (New York)',
  MST: 'Mountain Standard Time (Denver)',
});

const TIMEZONES = [Timezones.CST, Timezones.EST, Timezones.MST];


class SettingsGuildTimezoneCommand extends BaseCommandOption {
  description = 'Show or set your server\'s timezone';
  name = 'timezone';

  constructor() {
    super({
      options: [
        {
          name: 'timezone',
          description: 'Timezone to set to',
          choices: TIMEZONES.map((timezone) => ({name: timezone, value: timezone})),
        },
      ],
    });
  }

  async run(context, args) {
    const embed = new Embed();
    if (args.timezone) {
      // set the guild's timezone in your database
      // add permission checks here since you dont want random members of your server setting the timezone
      embed.setTitle(`Server\'s Timezone Set`);
      embed.setDescription(`Successfully set your server\'s timezone to ${args.timezone}`);
    } else {
      // show the guild's timezone from your database
      embed.setTitle('Current Timezone');
      embed.setDescription('The current timezone');
    }
    return context.editOrRespond({embed});
  }
}

module.exports = {
  SettingsGuildTimezoneCommand,
  TIMEZONES,
  Timezones,
};
