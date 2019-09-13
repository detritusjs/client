import * as path from 'path';

import { Client as DetritusRestClient } from 'detritus-client-rest';
import { EventEmitter, Timers } from 'detritus-utils';


import { ClusterProcess } from './cluster/process';
import { BaseCollection } from './collections/basecollection';
import { AuthTypes, ClientEvents, DEFAULT_SHARD_LAUNCH_DELAY } from './constants';
import { ClusterIPCError } from './errors';
import { Snowflake } from './utils';


export interface ClusterManagerOptions {
  isAbsolute?: boolean,
  respawn?: boolean,
  shardCount?: number,
  shards?: [number, number],
  shardsPerCluster?: number,
}

export interface ClusterManagerRunOptions {
  delay?: number,
  shardCount?: number,
  url?: string,
}

export class ClusterManager extends EventEmitter {
  file: string;
  processes = new BaseCollection<number, ClusterProcess>();
  ran: boolean = false;
  respawn: boolean = true;
  rest: DetritusRestClient;
  shardCount: number = 0;
  shardEnd: number = -1;
  shardStart: number = 0;
  shardsPerCluster: number = 4;
  token: string;

  constructor(
    file: string,
    token: string,
    options: ClusterManagerOptions = {},
  ) {
    super();
    this.file = file;
    if (!options.isAbsolute) {
      if (require.main) {
        this.file = path.join(path.dirname(require.main.filename), this.file);
      }
    }
    if (!token) {
      throw new Error('Token is required for this library to work.');
    }
    this.token = token;

    this.respawn = (options.respawn || options.respawn === undefined);
    this.rest = new DetritusRestClient(token, {authType: AuthTypes.BOT});

    this.shardCount = +(options.shardCount || this.shardCount);
    if (Array.isArray(options.shards)) {
      if (options.shards.length !== 2) {
        throw new Error('Shards need to be in the format of [shardStart, shardEnd]');
      }
      const [shardStart, shardEnd] = options.shards;
      this.shardEnd = +shardEnd;
      this.shardStart = +shardStart;
    }
    this.shardsPerCluster = +(options.shardsPerCluster || this.shardsPerCluster);

    Object.defineProperties(this, {
      ran: {configurable: true, writable: false},
      rest: {enumerable: false, writable: false},
      token: {enumerable: false, writable: false},
    });

    process.env.CLUSTER_MANAGER = String(true);
    process.env.CLUSTER_TOKEN = this.token;
  }

  get clusterCount(): number {
    return Math.ceil(this.shardCount / this.shardsPerCluster);
  }

  async run(
    options: ClusterManagerRunOptions = {},
  ): Promise<ClusterManager> {
    if (this.ran) {
      return this;
    }
    options = Object.assign({
      delay: DEFAULT_SHARD_LAUNCH_DELAY,
    }, options);

    const delay = <number> options.delay;

    let shardCount: number = +(options.shardCount || this.shardCount || 0);
    let url: string = options.url || '';
    if (!url || !shardCount) {
      const data = await this.rest.fetchGatewayBot();
      shardCount = shardCount || data.shards;
      url = url || data.url;
    }
    if (!shardCount) {
      throw new Error('Shard Count cannot be 0, pass in one via the options or the constructor.');
    }
    this.shardCount = shardCount;
    if (this.shardEnd === -1) {
      this.shardEnd = shardCount - 1;
    }

    let clusterId = 0;
    for (let shardStart = this.shardStart; shardStart <= this.shardEnd; shardStart += this.shardsPerCluster) {
      shardStart = Math.min(shardStart, this.shardEnd);
      const shardEnd = Math.min(shardStart + this.shardsPerCluster - 1, this.shardEnd);

      const clusterProcess = new ClusterProcess(this, {
        clusterId,
        env: {
          GATEWAY_URL: url,
        },
        shardCount,
        shardEnd,
        shardStart,
      });
      this.processes.set(clusterId, clusterProcess);
      this.emit(ClientEvents.CLUSTER_PROCESS, {clusterProcess});

      await clusterProcess.run();
      if (shardEnd < this.shardEnd) {
        await Timers.sleep(delay * (shardEnd - shardStart));
      }
      clusterId++;
    }
    Object.defineProperty(this, 'ran', {value: true});
    return this;
  }

  async broadcast(message: any): Promise<Array<any>> {
    const promises = this.processes.map((clusterProcess) => {
      return clusterProcess.send(message);
    });
    return Promise.all(promises);
  }

  async broadcastEvalRaw(
    code: Function | string,
    nonce: string = Snowflake.generate().id,
  ): Promise<Array<[any, boolean]>> {
    const promises = this.processes.map((clusterProcess) => {
      return clusterProcess.eval(code, nonce);
    });
    const results: Array<[any, boolean]> = await Promise.all(promises);
    return results.filter((item) => item);
  }

  async broadcastEval(
    code: Function | string,
    nonce: string = Snowflake.generate().id,
  ): Promise<Array<any>> {
    const results = await this.broadcastEvalRaw(code, nonce);
    return results.map(([result, isError]) => {
      if (isError) {
        return new ClusterIPCError(result);
      }
      return result;
    });
  }

  on(event: string, listener: Function): this;
  on(event: 'clusterProcess', listener: (payload: {clusterProcess: ClusterProcess}) => any): this;
  on(event: string, listener: Function): this {
    super.on(event, listener);
    return this;
  }
}
