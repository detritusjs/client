const { Client } = require('../lib');

const guildId = '';
const channelId = '';
const targetId = '';

const token = '';
const client = new Client(token);

(async () => {
  try {
    await client.run();
    const {
      connection,
      isNew,
    } = await client.voiceConnect(guildId, channelId, {receive: true});
    if (isNew) {
      connection.sendAudioSilenceFrame(); // allows us to start receiving voice
      connection.on('packet', ({data, userId}) => {
        if (userId === targetId) {
          connection.sendAudio(data, {isOpus: true});
        }
      });
    }
  } catch(error) {
    console.error(error);
  }
})();
