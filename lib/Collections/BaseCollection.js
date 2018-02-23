'use strict';

const BaseStructure = require('../Structures/BaseStructure.js');

class BaseCollection extends Map
{
    constructor(iterable=[], defaultKey='id')
    {
        super();
        Object.defineProperty(this, 'defaultKey', {
            enumerable: false,
            writable: false,
            value: defaultKey
        });
        iterable.forEach((obj) => {
            this.set(obj[this.defaultKey], obj);
        });
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

    reduce(cb, initialValue=0)
    {
        return this.toArray().reduce(cb, initialValue);
    }

    toArray()
    {
        return Array.from(this.values());
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

    clone()
    {
        const clone = new BaseCollection([], this.defaultKey);
        this.forEach((data) => {
            if (data instanceof BaseStructure) {
                clone.set(data[this.defaultKey], data.clone());
            } else {
                console.log('clone', data);
            }
        });
        return clone;
    }

    toJSON()
    {
        return this.map((v) => {
            return v;
        });
    }
}

module.exports = BaseCollection;