const BaseStructure = require('../Structures/BaseStructure.js');

class BaseCollection extends Map
{
    constructor(iterable=[], defaultKey='id')
    {
        super(iterable);
        this.defaultKey = defaultKey;
    }

    get _size()
    {
        return super.size;
    }

    first()
    {
        return this.values().next().value;
    }

    _delete(key)
    {
        return super.delete(key);
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
        if (old && old instanceof BaseStructure) {
            old.merge(value);
        } else {
            this.set(key, value);
        }
    }

    filter(key, value)
    {
        const func = (typeof(key) === 'function') ? key : (v) => {
            return v[key] === value;
        };

        const map = [];
        for (let value of this.values()) {
            if (func(value)) {
                map.push(value);
            }
        }
        return map;
    }

    map(func)
    {
        const map = [];
        for (let value of this.values()) {
            map.push(func(value));
        }
        return map;
    }

    toArray()
    {
        const array = [];
        for (let value of this.values()) {
            array.push(value);
        }
        return array;
    }

    merge(raw)
    {
        if (raw instanceof BaseCollection) {
            raw = JSON.parse(JSON.stringify(raw));
        }
        if (Array.isArray(raw)) {
            raw.forEach((data) => {
                const key = data[this.defaultKey];
                if (!key) {return;}

                if (this.has(key)) {
                    const old = this.get(key);
                    if (old instanceof BaseStructure) {
                        old.merge(data);
                    }
                } else {
                    this.set(key, data);
                }
            });
        }
    }

    toJSON()
    {
        return this.map((v) => {
            return v;
        });
    }
}

module.exports = BaseCollection;