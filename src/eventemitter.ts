let Emitter = require('events').EventEmitter;

try {
  Emitter = require('eventemitter3');
} catch(e) {}


export default class EventEmitter extends Emitter {
  /**
   * @ignore
   */
  _events: any;

  /**
   * @ignore
   */
  _eventsCount!: number;

  /**
   * @ignore
   */
  _maxListeners!: any;

  addListener!: (name: string | symbol, listener: Function) => void;
  emit!: (name: string, ...args: any[]) => boolean;
  eventNames!: () => Array<string>;
  getMaxListeners!: () => number;
  listenerCount!: (name: string | symbol) => number;
  listeners!: (name: string | symbol) => Array<Function>;
  off!: (name: string, listener: Function) => EventEmitter;
  on!: (name: string, listener: Function) => EventEmitter;
  once!: (name: string, listener: Function) => EventEmitter;
  prependListener!: (name: string, listener: Function) => EventEmitter;
  prependOnceListener!: (name: string, listener: Function) => EventEmitter;
  removeAllListeners!: (name?: string | symbol) => EventEmitter;
  removeListener!: (name: string | symbol, listener: Function) => EventEmitter;
  setMaxListeners!: (n: number) => EventEmitter;
  rawListeners!: (name: string | symbol) => Array<Function>;

  constructor() {
    super();
    Object.defineProperties(this, {
      _events: {enumerable: false},
      _eventsCount: {enumerable: false},
      _maxListeners: {enumerable: false},
    });
  }

  hasEventListener(name: string): boolean {
    return (name in this._events);
  }
}
