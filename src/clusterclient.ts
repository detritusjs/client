import {
  Client as DetritusRestClient,
  Constants as RestConstants,
} from 'detritus-client-rest';

import {
  ShardClient,
  ShardClientOptions,
  ShardClientRunOptions,
} from './client';
import { BaseCollection } from './collections/basecollection';
import EventEmitter from './eventemitter';


export type ShardsCollection = BaseCollection<number, ShardClient>;

export interface ClusterClientOptions extends ShardClientOptions {
  shardCount?: number,
  shards?: [number, number],
}

export interface ClusterClientRunOptions extends ShardClientRunOptions {
  shardCount?: number,
  delay?: number,
}

export class ClusterClient extends EventEmitter {
  readonly token: string;

  ran: boolean = false;
  rest: DetritusRestClient;
  shardCount: number = 0;
  shardEnd: number = -1;
  shardStart: number = 0;
  shards: ShardsCollection = new BaseCollection();
  shardOptions: ShardClientOptions = {};

  constructor(
    token: string,
    options: ClusterClientOptions = {},
  ) {
    super();
    if (!token) {
      throw new Error('Token is required for this library to work.');
    }
    this.token = token;

    this.shardCount = options.shardCount || this.shardCount;
    if (Array.isArray(options.shards)) {
      if (options.shards.length !== 2) {
        throw new Error('Shards need to be in the format of [shardStart, shardEnd]');
      }
      const [shardStart, shardEnd] = options.shards;
      this.shardEnd = shardEnd;
      this.shardStart = shardStart;
    }

    Object.assign(this.shardOptions, options);
    this.shardOptions.isBot = true;
    this.shardOptions.rest = Object.assign({}, this.shardOptions.rest);
    this.shardOptions.rest.authType = RestConstants.AuthTypes.BOT;

    this.rest = new DetritusRestClient(token, this.shardOptions.rest);
    this.shardOptions.rest.globalBucket = this.rest.globalBucket;

    this.shardOptions.pass = Object.assign({}, this.shardOptions.pass, {cluster: this});

    Object.defineProperties(this, {
      ran: {configurable: true, writable: false},
      rest: {enumerable: false, writable: false},
      shardCount: {writable: false},
      shardEnd: {configurable: true, writable: false},
      shardStart: {configurable: true, writable: false},
      shards: {writable: false},
      shardOptions: {enumerable: false, writable: false},
      token: {enumerable: false, writable: false},
    });
  }

  setShardCount(value: number): void {
    Object.defineProperty(this, 'shardCount', {value});
  }

  setShardEnd(value: number): void {
    Object.defineProperty(this, 'shardEnd', {value});
  }

  setShardStart(value: number): void {
    Object.defineProperty(this, 'shardStart', {value});
  }

  kill(): void {
    if (this.ran) {
      for (let [shardId, shard] of this.shards) {
        shard.kill();
      }
      this.shards.clear();
      Object.defineProperty(this, 'ran', {value: false});
      this.emit('killed');
      this.clearListeners();
    }
  }

  hookedEmit(shard: ShardClient, name: string, event: any): boolean {
    if (this.hasEventListener(name)) {
      const clusterEvent = Object.assign({}, event, {shard});
      this.emit(name, clusterEvent);
    }
    return super.emit.call(shard, name, event);
  }

  async run(
    options: ClusterClientRunOptions = {},
  ): Promise<ClusterClient> {
    if (this.ran) {
      return this;
    }
    options = Object.assign({}, options);

    let delay: number;
    if (options.delay === undefined) {
      delay = 5000;
    } else {
      delay = options.delay;
    }

    let shardCount: number = options.shardCount || this.shardCount || 0;
    if (options.url === undefined || !shardCount) {
      const data = await this.rest.fetchGatewayBot();
      shardCount = shardCount || data.shards;
      options.url = options.url || data.url;
    }
    if (!shardCount) {
      throw new Error('Shard Count cannot be 0, pass in one via the options or the constructor.');
    }
    this.setShardCount(shardCount);
    if (this.shardEnd === -1) {
      this.setShardEnd(shardCount - 1);
    }

    const promises = [];
    for (let shardId = this.shardStart; shardId <= this.shardEnd; shardId++) {
      const shardOptions = Object.assign({}, this.shardOptions);
      shardOptions.gateway = Object.assign({}, shardOptions.gateway, {shardCount, shardId});

      const shard = new ShardClient(this.token, shardOptions);
      Object.defineProperties(shard, {
        emit: {value: this.hookedEmit.bind(this, shard)},
      });
      this.shards.set(shardId, shard);

      const promise = new Promise((resolve, reject) => {
        const runDelay = delay * (shardId - this.shardStart);
        setTimeout(async () => {
          try {
            resolve(await shard.run(options));
          } catch(error) {
            reject(error);
          }
        }, runDelay);
      });
      promises.push(promise);
    }
    await Promise.all(promises);
    Object.defineProperty(this, 'ran', {value: true});
    return this;
  }
}
