const Dependencies = {
    EventEmitter: null
};

try {
    Dependencies.EventEmitter = require('eventemitter3');
} catch(e) {
    Dependencies.EventEmitter = require('events').EventEmitter;
}

class EventEmitter extends Dependencies.EventEmitter
{
    constructor()
    {
        super();
    }
}

module.exports = EventEmitter;