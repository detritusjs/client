const BaseCollection = require('../Collections/BaseCollection.js');
const Utils = require('../Utils');
const Tools = Utils.Tools;

class BaseStructure
{
    constructor(client, raw, exclude=[])
    {
        Object.defineProperties(this, {
            _client: {enumberable: false, writable: false, value: client},
            rawKeys: {enumberable: false, writable: false, value: Object.keys(raw)}
        });
        for (var key in raw) {
            if (exclude.includes(key)) {continue;}
            const camelKey = Tools.toCamelCase(key);

            const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), camelKey);
            if (descriptor) {
                continue;
            }
            Object.defineProperty(this, camelKey, {
                value: raw[key],
                writable: false,
                configurable: true
            });
        }
        exclude = null;
        raw = null;
    }

    merge(raw)
    {
        if (!raw) {
            return this;
        }
        if (raw instanceof BaseStructure) {
            raw = JSON.parse(JSON.stringify(raw));
        }
        for (let key in raw) {
            const camelKey = Tools.toCamelCase(key);

            const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), camelKey);
            if (descriptor || Object.hasOwnProperty(camelKey)) {
                const oldValue = this[camelKey],
                    newValue = raw[key];
                if (oldValue && typeof(oldValue) === 'object' && !Array.isArray(oldValue)) {
                    if ((oldValue instanceof BaseStructure)) {
                        oldValue.merge(newValue);
                    } else {
                        Object.assign(oldValue, newValue);
                    }
                } else {
                    if (descriptor && descriptor.get) {
                        continue;
                    }
                    Object.defineProperty(this, camelKey, {
                        value: newValue
                    });
                }
            } else {
                Object.defineProperty(this, camelKey, {
                    value: raw[key],
                    writable: false,
                    configurable: true
                });
            }
        }
    }

    clone()
    {
        return new this.constructor(this._client, JSON.parse(JSON.stringify(this)));
    }

    toJSON()
    {
        const obj = {};
        this.rawKeys.forEach((key) => {
            const val = this[Utils.Tools.toCamelCase(key)];
            if (val !== undefined) {
                obj[key] = val;
            }
        });
        return obj;
    }
}

module.exports = BaseStructure;