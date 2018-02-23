'use strict';

const BaseCollection = require('../Collections/BaseCollection.js');
const Utils = require('../Utils');
const Tools = Utils.Tools;

class BaseStructure
{
    constructor(client, raw, exclude=[])
    {
        Object.defineProperties(this, {
            client: {writable: false, value: client},
            rawKeys: {writable: false, value: Object.keys(raw)},
            excludeKeys: {writable: false, value: exclude}
        });
        for (var key in raw) {
            if (this.excludeKeys.includes(key)) {continue;}

            const camelKey = Tools.toCamelCase(key);
            const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), camelKey);
            if (descriptor) {
                continue;
            }
            Object.defineProperty(this, camelKey, {
                configurable: true,
                enumerable: true,
                writable: false,
                value: raw[key]
            });
        }
    }

    merge(raw)
    {
        if (!raw) {return;}
        if (raw instanceof BaseStructure) {
            raw = JSON.parse(JSON.stringify(raw));
        }
        for (let key in raw) {
            const camelKey = Tools.toCamelCase(key);

            const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), camelKey);
            if (descriptor || Object.hasOwnProperty(camelKey)) {
                const oldValue = this[camelKey];
                if (oldValue && typeof(oldValue) === 'object' && !Array.isArray(oldValue)) {
                    if ((oldValue instanceof BaseStructure)) {
                        oldValue.merge(raw[key]);
                    } else {
                        Object.assign(oldValue, raw[key]);
                    }
                    continue;
                }
                if (descriptor && descriptor.get) {
                    continue;
                }
            }
            Object.defineProperty(this, camelKey, {
                configurable: true,
                enumerable: true,
                writable: false,
                value: raw[key]
            });
        }
    }

    clone()
    {
        return new this.constructor(this.client, JSON.parse(JSON.stringify(this)));
    }

    toJSON()
    {
        const obj = {};
        this.rawKeys.forEach((key) => {
            if (this.excludeKeys.includes(key)) {return;}
            const val = this[Utils.Tools.toCamelCase(key)];
            if (val !== undefined) {
                obj[key] = val;
            }
        });
        return obj;
    }
}

module.exports = BaseStructure;