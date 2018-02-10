const Message = require('./Message.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {

};

class MessageGuildMemberJoin extends Message
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }
}

module.exports = MessageGuildMemberJoin;