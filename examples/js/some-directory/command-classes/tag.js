const { BaseCommand } = require('./basecommand');

class TagCommand extends BaseCommand {
  constructor(client) {
    super(client);
    this.name = 'tag';

    // tag <name> <...content>`
    // will parse `tag golf cake and eggs` as `{name: 'golf', content: 'cake and eggs'}`
    // will parse `tag 'golf cake' and eggs as `{name: 'golf cake', content: 'and eggs'}`
    this.type = [
      {label: 'name', help: 'A tag name is required', required: true},
      {label: 'content', consume: true},
    ];
  }

  run(context, args) {
    return context.editOrReply(`tag \`${args.name}\` with ${(args.content) ? `content as \`${args.content}\`` : 'no content'}`);
  }
}

module.exports = TagCommand;
