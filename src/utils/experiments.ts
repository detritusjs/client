/**
 * Helpers for the data from `rest.fetchExperiments()`
 * discord sends experiments as rows of values and names them by a hash, these turn the rows into objects and names into hashes
 */

export interface ExperimentAssignment {
  aaMode: boolean,
  // which variation we got, `-1` is none (not in the experiment) and `0` is the control
  bucket: number,
  hash: number,
  // where we landed out of 10000, the populations' ranges are matched against this
  hashResult: number,
  holdoutBucket: null | number,
  holdoutName: null | string,
  holdoutRevision: null | number,
  // as discord sends it, `-1` when there isn't one
  override: number,
  population: number,
  revision: number,
  triggerDebugging: boolean,
}

export interface GuildExperimentOverride {
  bucket: number,
  // guild (or user) ids that are put into the bucket no matter what the rollout says
  ids: Array<string>,
}

export interface GuildExperiment {
  aaMode: boolean,
  hash: number,
  // what's hashed with the guild's id instead of the experiment's name, if set
  hashKey: null | string,
  holdoutBucket: null | number,
  holdoutName: null | string,
  overrides: Array<GuildExperimentOverride>,
  // the same as `populations`, but only applied to the guilds matching its filters
  overridesFormatted: Array<any>,
  // the rollout's rules as discord sends them: the buckets with their ranges (out of 10000), and the filters a guild has to pass
  populations: Array<any>,
  revision: number,
  triggerDebugging: boolean,
}


/**
 * MurmurHash3 (32 bit) of the utf-8 text, it's what discord hashes experiment names (and `name:id` for rollouts) with
 */
export function murmurHash3(text: string, seed: number = 0): number {
  const bytes = Buffer.from(text, 'utf8');
  const blocks = bytes.length - (bytes.length % 4);

  let hash = seed;
  let chunk = 0;
  let i = 0;
  for (; i < blocks; i += 4) {
    chunk = bytes.readUInt32LE(i);
    chunk = Math.imul(chunk, 0xcc9e2d51);
    chunk = (chunk << 15) | (chunk >>> 17);
    chunk = Math.imul(chunk, 0x1b873593);

    hash ^= chunk;
    hash = (hash << 13) | (hash >>> 19);
    hash = (Math.imul(hash, 5) + 0xe6546b64) | 0;
  }

  chunk = 0;
  switch (bytes.length % 4) {
    case 3: chunk ^= bytes[i + 2] << 16;
    case 2: chunk ^= bytes[i + 1] << 8;
    case 1: {
      chunk ^= bytes[i];
      chunk = Math.imul(chunk, 0xcc9e2d51);
      chunk = (chunk << 15) | (chunk >>> 17);
      chunk = Math.imul(chunk, 0x1b873593);
      hash ^= chunk;
    };
  }

  hash ^= bytes.length;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}


/**
 * The hash discord identifies an experiment by, from its name (like `2022-07_voice_in_threads`)
 */
export function hash(name: string): number {
  return murmurHash3(name);
}


/**
 * Where a guild (or user) lands in an experiment's rollout, out of 10000
 * `key` is the experiment's name, or its `hashKey` if it has one
 */
export function position(key: string, id: string): number {
  return murmurHash3(`${key}:${id}`) % 10000;
}


export function parseAssignment(row: Array<any>): ExperimentAssignment {
  return {
    aaMode: !!row[6],
    bucket: row[2],
    hash: row[0],
    hashResult: row[5],
    holdoutBucket: (row[10] === undefined) ? null : row[10],
    holdoutName: row[8] || null,
    holdoutRevision: (row[9] === undefined) ? null : row[9],
    override: row[3],
    population: row[4],
    revision: row[1],
    triggerDebugging: !!row[7],
  };
}


export function parseGuildExperiment(row: Array<any>): GuildExperiment {
  return {
    aaMode: !!row[8],
    hash: row[0],
    hashKey: row[1] || null,
    holdoutBucket: (row[7] === undefined) ? null : row[7],
    holdoutName: row[6] || null,
    overrides: (row[4] || []).map((raw: {b: number, k: Array<string>}) => ({bucket: raw.b, ids: raw.k || []})),
    overridesFormatted: row[5] || [],
    populations: row[3] || [],
    revision: row[2],
    triggerDebugging: !!row[9],
  };
}


/**
 * Finds an experiment by its name in the `assignments` or `guild_experiments` rows from `rest.fetchExperiments()`
 */
export function find(rows: Array<Array<any>> | undefined, name: string): Array<any> | null {
  const wanted = hash(name);
  for (let row of (rows || [])) {
    if (row[0] === wanted) {
      return row;
    }
  }
  return null;
}
