import { MediaUdp } from 'detritus-client-socket';

import { ShardClient } from 'detritus-client';


const guildId = '';
const channelId = '';
const targetId = '';

const token = '';
const client = new ShardClient(token);

(async () => {
  try {
    await client.run();
    const voice = await client.voiceConnect(guildId, channelId, {receive: true});
    if (!voice) {
      throw new Error('Failed to join the voice channel');
    }
    const { connection, isNew } = voice;
    if (isNew) {
      connection.setSpeaking({voice: true}); // lets discord send our ssrc to everyone everytime they join
      connection.sendAudioSilenceFrame(); // allows us to start receiving voice
      connection.on('packet', ({data, userId}: MediaUdp.TransportPacket) => {
        if (userId === targetId) {
          connection.sendAudio(data, {isOpus: true});
        }
      });
    }
  } catch(error) {
    console.error(error);
  }
})();
