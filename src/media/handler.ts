import {
  Constants as SocketConstants,
  Media,
  MediaUdp,
} from 'detritus-client-socket';

const {
  MediaCodecs,
  MediaCodecTypes,
  MediaOpCodes,
  MediaSpeakingFlags,
} = SocketConstants;

import { ShardClient } from '../client';

import { Opus } from './encoders';
import { MediaEvents } from './mediaevents';
import { MediaRawEvents } from './rawevents';
import { VoiceConnection } from './voiceconnection';


/**
 * Voice Connection Handler
 * @category Handler
 */
export class MediaHandler {
  connection: VoiceConnection;
  opHandler: MediaGatewayOpHandler;

  constructor(connection: VoiceConnection) {
    this.connection = connection;
    this.opHandler = new MediaGatewayOpHandler(this);

    this.gateway.on('packet', this.onPacket.bind(this));
    this.gateway.on('warn', this.connection.emit.bind(this.connection, 'warn'));
    this.gateway.once('killed', this.connection.kill.bind(this.connection));
    this.gateway.once('transportReady', this.onTransportReady.bind(this));
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
            if (packet.userId !== null) {
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
    if (this.connection.opusDecoders.has(userId)) {
      const opusDecoder = <Opus.AudioOpus> this.connection.opusDecoders.get(userId);
      opusDecoder.delete();
      this.connection.opusDecoders.delete(userId);
    }
    const user = this.client.users.get(userId) || null;

    const payload: MediaEvents.ClientDisconnect = {user, userId};
    this.connection.emit('disconnect', payload);
  }

  [MediaOpCodes.SPEAKING](data: MediaRawEvents.Speaking) {
    const priority = (data['speaking'] & MediaSpeakingFlags.PRIORITY) === MediaSpeakingFlags.PRIORITY;
    const soundshare = (data['speaking'] & MediaSpeakingFlags.SOUNDSHARE) === MediaSpeakingFlags.SOUNDSHARE;
    const voice = (data['speaking'] & MediaSpeakingFlags.VOICE) === MediaSpeakingFlags.VOICE;
    const userId = data['user_id'];

    const payload: MediaEvents.Speaking = {
      isSpeaking: !!data['speaking'],
      priority,
      soundshare,
      ssrc: data['ssrc'],
      user: this.client.users.get(userId) || null,
      userId,
      voice,
    };
    this.connection.emit('speaking', payload);
  }
}
