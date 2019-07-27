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
import * as Types from './types';
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

  onPacket(packet: Types.MediaGatewayPacket): void {
    const handler = this.opHandler.getHandler(packet.op);
    if (handler) {
      handler.call(this.opHandler, packet.d);
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

  getHandler(op: number): MediaGatewayOpHandlerFunction | undefined {
    return (<any> this)[op];
  }

  [MediaOpCodes.CLIENT_CONNECT](data: Types.ClientConnect) {
    const userId = data['user_id'];
    this.connection.emit('connect', {
      audioSSRC: data['audio_ssrc'],
      user: this.client.users.get(userId),
      userId,
      videoSSRC: data['video_ssrc'],
    });
  }

  [MediaOpCodes.CLIENT_DISCONNECT](data: Types.ClientDisconnect) {
    const userId = data['user_id'];
    if (this.connection.opusDecoders.has(userId)) {
      const opusDecoder = <Opus.AudioOpus> this.connection.opusDecoders.get(userId);
      opusDecoder.delete();
      this.connection.opusDecoders.delete(userId);
    }
    this.connection.emit('disconnect', {
      user: this.client.users.get(userId),
      userId,
    });
  }

  [MediaOpCodes.SPEAKING](data: Types.Speaking) {
    const priority = (data['speaking'] & MediaSpeakingFlags.PRIORITY) === MediaSpeakingFlags.PRIORITY;
    const soundshare = (data['speaking'] & MediaSpeakingFlags.SOUNDSHARE) === MediaSpeakingFlags.SOUNDSHARE;
    const voice = (data['speaking'] & MediaSpeakingFlags.VOICE) === MediaSpeakingFlags.VOICE;

    const userId = data['user_id'];
    this.connection.emit('speaking', {
      isSpeaking: !!data['speaking'],
      priority,
      soundshare,
      voice,
      ssrc: data['ssrc'],
      user: this.client.users.get(userId),
      userId,
    });
  }
}
