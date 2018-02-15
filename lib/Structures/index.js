[
    'Channel',
    'ChannelCategory',
    'ChannelDM',
    'ChannelText',
    'ChannelVoice',
    'Emoji',
    'Guild',
    'Message',
    'Presence',
    'User',
    'UserSelf'
].forEach((mod) => {
    module.exports[mod] = require(`./${mod}.js`);
});