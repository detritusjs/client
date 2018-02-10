const Message = require('./Message.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {

};

class MessageRecipientRemove extends Message
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }
}

module.exports = MessageRecipientRemove;