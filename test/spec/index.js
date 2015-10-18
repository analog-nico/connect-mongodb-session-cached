'use strict';

var mongoDBStoreCachedFactory = require('../../lib/index.js');

var express = require('express');
var session = require('express-session');
var MongoDBStoreCached = mongoDBStoreCachedFactory(session);
var request = require('request');

var sinon = require('sinon');


describe('MongoDBStoreCached', function () {

    var server, store, getMethod, destroyMethod, setMethod;

    before(function (done) {

        store = new MongoDBStoreCached({
            collection: 'connect-mongodb-session-cached'
        });

        getMethod = sinon.spy(store, 'get');
        destroyMethod = sinon.spy(store, 'destroy');
        setMethod = sinon.spy(store, 'set');


        var app = express();

        app.use(session({
            store: store,
            secret: 'sssh!',
            saveUninitialized: true,
            resave: true
        }));

        app.get('*', function (req, res) {
            res.send('Hello World!');
        });

        server = app.listen(3030, function () {
            done();
        });

    });

    after(function (done) {

        server.close();
        store.db.close();
        store._cache.destroy();
        done();

    });

    it('should set the session entry', function (done) {

        request('http://localhost:3030', function (err, response, body) {

            expect(body).to.eql('Hello World!');

            expect(getMethod.callCount).to.eql(0);
            expect(destroyMethod.callCount).to.eql(0);
            expect(setMethod.callCount).to.eql(2);

            done();

        });

    });

    it('should get the session from cache');

    it('should get the session from db if cache empty');

    it('should destroy the session entry');

});
