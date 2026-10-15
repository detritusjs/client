import { Constants as SocketConstants, Media, MediaUdp } from 'detritus-client-socket';

import { ShardClient } from '../client';
import { MediaCodecs, MediaCodecTypes, MediaOpCodes, SpeakingFlags } from '../constants';

import { MediaEvents } from './mediaevents';
import { MediaRawEvents } from './rawevents';
import { VoiceConnection } from './voiceconnection';

const { MediaSSRCTypes } = SocketConstants;


/**
 * Voice Connection Handler
 * @category Handler
 */
export class MediaHandler {
  connection: VoiceConnection;
  opHandler: MediaGatewayOpHandler;
  transport: MediaUdp.Socket | null = null;

  constructor(connection: VoiceConnection) {
    this.connection = connection;
    this.opHandler = new MediaGatewayOpHandler(this);

    this.gateway.on('packet', this.onPacket.bind(this));
    this.gateway.on('warn', this.connection.emit.bind(this.connection, 'warn'));
    this.gateway.once('killed', this.connection.kill.bind(this.connection));
    this.gateway.on('transportReady', this.onTransportReady.bind(this));
  }

  get client(): ShardClient {
    return this.connection.client;
  }

  get gateway(): Media.Socket {
    return this.connection.gateway;
  }

  onPacket(packet: MediaRawEvents.MediaGatewayPacket): void {
    if (packet.op in this.opHandler) {
      (<any> this.opHandler)[packet.op](packet.d);
    }
  }

  onTransportReady(transport: MediaUdp.Socket): void {
    this.connection.emit('ready');
    if (this.transport === transport) {
      return;
    }
    this.transport = transport;
    transport.on('log', this.connection.emit.bind(this.connection, 'log'));
    transport.on('packet', this.onTransportPacket.bind(this));
    transport.on('warn', this.connection.emit.bind(this.connection, 'warn'));
  }

  onTransportPacket(packet: MediaUdp.TransportPacket): void {
    this.connection.emit('packet', packet);

    let data: Buffer = packet.data;
    try {
      switch (packet.format) {
        case MediaCodecTypes.AUDIO: {
          if (!this.connection.decodeAudio) {
            return;
          }
          if (packet.codec === MediaCodecs.OPUS) {
            if (!this.connection.opusDecoder) {
              throw new Error('No Opus decoder provided');
            }
            // decoders are per stream (ssrc), so packets from before discord says whose they are still decode to pcm, with a null user id
            const ssrc = (packet.rtp) ? packet.rtp.header.ssrc : null;
            if (ssrc !== null) {
              // client-socket sets this itself from 0.9.0-beta.14 on
              (packet as any).ssrc = ssrc;
              packet.data = this.connection.decode(ssrc, data);
              if (packet.userId !== null) {
                this.connection.opusDecoderSSRCs.set(packet.userId, ssrc);
              }
            } else if (packet.userId !== null) {
              packet.data = this.connection.decode(packet.userId, data);
            }
          }
        }; break;
      }
      if (packet.format) {
        this.connection.emit(<string> packet.format, packet);
      }
    } catch (error) {
      this.connection.emit('warn', error);
    }
  }
}


/**
 * Media Gateway Op Code Handler Function
 * @category Handlers
 */
export type MediaGatewayOpHandlerFunction = (data: any) => void;

/**
 * Media Gateway Op Code Handler
 * @category Handlers
 */
export class MediaGatewayOpHandler {
  handler: MediaHandler;

  constructor(handler: MediaHandler) {
    this.handler = handler;
  }

  get client() {
    return this.handler.client;
  }

  get connection() {
    return this.handler.connection;
  }

  [MediaOpCodes.CLIENTS_CONNECT](data: MediaRawEvents.ClientsConnect) {
    // the current voice gateway sends this instead of CLIENT_CONNECT, it has no ssrcs so use what we already know (SPEAKING fills them in later)
    const gateway = this.connection.gateway;
    for (let userId of data['user_ids']) {
      const payload: MediaEvents.ClientConnect = {
        audioSSRC: gateway.userIdToSSRC(userId, MediaSSRCTypes.AUDIO) || 0,
        user: this.client.users.get(userId) || null,
        userId,
        videoSSRC: gateway.userIdToSSRC(userId, MediaSSRCTypes.VIDEO) || 0,
      };
      this.connection.emit('connect', payload);
    }
  }

  [MediaOpCodes.CLIENT_CONNECT](data: MediaRawEvents.ClientConnect) {
    const payload: MediaEvents.ClientConnect = {
      audioSSRC: data['audio_ssrc'],
      user: this.client.users.get(data['user_id']) || null,
      userId: data['user_id'],
      videoSSRC: data['video_ssrc'],
    }
    this.connection.emit('connect', payload);
  }

  [MediaOpCodes.CLIENT_DISCONNECT](data: MediaRawEvents.ClientDisconnect) {
    const userId = data['user_id'];
    this.connection.deleteOpusDecoder(userId);
    const voiceState = this.client.voiceStates.get(this.connection.serverId, userId);
    if (voiceState) {
      voiceState._isSpeaking = false;
    }
    const user = this.client.users.get(userId) || null;

    const payload: MediaEvents.ClientDisconnect = {user, userId};
    this.connection.emit('disconnect', payload);
  }

  [MediaOpCodes.READY](data: any) {
    // a new voice session (resumes get RESUMED instead), users that left while we were reconnecting never get a CLIENT_DISCONNECT
    // so free every decoder, the ones still talking get recreated on their next packet
    this.connection.clearOpusDecoders();
  }

  [MediaOpCodes.SPEAKING](data: MediaRawEvents.Speaking) {
    const isSpeaking = !!data['speaking'];
    const priority = (data['speaking'] & SpeakingFlags.PRIORITY) === SpeakingFlags.PRIORITY;
    const soundshare = (data['speaking'] & SpeakingFlags.SOUNDSHARE) === SpeakingFlags.SOUNDSHARE;
    const voice = (data['speaking'] & SpeakingFlags.VOICE) === SpeakingFlags.VOICE;
    const userId = data['user_id'];

    const voiceState = this.client.voiceStates.get(this.connection.serverId, userId) || null;
    if (voiceState) {
      voiceState._isSpeaking = isSpeaking;
    }

    const payload: MediaEvents.Speaking = {
      isSpeaking,
      priority,
      soundshare,
      ssrc: data['ssrc'],
      user: this.client.users.get(userId) || null,
      userId,
      voice,
      voiceState,
    };
    this.connection.emit('speaking', payload);
  }
}
