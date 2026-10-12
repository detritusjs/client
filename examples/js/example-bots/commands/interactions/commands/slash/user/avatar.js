const { Constants, Utils } = require('../../../../../../../../lib');
const { ApplicationCommandOptionTypes } = Constants;
const { Embed } = Utils;

const { BaseCommandOption } = require('../../basecommand');


class AvatarCommand extends BaseCommandOption {
  description = 'Grab the avatar of a user';
  name = 'avatar';

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to grab the avatar of',
          default: (context) => context.member || context.user,
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context, args) {
    const embed = new Embed();
    embed.setTitle(`Avatar for ${args.user}`);
    embed.setImage(args.user.avatarUrl);
    return context.editOrRespond({embed});
  }
}

module.exports = { AvatarCommand };
