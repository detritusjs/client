var _EventEmitter;
try {
    _EventEmitter = require('eventemitter3');
} catch(e) {
    _EventEmitter = require('events').EventEmitter;
}

class EventEmitter extends _EventEmitter
{
    constructor(validEvents=[])
    {
        super();
        
        this.validEvents = validEvents;
    }
}

module.exports = EventEmitter;