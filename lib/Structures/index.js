[
    'Channel',
    'ChannelCategory',
    'ChannelDM',
    'ChannelDMGroup',
    'ChannelText',
    'ChannelVoice',
    'Emoji',
    'Guild',
    'Invite',
    'Member',
    'Message',
    'Presence',
    'Reaction',
    'Role',
    'User',
    'UserSelf',
    'VoiceState'
].forEach((mod) => {
    module.exports[mod] = require(`./${mod}.js`);
});