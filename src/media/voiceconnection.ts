import {
  Constants as SocketConstants,
  Media,
} from 'detritus-client-socket';
import { EventSpewer } from 'detritus-utils';

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
export class VoiceConnection extends EventSpewer {
  client: ShardClient;
  decodeAudio: boolean;
  formats: {
    audio: AudioFormat,
  };
  gateway: Media.Socket;
  handler: MediaHandler;
  opusDecoder: null | OpusDecoderSettings;
  // keyed by ssrc, each stream needs its own decoder (opus keeps state between frames)
  opusDecoders: BaseCollection<number | string, Opus.AudioOpus>;
  // user id -> the ssrc of their decoder, so it can be freed when they disconnect
  opusDecoderSSRCs: Map<string, number>;
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
    this.opusDecoderSSRCs = new Map();
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
      opusDecoderSSRCs: {enumerable: false, writable: false},
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

  /**
   * @param ssrc the packet's ssrc (`packet.ssrc`), a user id also works but discord sends packets before saying whose they are
   */
  decode(
    ssrc: number | string,
    data: Buffer,
    options: DecodeSettings = {},
  ): Buffer {
    const format = options.format || MediaCodecTypes.AUDIO;
    const frameDuration = options.frameDuration || this.formats.audio.frameDuration;
    const type = options.type || MediaCodecs.OPUS;

    switch (format) {
      case MediaCodecTypes.AUDIO: {
        if (type === MediaCodecs.OPUS) {
          const opusDecoder = this.fetchOpusDecoder(ssrc);
          return opusDecoder.decode(data, frameDuration);
        }
      }; break;
    }
    throw new Error(`Cannot decode ${options.format}-${options.type} type data`);
  }

  fetchOpusDecoder(ssrc: number | string): Opus.AudioOpus {
    if (!this.opusDecoder) {
      throw new Error('Create an opus decoder before trying to decode opus!');
    }
    if (this.opusDecoders.has(ssrc)) {
      return <Opus.AudioOpus> this.opusDecoders.get(ssrc);
    }
    const opusDecoder = new Opus.AudioOpus(
      this.opusDecoder.sampleRate,
      this.opusDecoder.channels,
      {
        application: this.opusDecoder.application,
        use: this.opusDecoder.use,
      },
    );
    this.opusDecoders.set(ssrc, opusDecoder);
    return opusDecoder;
  }

  kill(error?: Error): void {
    // a newer connection for the same server may have replaced us in the cache
    if (this.client.voiceConnections.get(this.serverId) === this) {
      this.client.voiceConnections.delete(this.serverId);
    }
    this.gateway.kill();
    this.setOpusEncoder({kill: true});
    this.setOpusDecoder({kill: true});
    this.emit('killed', {error});
    this.removeAllListeners();
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
    // without decoder settings every received audio packet would emit a 'No Opus decoder provided' warn
    if (value && this.opusDecoder === null) {
      this.setOpusDecoder();
    }
    Object.defineProperty(this, 'decodeAudio', {value});
  }

  setOpusDecoder(options: boolean | OpusOptions = {}): void {
    options = <OpusOptions> Object.assign({}, options);
    if (options.kill) {
      if (this.opusDecoder !== null) {
        Object.defineProperty(this, 'opusDecoder', {value: null});
      }
      this.clearOpusDecoders();
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

    const value: OpusDecoderSettings = {
      application: options.application || Opus.Applications.AUDIO,
      channels: options.channels || this.formats.audio.channels,
      sampleRate: options.sampleRate || this.formats.audio.sampleRate,
      use: options.use,
    };

    if (this.opusDecoder !== null) {
      const noChanges = OpusProperties.every((property) => {
        return (<any> value)[property] === (<any> this.opusDecoder)[property];
      });
      if (noChanges) {
        return;
      }
    }

    Object.defineProperty(this, 'opusDecoder', {value});

    // decoders get lazily recreated with the new settings in `fetchOpusDecoder()`
    this.clearOpusDecoders();
  }

  /**
   * Frees every opus decoder, they get lazily recreated in `fetchOpusDecoder()`
   */
  clearOpusDecoders(): void {
    for (let [ssrc, decoder] of this.opusDecoders) {
      decoder.delete();
    }
    this.opusDecoders.clear();
    this.opusDecoderSSRCs.clear();
  }

  /**
   * Frees a user's opus decoder (like when they disconnect)
   */
  deleteOpusDecoder(userId: string): void {
    const ssrc = this.opusDecoderSSRCs.get(userId);
    this.opusDecoderSSRCs.delete(userId);
    for (let key of [ssrc, userId]) {
      if (key !== undefined && this.opusDecoders.has(key)) {
        this.opusDecoders.get(key)!.delete();
        this.opusDecoders.delete(key);
      }
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

    const settings = {
      application: options.application || Opus.Applications.AUDIO,
      channels: options.channels || this.formats.audio.channels,
      sampleRate: options.sampleRate || this.formats.audio.sampleRate,
      use: options.use,
    };

    if (this.opusEncoder !== null) {
      const noChanges = OpusProperties.every((property) => {
        return (<any> settings)[property] === (<any> this.opusEncoder)[property];
      });
      if (noChanges) {
        // keep the current encoder, anything referencing it stays valid
        return;
      }
    }

    const opusEncoder = new Opus.AudioOpus(
      settings.sampleRate,
      settings.channels,
      {
        application: settings.application,
        use: settings.use,
      },
    );
    if (this.opusEncoder !== null) {
      this.opusEncoder.delete();
    }
    Object.defineProperty(this, 'opusEncoder', {value: opusEncoder});
  }


  /* Gateway Functions */
  async setSpeaking(
    options: {
      delay?: number,
      priority?: boolean,
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

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: 'connect', listener: (payload: any) => any): this;
  on(event: 'disconnect', listener: (payload: any) => any): this;
  on(event: 'killed', listener: (payload: {error?: Error}) => any): this;
  on(event: 'speaking', listener: (payload: any) => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
