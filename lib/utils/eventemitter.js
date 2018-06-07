let Emitter;
try {
    Emitter = require('eventemitter3');
} catch(e) {
    Emitter = require('events').EventEmitter;
}

class EventEmitter extends Emitter
{
    constructor()
    {
        super();
        Object.defineProperties(this, {
            _events: {enumerable: false, writable: true, value: this._events},
            _eventsCount: {enumerable: false, writable: true, value: this._eventsCount},
            _maxListeners: {enumerable: false, writable: true, value: this._maxListeners}
        });
    }
}

module.exports = EventEmitter;