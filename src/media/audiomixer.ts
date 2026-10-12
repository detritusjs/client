import { MediaMixer, MediaUdp } from 'detritus-client-socket';

import { DiscordOpusFormat } from '../constants';

import { MediaEvents } from './mediaevents';
import { VoiceConnection } from './voiceconnection';


/**
 * Audio Mixer Options
 * @category Media Options
 */
export interface AudioMixerOptions extends MediaMixer.AudioMixerOptions {

}


/**
 * Mixes multiple PCM sources (e.g. each user's decoded voice) into one continuous stream
 * Packets are placed using their RTP timestamps, so jitter and bursts don't smear the audio
 * Emits `data` with one mixed PCM frame (of `format.frameDuration`) at a steady rate while running
 * Only signed 16-bit little-endian interleaved PCM is supported (what opus decoders output)
 * @category Media
 */
export class AudioMixer extends MediaMixer.AudioMixer {
  constructor(options: AudioMixerOptions = {}) {
    super(Object.assign({
      channels: DiscordOpusFormat.CHANNELS,
      sampleRate: DiscordOpusFormat.SAMPLE_RATE,
    }, options));
  }

  /**
   * Listens to a voice connection's decoded audio and mixes in every user that `isMixing()` allows
   * Returns a function that detaches the listeners
   */
  attach(connection: VoiceConnection): () => void {
    if (!connection.decodeAudio || !connection.opusDecoder) {
      throw new Error('The voice connection must be decoding audio, connect with `decodeAudio: true`');
    }
    const decoder = connection.opusDecoder;
    if (decoder.sampleRate !== this.format.sampleRate || decoder.channels !== this.format.channels) {
      throw new Error(`Decoder format (${decoder.sampleRate}hz, ${decoder.channels}ch) does not match the mixer (${this.format.sampleRate}hz, ${this.format.channels}ch)`);
    }

    const onAudio = (packet: MediaUdp.TransportPacket) => {
      if (packet.userId !== null && this.isMixing(packet.userId)) {
        const timestamp = (packet.rtp) ? packet.rtp.header.timestamp : undefined;
        this.push(packet.userId, packet.data, timestamp);
      }
    };
    const onDisconnect = (payload: MediaEvents.ClientDisconnect) => this.removeSource(payload.userId);
    const onKilled = () => this.stop();

    connection.on('audio', onAudio);
    connection.on('disconnect', onDisconnect);
    connection.on('killed', onKilled);
    return () => {
      connection.removeListener('audio', onAudio);
      connection.removeListener('disconnect', onDisconnect);
      connection.removeListener('killed', onKilled);
    };
  }
}
