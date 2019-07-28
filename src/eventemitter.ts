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

  constructor() {
    super();
    Object.defineProperties(this, {
      _events: {enumerable: false},
      _eventsCount: {enumerable: false},
      _maxListeners: {enumerable: false},
    });
  }

  hasEventListener(name: string): boolean {
    return this._events && (name in this._events);
  }
}
