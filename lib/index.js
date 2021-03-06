'use strict';

var mongoDBStoreFactory = require('connect-mongodb-session');
var TwoBucketsMemcache = require('two-buckets-memcache');


module.exports = function (connect) {

    var MongoDBStore = mongoDBStoreFactory(connect);

    var MongoDBStoreCached = function (options, callback) {

        MongoDBStore.apply(this, arguments);

        this._expireCacheAfter = options && options.expireCacheAfter ? options.expireCacheAfter : 10000;
        this._cache = new TwoBucketsMemcache(this._expireCacheAfter);

    };

    MongoDBStoreCached.prototype = Object.create(MongoDBStore.prototype);

    MongoDBStoreCached.prototype.get = function(id, callback) {

        try {

            callback(null, this._cache.get(id));

        } catch (e) {

            return MongoDBStore.prototype.get.apply(this, arguments);

        }

    };

    MongoDBStoreCached.prototype.destroy = function(id, callback) {

        this._cache.remove(id);

        return MongoDBStore.prototype.destroy.apply(this, arguments);

    };

    MongoDBStoreCached.prototype.set = function(id, session, callback) {

        this._cache.set(id, session);

        return MongoDBStore.prototype.set.apply(this, arguments);

    };

    MongoDBStoreCached.prototype.clear = function(callback) {

        this._cache.destroy();
        this._cache = new TwoBucketsMemcache(this._expireCacheAfter);

        return MongoDBStore.prototype.clear.apply(this, arguments);

    };

    return MongoDBStoreCached;

};
