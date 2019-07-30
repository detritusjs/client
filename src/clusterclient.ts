import {
  Client as DetritusRestClient,
  Constants as RestConstants,
} from 'detritus-client-rest';

import {
  ShardClient,
  ShardClientOptions,
  ShardClientRunOptions,
} from './client';
import { ClusterProcessChild } from './cluster/processchild';
import { BaseCollection } from './collections/basecollection';
import EventEmitter from './eventemitter';
import { sleep } from './utils';


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

  manager: ClusterProcessChild | null = null;
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
    options = Object.assign({}, options);

    if (process.env.CLUSTER_MANAGER === 'true') {
      token = <string> process.env.CLUSTER_TOKEN;
      options.shardCount = +(<string> process.env.CLUSTER_SHARD_COUNT);
      options.shards = [
        +(<string> process.env.CLUSTER_SHARD_START),
        +(<string> process.env.CLUSTER_SHARD_END),
      ];
    }

    if (!token) {
      throw new Error('Token is required for this library to work.');
    }
    this.token = token;

    this.shardCount = +(options.shardCount || this.shardCount);
    if (Array.isArray(options.shards)) {
      if (options.shards.length !== 2) {
        throw new Error('Shards need to be in the format of [shardStart, shardEnd]');
      }
      const [shardStart, shardEnd] = options.shards;
      this.shardEnd = +shardEnd;
      this.shardStart = +shardStart;
    }

    Object.assign(this.shardOptions, options);
    this.shardOptions.isBot = true;
    this.shardOptions.rest = Object.assign({}, this.shardOptions.rest);
    this.shardOptions.rest.authType = RestConstants.AuthTypes.BOT;

    this.rest = new DetritusRestClient(token, this.shardOptions.rest);
    this.shardOptions.rest.globalBucket = this.rest.globalBucket;

    this.shardOptions.pass = Object.assign({}, this.shardOptions.pass, {cluster: this});

    if (process.env.CLUSTER_MANAGER === 'true') {
      this.manager = new ClusterProcessChild(this);
    }

    Object.defineProperties(this, {
      manager: {configurable: false, writable: false},
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

  /** @hidden */
  _eval(code: string): any {
    return eval(code);
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

  hookedHasEventListener(shard: ShardClient, name: string): boolean {
    return super.hasEventListener(name) || super.hasEventListener.call(shard, name);
  }

  hookedEmit(shard: ShardClient, name: string, event: any): boolean {
    if (name !== 'ready') {
      if (this.hasEventListener(name)) {
        const clusterEvent = Object.assign({}, event, {shard});
        this.emit(name, clusterEvent);
      }
    }
    return super.emit.call(shard, name, event);
  }

  async run(
    options: ClusterClientRunOptions = {},
  ): Promise<ClusterClient> {
    if (this.ran) {
      return this;
    }
    options = Object.assign({
      url: process.env.GATEWAY_URL,
    }, options);

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

    for (let shardId = this.shardStart; shardId <= this.shardEnd; shardId++) {
      const shardOptions = Object.assign({}, this.shardOptions);
      shardOptions.gateway = Object.assign({}, shardOptions.gateway, {shardCount, shardId});

      const shard = new ShardClient(this.token, shardOptions);
      Object.defineProperties(shard, {
        hasEventListener: {value: this.hookedHasEventListener.bind(this, shard)},
        emit: {value: this.hookedEmit.bind(this, shard)},
      });
      this.shards.set(shardId, shard);
      await shard.run(options);
      if (shardId < this.shardEnd) {
        await sleep(delay);
      }
    }
    Object.defineProperty(this, 'ran', {value: true});
    this.emit('ready');
    return this;
  }
}
