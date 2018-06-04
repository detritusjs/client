let emitter;
try {
    emitter = require('eventemitter3');
} catch(e) {
    emitter = require('events').EventEmitter;
}

module.exports = emitter;