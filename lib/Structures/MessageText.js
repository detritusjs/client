const Message = require('./Message.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    activity: {},
    application: {}
};

class MessageText extends Message
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }
}

module.exports = MessageText;