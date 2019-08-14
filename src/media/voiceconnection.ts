import {
  Constants as SocketConstants,
  Media,
} from 'detritus-client-socket';
import { EventEmitter } from 'detritus-utils';

const {
  MediaCodecs,
  MediaCodecTypes,
} = SocketConstants;


import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { DiscordOpusFormat } from '../constants';
import { AudioFormat } from '../utils/audioformat';

import {
  Channel,
  Guild,
  Member,
  User,
  VoiceState,
} from '../structures';

import { Opus } from './encoders';
import { MediaHandler } from './handler';


/**
 * Voice Connection .decode() Settings
 * @category Media Options
 */
export interface DecodeSettings {
  format?: string,
  frameDuration?: number,
  type?: string,
}

/**
 * Voice Connection Opus Options
 * @category Media Opus
 */
export interface OpusOptions extends Opus.AudioOpusOptions {
  application?: number,
  channels?: number,
  kill?: boolean,
  sampleRate?: number,
  use?: null | string,
}

/**
 * Voice Connection Opus Decoder Settings
 * @category Media Options
 */
export interface OpusDecoderSettings {
  application: number,
  channels: number,
  sampleRate: number,
  use?: null | string,
}

/**
 * Voice Connection .sendAudio() Settings
 * @category Media Options
 */
export interface SendAudioSettings {
  isOpus?: boolean,
}

/**
 * Voice Connection Options
 * @category Media Options
 */
export interface VoiceConnectionOptions {
  decodeAudio?: boolean,
  opusDecoder?: boolean | OpusOptions,
  opusEncoder?: boolean | OpusOptions,
}


const OpusProperties = [
  'application',
  'channels',
  'sampleRate',
  'use',
];


/**
 * Voice Connection
 * @category Media
 */
export class VoiceConnection extends EventEmitter {
  client: ShardClient;
  decodeAudio: boolean;
  formats: {
    audio: AudioFormat,
  };
  gateway: Media.Socket;
  handler: MediaHandler;
  opusDecoder: null | OpusDecoderSettings;
  opusDecoders: BaseCollection<string, Opus.AudioOpus>;
  opusEncoder: null | Opus.AudioOpus;

  constructor(
    client: ShardClient,
    gateway: Media.Socket,
    options: VoiceConnectionOptions = {},
  ) {
    super();

    this.client = client;
    this.gateway = gateway;
    this.handler = new MediaHandler(this);

    this.decodeAudio = !!options.decodeAudio;
    this.opusDecoder = null;
    this.opusDecoders = new BaseCollection();
    this.opusEncoder = null;

    this.formats = {
      audio: new AudioFormat({
        channels: DiscordOpusFormat.CHANNELS,
        sampleRate: DiscordOpusFormat.SAMPLE_RATE,
      }),
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
      handler: {enumerable: false, writable: false},
      opusDecoder: {configurable: true, enumerable: false, writable: false},
      opusDecoders: {enumerable: false, writable: false},
      opusEncoder: {configurable: true, enumerable: false, writable: false},
    });
  }

  get channel(): Channel | null {
    if (this.channelId !== null) {
      return this.client.channels.get(this.channelId) || null;
    }
    return null;
  }

  get channelId(): string {
    return this.gateway.channelId;
  }

  get guild(): Guild | null {
    if (this.guildId !== null) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get guildId(): null | string {
    return this.gateway.guildId;
  }

  get killed(): boolean {
    return this.gateway.killed;
  }

  get member(): Member | null {
    if (this.guildId !== null) {
      return (<Member | undefined> this.client.members.get(this.guildId, this.userId)) || null;
    }
    return null;
  }

  get serverId(): string {
    return this.gateway.serverId;
  }

  get user(): null | User {
    return this.client.users.get(this.userId) || null;
  }

  get userId(): string {
    return this.gateway.userId;
  }

  get voiceState(): null | VoiceState {
    return (<undefined | VoiceState> this.client.voiceStates.get(this.serverId, this.userId)) || null;
  }

  decode(
    userId: string,
    data: Buffer,
    options: DecodeSettings = {},
  ): Buffer {
    const format = options.format || MediaCodecTypes.AUDIO;
    const frameDuration = options.frameDuration || this.formats.audio.frameDuration;
    const type = options.type || MediaCodecs.OPUS;

    switch (format) {
      case MediaCodecTypes.AUDIO: {
        if (type === MediaCodecs.OPUS) {
          const opusDecoder = this.fetchOpusDecoder(userId);
          return opusDecoder.decode(data, frameDuration);
        }
      }; break;
    }
    throw new Error(`Cannot decode ${options.format}-${options.type} type data`);
  }

  fetchOpusDecoder(userId: string): Opus.AudioOpus {
    if (!this.opusDecoder) {
      throw new Error('Create an opus decoder before trying to decode opus!');
    }
    if (this.opusDecoders.has(userId)) {
      return <Opus.AudioOpus> this.opusDecoders.get(userId);
    }
    const opusDecoder = new Opus.AudioOpus(
      this.opusDecoder.sampleRate,
      this.opusDecoder.channels,
      {
        application: this.opusDecoder.application,
        use: this.opusDecoder.use,
      },
    );
    this.opusDecoders.set(userId, opusDecoder);
    return opusDecoder;
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
    options: SendAudioSettings = {},
  ): void {
    if (this.killed) {
      return;
    }
    if (!this.gateway.transport) {
      throw new Error('Transport isn\'t initialized yet!');
    }
    if (!options.isOpus) {
      if (this.opusEncoder === null) {
        throw new Error('Cannot send in Non-Opus Data without an opus encoder!');
      }
      data = this.opusEncoder.encode(data, this.formats.audio.frameDuration);
    }

    // assume its 48000 sample rate, 2 channels
    this.gateway.transport.sendAudioFrame(data, {
      incrementTimestamp: true,
      timestamp: this.formats.audio.samplesPerFrame,
    });
  }

  sendAudioSilenceFrame(): void {
    if (this.killed) {
      return;
    }
    if (!this.gateway.transport) {
      throw new Error('Transport isn\'t initialized yet!');
    }
    return this.gateway.transport.sendAudioSilenceFrame();
  }

  setDecodeAudio(value: boolean): void {
    Object.defineProperty(this, 'decodeAudio', {value});
  }

  setOpusDecoder(options: boolean | OpusOptions = {}): void {
    options = <OpusOptions> Object.assign({}, options);
    if (options.kill) {
      if (this.opusDecoder !== null) {
        Object.defineProperty(this, 'opusDecoder', {value: null});
      }
      if (this.opusDecoders.length) {
        for (let [userId, decoder] of this.opusDecoders) {
          decoder.delete();
        }
        this.opusDecoders.clear();
      }
      return;
    }

    if (options.use === undefined) {
      // Check Decoder first
      if (this.opusDecoder !== null) {
        options.use = this.opusDecoder.use;
      } else if (this.opusEncoder !== null) {
        options.use = this.opusEncoder.use;
      }
    }

    if (this.opusDecoder !== null) {
      const noChanges = OpusProperties.every((property) => {
        return (<any> options)[property] === (<any> this.opusDecoder)[property];
      });
      if (noChanges) {
        return;
      }
    }

    const value: OpusDecoderSettings = {
      application: options.application || Opus.Applications.AUDIO,
      channels: options.channels || this.formats.audio.channels,
      sampleRate: options.sampleRate || this.formats.audio.sampleRate,
      use: options.use,
    };
    Object.defineProperty(this, 'opusDecoder', {value});

    for (let [userId, decoder] of this.opusDecoders) {
      decoder.delete();
      this.fetchOpusDecoder(userId);
    }
  }

  setOpusEncoder(options: boolean | OpusOptions = {}): void {
    options = <OpusOptions> Object.assign({}, options);
    if (options.kill) {
      if (this.opusEncoder !== null) {
        this.opusEncoder.delete();
        Object.defineProperty(this, 'opusEncoder', {value: null});
      }
      return;
    }

    if (options.use === undefined) {
      // Check Encoder first
      if (this.opusEncoder !== null) {
        options.use = this.opusEncoder.use;
      } else if (this.opusDecoder !== null) {
        options.use = this.opusDecoder.use;
      }
    }

    if (this.opusEncoder !== null) {
      const anyChanges = OpusProperties.some((property) => {
        return (<any> options)[property] !== (<any> this.opusEncoder)[property];
      });
      if (anyChanges) {
        this.opusEncoder.delete();
        Object.defineProperty(this, 'opusEncoder', {value: null});
      }
    }

    const opusEncoder = new Opus.AudioOpus(
      options.sampleRate || this.formats.audio.sampleRate,
      options.channels || this.formats.audio.channels,
      {
        application: options.application || Opus.Applications.AUDIO,
        use: options.use,
      },
    );
    Object.defineProperty(this, 'opusEncoder', {value: opusEncoder});
  }


  /* Gateway Functions */
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
