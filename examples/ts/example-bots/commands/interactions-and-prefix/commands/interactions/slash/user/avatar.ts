import { Constants, Interaction, Structures, Utils } from 'detritus-client';
const { ApplicationCommandOptionTypes } = Constants;
const { Embed } = Utils;

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
  user: Structures.Member | Structures.User,
}

export class AvatarCommand extends BaseCommandOption {
  description = 'Grab the avatar of a user';
  name = 'avatar';

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to grab the avatar of',
          default: (context: Interaction.InteractionContext) => context.member || context.user,
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const embed = new Embed();
    embed.setTitle(`Avatar for ${args.user}`);
    embed.setImage(args.user.avatarUrl);
    return context.editOrRespond({embed});
  }
}
