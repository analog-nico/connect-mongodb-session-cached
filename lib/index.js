'use strict';

var mongoDBStoreFactory = require('connect-mongodb-session');
var TwoBucketsMemcache = require('two-buckets-memcache');

var cloneDeep = require('lodash.clonedeep');
var isEqual = require('lodash.isequal');


module.exports = function(connect) {

    var MongoDBStore = mongoDBStoreFactory(connect);

    var MongoDBStoreCached = function (options, callback) {

        MongoDBStore.apply(this, arguments);

        this._cache = new TwoBucketsMemcache(options && options.expireCacheAfter ? options.expireCacheAfter : 10000);

    };

    MongoDBStoreCached.prototype = Object.create(MongoDBStore.prototype);

    MongoDBStoreCached.prototype.get = function(id, callback) {

        try {

            var sessionWrap = this._cache.get(id);
            callback(null, sessionWrap.session);

        } catch (e) {

            return MongoDBStore.prototype.get.apply(this, arguments);

        }

    };

    MongoDBStoreCached.prototype.destroy = function(id, callback) {

        this._cache.remove(id);

        return MongoDBStore.prototype.destroy.apply(this, arguments);

    };

    MongoDBStoreCached.prototype.set = function(id, session, callback) {

        try {

            var sessionWrap = this._cache.get(id);
            if (isEqual(session, sessionWrap.clone)) {
                callback && callback();
                return;
            }

        } catch (e) {}

        this._cache.set(id, {
            session: session,
            clone: cloneDeep(session)
        });

        return MongoDBStore.prototype.set.apply(this, arguments);

    };

    return MongoDBStoreCached;

};
