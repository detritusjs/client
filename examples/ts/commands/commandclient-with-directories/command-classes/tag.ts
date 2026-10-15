import { Command, CommandClient } from 'detritus-client';

import { BaseCommand } from './basecommand';


export interface CommandArgs {
  content?: string,
  name: string,
}

export default class TagCommand extends BaseCommand {
  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      name: 'tag',

      // tag <name> <...content>`
      // will parse `tag golf cake and eggs` as `{name: 'golf', content: 'cake and eggs'}`
      // will parse `tag 'golf cake' and eggs as `{name: 'golf cake', content: 'and eggs'}`
      type: [
        {label: 'name', name: 'name', help: 'A tag name is required', required: true},
        {label: 'content', name: 'content', consume: true},
      ],
    });
  }

  run(context: Command.Context, args: CommandArgs) {
    return context.editOrReply(`tag \`${args.name}\` with ${(args.content) ? `content as \`${args.content}\`` : 'no content'}`);
  }
}
