export const DependencyTypes = Object.freeze({
  DISCORDJS_OPUS: '@discordjs/opus',
  NODE_OPUS: 'node-opus',
  OPUSSCRIPT: 'opusscript',
});

const DEPENDENCY_TYPES: Array<string> = Object.values(DependencyTypes);


const Opus: {[key: string]: any} = {};

for (let dependency of DEPENDENCY_TYPES) {
  try {
    Opus[dependency] = require(dependency);
  } catch(e) {}
}


export const Applications = Object.freeze({
  VOIP: 2048,
  AUDIO: 2049,
  RESTRICTED_LOWDELAY: 2051,
});

export const CTL = Object.freeze({
  BITRATE: 4002,
  FEC: 4012,
  PLP: 4014,
});

export const MAX_BITRATE = 128000;
export const MIN_BITRATE = 16000;

export const ValidSampleRates = [
  8000,
  12000,
  16000,
  24000,
  48000,
];


export interface AudioOpusOptions {
  application?: number,
  use?: null | string,
}

export class AudioOpus {
  opus: any;

  application: number = 0;
  channels: number = 0;
  sampleRate: number = 0;
  use: string = '';

  constructor(
    sampleRate: number,
    channels: number,
    options: AudioOpusOptions = {},
  ) {
    Object.defineProperties(this, {
      application: {configurable: true, writable: false},
      channels: {configurable: true, writable: false},
      opus: {configurable: true, enumerable: false, writable: false},
      sampleRate: {configurable: true, writable: false},
      use: {configurable: true, writable: false},
    });

    this.setApplication(options.application || Applications.AUDIO);
    this.setChannels(channels);
    this.setSampleRate(sampleRate);
    this.setModule(options.use || DEPENDENCY_TYPES.find((m) => m in Opus));
    this.recreate();
  }

  get module(): any {
    if (!this.use) {
      throw new Error('Module missing, cannot opus encode/decode.');
    }
    return (Opus as any)[this.use];
  }

  get enabled(): boolean {
    return !!this.opus;
  }

  delete(): AudioOpus {
    if (this.enabled) {
      switch (this.use) {
        case DependencyTypes.OPUSSCRIPT: {
          this.opus.delete();
        }; break;
      }
      Object.defineProperty(this, 'opus', {value: null});
    }
    return this;
  }

  recreate(): AudioOpus {
    if (!this.use) {
      throw new Error('Module missing, set one using setModule()');
    }
    if (!this.application) {
      throw new Error('Cannot create an Opus object without an application setting!');
    }
    if (!this.channels) {
      throw new Error('Cannot create an Opus object without a channels setting!');
    }
    if (!this.sampleRate) {
      throw new Error('Cannot create an Opus object without a sampleRate setting!');
    }
    if (this.enabled) {
      this.delete();
    }

    let opus: any;
    switch (this.use) {
      case DependencyTypes.DISCORDJS_OPUS:
      case DependencyTypes.NODE_OPUS: {
        opus = new this.module.OpusEncoder(this.sampleRate, this.channels, this.application);
      }; break;
      case DependencyTypes.OPUSSCRIPT: {
        opus = new this.module(this.sampleRate, this.channels, this.application);
      }; break;
    }

    Object.defineProperty(this, 'opus', {value: opus});
    return this;
  }

  setApplication(value: number): AudioOpus {
    Object.defineProperty(this, 'application', {value});
    return (this.enabled) ? this.recreate() : this;
  }

  setChannels(value: number): AudioOpus {
    Object.defineProperty(this, 'channels', {value});
    return (this.enabled) ? this.recreate() : this;
  }

  setSampleRate(value: number): AudioOpus {
    if (!ValidSampleRates.includes(value)) {
      throw new Error(`Invalid Sample Rate provided, please choose one of: ${JSON.stringify(ValidSampleRates)}`);
    }
    Object.defineProperty(this, 'sampleRate', {value});
    return (this.enabled) ? this.recreate() : this;
  }

  setModule(value?: string): AudioOpus {
    if (value === undefined) {
      if (this.use) {
        value = this.use;
      } else {
        throw new Error('Provide a module to use.');
      }
    }
    if (!DEPENDENCY_TYPES.includes(value)) {
      throw new Error(`Invalid module '${value}', please use one of: ${JSON.stringify(DEPENDENCY_TYPES)}`);
    }
    if (!(value in Opus)) {
      throw new Error(`Module '${value}' is not installed, please use one of: ${JSON.stringify(DEPENDENCY_TYPES)}`);
    }
    Object.defineProperty(this, 'use', {value});
    return (this.enabled) ? this.recreate() : this;
  }

  /* CTL stuff */

  setBitrate(bitrate: number): AudioOpus {
    bitrate = Math.min(MAX_BITRATE, Math.max(MIN_BITRATE, bitrate))
    return this.setCTL(CTL.BITRATE, bitrate);
  }

  setFEC(enabled: boolean): AudioOpus {
    const value = +!!enabled;
    return this.setCTL(CTL.FEC, value);
  }

  setPLP(percentage: number): AudioOpus {
    percentage = Math.min(100, Math.max(0, percentage));
    return this.setCTL(CTL.PLP, percentage);
  }

  setCTL(flag: number, value: number): AudioOpus {
    if (!this.enabled) {
      throw new Error('Object was deleted, reinitialize with recreate()');
    }
    switch (this.use) {
      case DependencyTypes.DISCORDJS_OPUS:
      case DependencyTypes.NODE_OPUS: {
        this.opus.applyEncoderCTL([flag, value]);
      }; break;
      case DependencyTypes.OPUSSCRIPT: {
        this.opus.encoderCTL([flag, value]);
      }; break;
    }
    return this;
  }

  decode(
    buf: Buffer,
    frameDuration: number = 20,
  ): Buffer {
    if (!this.enabled) {
      throw new Error('Object was deleted, reinitialize with recreate()');
    }
    const frameSize = (this.sampleRate / 1000) * frameDuration;

    let packet: Buffer;
    switch (this.use) {
      case DependencyTypes.DISCORDJS_OPUS: {
        packet = this.opus.decode(buf);
      }; break;
      case DependencyTypes.NODE_OPUS: {
        packet = this.opus.decode(buf, frameSize);
      }; break;
      case DependencyTypes.OPUSSCRIPT: {
        packet = this.opus.decode(buf);
      }; break;
      default: {
        throw new Error('Unknown Module');
      };
    }
    return packet;
  }

  encode(
    buf: Buffer,
    frameDuration: number = 20,
  ): Buffer {
    if (!this.enabled) {
      throw new Error('Object was deleted, reinitialize with recreate()');
    }
    const frameSize = (this.sampleRate / 1000) * frameDuration;

    let packet: Buffer;
    switch (this.use) {
      case DependencyTypes.DISCORDJS_OPUS: {
        packet = this.opus.encode(buf);
      }; break;
      case DependencyTypes.NODE_OPUS: {
        packet = this.opus.encode(buf, frameSize);
      }; break;
      case DependencyTypes.OPUSSCRIPT: {
        packet = this.opus.encode(buf, frameSize);
      }; break;
      default: {
        throw new Error('Unknown Module');
      };
    }
    return packet;
  }
}
