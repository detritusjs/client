const Message = require('./Message.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    call: {}
};

class MessageCall extends Message
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }

    get content()
    {
        return `${this.author} started a call.`;
    }
}

module.exports = MessageCall;