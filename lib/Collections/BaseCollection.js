const BaseStructure = require('../Structures/BaseStructure.js');

class BaseCollection extends Map
{
    constructor(iterable=[])
    {
        super(iterable);
    }

    get _size()
    {
        return super.size;
    }

    _get(key)
    {
        return super.get(key);
    }

    _has(key)
    {
        return super.has(key);
    }

    _set(key, value)
    {
        const old = this.get(key);
        let _new = value;
        if (old && old instanceof BaseStructure) {
            _new = old.merge(_new);
        }
        this.set(key, _new);
    }
}

module.exports = BaseCollection;