export const ValidEndianness = Object.freeze({
  BE: 'BE',
  LE: 'LE',
});


export interface AudioFormatOptions {
  bitDepth?: number,
  channels?: number,
  endianness?: string,
  frameDuration?: number,
  sampleRate?: number,
}

export class AudioFormat {
  bitDepth: number = 16;
  channels: number = 2;
  endianness: string = ValidEndianness.LE;
  frameDuration: number = 20;
  sampleRate: number = 48000;

  constructor(
    options: AudioFormatOptions = {},
  ) {
    if (options.bitDepth !== undefined) {
      this.bitDepth = +options.bitDepth;
    }
    if (options.channels !== undefined) {
      this.channels = +options.channels;
    }
    if (options.endianness !== undefined) {
      this.endianness = options.endianness;
    }
    if (options.frameDuration !== undefined) {
      this.frameDuration = +options.frameDuration;
    }
    if (options.sampleRate !== undefined) {
      this.sampleRate = +options.sampleRate;
    }
  }

  get byteDepth(): number {
    return Math.round(this.bitDepth / 8);
  }

  get frameSize(): number {
    return this.samplesPerFrame * this.sampleSize;
  }

  get samplesPerFrame(): number {
    return Math.round((this.sampleRate / 1000) * this.frameDuration);
  }

  get samplesPerTick(): number {
    return Math.round((this.sampleRate / 1000) * this.byteDepth);
  }

  get sampleSize(): number {
    return this.byteDepth * this.channels;
  }

  get pcmMult(): number {
    return Math.pow(2, this.bitDepth) / 2;
  }

  get pcmMax(): number {
    return this.pcmMult - 1;
  }

  get pcmMin(): number {
    return -this.pcmMax;
  }

  get readFunc(): string {
    return `readInt${this.bitDepth}${this.endianness}`;
  }

  get writeFunc(): string {
    return `writeInt${this.bitDepth}${this.endianness}`;
  }
}
