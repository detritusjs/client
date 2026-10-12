// Mixes everyone talking in a voice channel together and plays the mix right back into the same channel
// Requires `@snazzah/davey` (voice e2ee) and an opus module (`@discordjs/opus` or `opusscript`)
import { AudioMixer, ShardClient } from 'detritus-client';


const guildId = '';
const channelId = '';
// only repeat these users, leave it empty to repeat everyone
const userIds: Array<string> = [];

// discord wants 5 frames of silence whenever we stop sending audio
const SILENCE_FRAME_COUNT = 5;

const token = '';
const client = new ShardClient(token);

function isSilent(frame: Buffer): boolean {
  for (let i = 0; i < frame.length; i++) {
    if (frame[i]) {
      return false;
    }
  }
  return true;
}

(async () => {
  try {
    await client.run();
    const voice = await client.voiceConnect(guildId, channelId, {
      decodeAudio: true, // decode everyone's opus into pcm for the mixer
      opusEncoder: true, // encode the mix back into opus
      receive: true,
    });
    if (!voice) {
      throw new Error('Failed to join the voice channel');
    }
    const { connection } = voice;
    connection.setSpeaking({voice: true}); // lets discord send our ssrc to everyone everytime they join
    connection.sendAudioSilenceFrame(); // allows us to start receiving voice

    // 48khz stereo 20ms frames, the same format discord's opus uses
    const mixer = new AudioMixer({
      userIds: (userIds.length) ? userIds : undefined,
    });

    let silentFrames = SILENCE_FRAME_COUNT;
    mixer.on('data', (frame: Buffer) => {
      try {
        if (isSilent(frame)) {
          if (silentFrames < SILENCE_FRAME_COUNT) {
            connection.sendAudioSilenceFrame();
            silentFrames++;
          }
          return;
        }
        silentFrames = 0;
        connection.sendAudio(frame);
      } catch(error) {
        console.error(error);
      }
    });
    // stops the mixer when the connection is killed, and forgets users that leave
    mixer.attach(connection);
    mixer.start();
  } catch(error) {
    console.error(error);
  }
})();
