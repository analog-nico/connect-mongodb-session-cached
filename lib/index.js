'use strict';

var mongoDBStoreFactory = require('connect-mongodb-session');


module.exports = function(connect) {

    var MongoDBStore = mongoDBStoreFactory(connect);

    var MongoDBStoreCached = function (options, callback) {

        MongoDBStore.apply(this, arguments);

    };

    MongoDBStoreCached.prototype = Object.create(MongoDBStore.prototype);

    MongoDBStoreCached.prototype.get = function(id, callback) {

        return MongoDBStore.prototype.get.apply(this, arguments);

    };

    MongoDBStoreCached.prototype.destroy = function(id, callback) {

        return MongoDBStore.prototype.destroy.apply(this, arguments);

    };

    MongoDBStoreCached.prototype.set = function(id, session, callback) {

        return MongoDBStore.prototype.set.apply(this, arguments);

    };

    return MongoDBStoreCached;

};
