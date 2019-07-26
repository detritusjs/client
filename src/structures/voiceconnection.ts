import {
  Constants as SocketConstants,
  Media,
} from 'detritus-client-socket';

import { Client as ShardClient } from '../client';
import EventEmitter from '../eventemitter';


export interface VoiceConnectionOptions {
  decodeAudio?: boolean,
  opusDecoder?: null,
  opusEncoder?: null,
}


export class VoiceConnection extends EventEmitter {
  client: ShardClient;
  decodeAudio: boolean;
  formats: {
    audio: null,
  };
  gateway: Media.Socket;
  opusDecoder: null;
  opusDecoders: Map<string, any>;
  opusEncoder: null;

  constructor(
    client: ShardClient,
    gateway: Media.Socket,
    options: VoiceConnectionOptions = {},
  ) {
    super();

    this.client = client;
    this.gateway = gateway;

    this.decodeAudio = !!options.decodeAudio;
    this.opusDecoder = null;
    this.opusDecoders = new Map();
    this.opusEncoder = null;

    this.formats = {
      audio: null
    };

    if (options.opusDecoder || options.decodeAudio) {
      this.setOpusDecoder(options.opusDecoder);
      this.decodeAudio = true;
    }

    if (options.opusEncoder) {
      this.setOpusEncoder(options.opusEncoder);
    }

    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      decodeAudio: {configurable: true, enumerable: false, writable: false},
      formats: {writable: false},
      gateway: {enumerable: false, writable: false},
      opusDecoder: {configurable: true, enumerable: false, writable: false},
      opusDecoders: {enumerable: false, writable: false},
      opusEncoder: {configurable: true, enumerable: false, writable: false},
    });
  }

  get channelId(): string {
    return this.gateway.channelId;
  }

  get channel(): null {
    return null;
  }

  get guildId(): null | string {
    return this.gateway.guildId;
  }

  get guild(): null {
    return null;
  }

  get killed(): boolean {
    return this.gateway.killed;
  }

  get member(): null {
    return null;
  }

  get serverId(): string {
    return this.gateway.serverId;
  }

  get userId(): string {
    return this.gateway.userId;
  }

  get user(): null {
    return null;
  }

  get voiceState(): null {
    return null;
  }

  decode(
    userId: string,
    data: Buffer,
    options: {
      format?: string,
    } = {},
  ): Buffer {
    let format: String = options.format || SocketConstants.MediaCodecTypes.AUDIO
    if (format === undefined) {

    }
    return Buffer.alloc(0);
  }

  fetchOpusDecoder(userId: string): null {
    return null;
  }

  kill(): void {
    this.client.voiceConnections.delete(this.serverId);
    this.gateway.kill();
    this.setOpusEncoder({kill: true});
    this.setOpusDecoder({kill: true});
    this.emit('killed');
  }

  sendAudio(
    data: Buffer,
    options: {
      isOpus?: boolean,
    } = {},
  ): void {

  }

  setDecodeAudio(value: boolean): void {
    Object.defineProperty(this, 'decodeAudio', {value});
  }

  setOpusDecoder(options: OpusOptions | null = {}): void {
    
  }

  setOpusEncoder(options: OpusOptions | null = {}): void {

  }

  async setSpeaking(
    options: {
      delay?: number,
      ssrc?: number,
      soundshare?: boolean,
      voice?: boolean,
    },
  ): Promise<void> {
    return new Promise((resolve) => {
      this.gateway.sendSpeaking(options, resolve);
    });
  }

  async setState(
    options: {
      selfDeaf?: boolean,
      selfMute?: boolean,
      selfVideo?: boolean,
    },
  ): Promise<void> {
    return new Promise((resolve) => {
      this.gateway.sendStateUpdate(options, resolve);
    });
  }

  setDeaf(selfDeaf: boolean): Promise<void> {
    return this.setState({selfDeaf});
  }

  setMute(selfMute: boolean): Promise<void> {
    return this.setState({selfMute});
  }

  setVideo(selfVideo: boolean): Promise<void> {
    return this.setState({selfVideo});
  }
}

export interface OpusOptions {
  application?: string,
  channels?: number,
  kill?: boolean,
  mod?: string,
  sampleRate?: number,
}
