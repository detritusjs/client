import { DISCORD_EPOCH } from '../constants';


const bits = Object.freeze({
  processId: 5,
  workerId: 5,
  sequence: 12,
});

const max = Object.freeze({
  timestamp: 0x40000000000,
  middle: -1 ^ (-1 << (bits.workerId + bits.processId + bits.sequence)),
  processId: -1 ^ (-1 << bits.processId),
  sequence: -1 ^ (-1 << bits.sequence),
  workerId: -1 ^ (-1 << bits.workerId),
});

const cache = {
  sequence: 0,
};


export interface Snowflake {
  binary: string,
  id: string,
  processId: number,
  sequence: number,
  timestamp: number,
  workerId: number,
}

export interface SnowflakeGenerateOptions {
  epoch?: number,
  processId?: number,
  sequence?: number,
  timestamp?: number,
  workerId?: number,
}

export function generate(
  options: SnowflakeGenerateOptions = {},
): Snowflake {
  options = Object.assign({}, options);
  if (options.epoch === undefined) {
    options.epoch = DISCORD_EPOCH;
  }
  if (options.processId === undefined) {
    options.processId = 0;
  }
  if (options.timestamp === undefined) {
    options.timestamp = Date.now();
  }
  if (options.workerId === undefined) {
    options.workerId = 0;
  }

  const snowflake: Snowflake = {
    binary: '',
    id: '',
    processId: options.processId & max.processId,
    sequence: 0,
    timestamp: (options.timestamp - options.epoch) % max.timestamp,
    workerId: options.workerId & max.workerId,
  };

  if (options.sequence === undefined) {
    snowflake.sequence = cache.sequence = ++cache.sequence & max.sequence;
  } else {
    snowflake.sequence = options.sequence & max.sequence;
  }

  let processId = snowflake.processId.toString(2).padStart(5, '0');
  let sequence = snowflake.sequence.toString(2).padStart(12, '0');
  let timestamp = snowflake.timestamp.toString(2).padStart(42, '0');
  let workerId = snowflake.workerId.toString(2).padStart(5, '0');

  let binary = snowflake.binary = timestamp + workerId + processId + sequence;
  //thanks discord.js
  while (binary.length > 50) {
    const high = parseInt(binary.slice(0, -32), 2);
    const low = parseInt((high % 10).toString(2) + binary.slice(-32), 2);

    snowflake.id = (low % 10).toString() + snowflake.id;
    binary = Math.floor(high / 10).toString(2) + Math.floor(low / 10).toString(2).padStart(32, '0');
  }

  let binaryNumber = parseInt(binary, 2);
  while (0 < binaryNumber) {
    snowflake.id = (binaryNumber % 10).toString() + snowflake.id;
    binaryNumber = Math.floor(binaryNumber / 10);
  }

  return snowflake;
}

export interface SnowflakeDeconstructOptions {
  epoch?: number,
}
export interface SnowflakeDeconstructOptionsRequired {
  epoch: number,
}

export function deconstruct(
  id: string,
  options: SnowflakeDeconstructOptions = {},
): Snowflake {
  options = Object.assign({}, options);
  if (options.epoch === undefined) {
    options.epoch = DISCORD_EPOCH;
  }

  const snowflake = {
    binary: '',
    id,
    processId: 0,
    sequence: 0,
    timestamp: 0,
    workerId: 0,
  };

  //thanks discord.js
  let high = parseInt(id.slice(0, -10)) || 0;
  let low = parseInt(id.slice(-10));
  while (low > 0 || high > 0) {
    snowflake.binary = (low & 1).toString() + snowflake.binary;
    low = Math.floor(low / 2);
    if (high > 0) {
      low += 5000000000 * (high % 2);
      high = Math.floor(high / 2);
    }
  }

  snowflake.binary = snowflake.binary.padStart(64, '0');
  snowflake.timestamp = parseInt(snowflake.binary.slice(0, 42), 2) + options.epoch;
  snowflake.workerId = parseInt(snowflake.binary.slice(42, 47), 2);
  snowflake.processId = parseInt(snowflake.binary.slice(47, 52), 2);
  snowflake.sequence = parseInt(snowflake.binary.slice(52, 64), 2);
  return snowflake;
}

export function timestamp(
  id: string,
  options: SnowflakeDeconstructOptions = {},
): number {
  options = Object.assign({}, options);
  if (options.epoch === undefined) {
    options.epoch = DISCORD_EPOCH;
  }
  if (id) {
    return Math.round((parseInt(id) / max.middle) + options.epoch);
  }
  return 0;
}
