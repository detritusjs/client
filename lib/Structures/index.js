const modules = [
    'Channel',
    'ChannelCategory',
    'ChannelDM',
    'ChannelText',
    'ChannelVoice',
    'Guild',
    'Message',
    'MessageCall',
    'MessageChannelIconChange',
    'MessageChannelNameChange',
    'MessageChannelPinnedMessage',
    'MessageGuildMemberJoin',
    'MessageRecipientAdd',
    'MessageRecipientRemove',
    'MessageText',
    'User',
    'UserSelf'
];

module.exports = {};

modules.forEach((mod) => {
    module.exports[mod] = require(`./${mod}.js`);
});