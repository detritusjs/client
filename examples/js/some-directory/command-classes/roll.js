const { BaseCommand } = require('./basecommand');

class RollCommand extends BaseCommand {
  constructor(client) {
    super(client);
    this.name = 'roll';

    // choices will be [1, 2, ..., 20]
    this.choices = Array.from({length: 20}).map((v, key) => key + 1);
    this.default = 1;
    this.help = 'Can only roll 1 to 20 times';
    this.label = 'amount';
    this.type = Number;
  }

  run(context, args) {
    const { amount } = args;

    const rolls = [];
    for (let i = 0; i < amount; i++) {
      rolls.push(Math.round(Math.random() * 100));
    }
    return context.editOrReply(`Rolls: ${rolls.join(', ')}`);
  }
}

module.exports = RollCommand;
