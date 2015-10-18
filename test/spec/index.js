'use strict';

var mongoDBStoreCachedFactory = require('../../lib/index.js');

var express = require('express');
var session = require('express-session');
var MongoDBStoreCached = mongoDBStoreCachedFactory(session);
var request = require('request');

var sinon = require('sinon');


describe('MongoDBStoreCached', function () {

    var server, store,
        getMethod, destroyMethod, setMethod,
        cacheGetMethod, cacheRemoveMethod, cacheSetMethod;

    describe('with default options', function () {

        before(function (done) {

            store = new MongoDBStoreCached({
                collection: 'connect-mongodb-session-cached'
            });

            getMethod = sinon.spy(store, 'get');
            destroyMethod = sinon.spy(store, 'destroy');
            setMethod = sinon.spy(store, 'set');

            cacheGetMethod = sinon.spy(store._cache, 'get');
            cacheRemoveMethod = sinon.spy(store._cache, 'remove');
            cacheSetMethod = sinon.spy(store._cache, 'set');


            request = request.defaults({ jar: request.jar() });


            var app = express();

            app.use(session({
                store: store,
                secret: 'sssh!',
                saveUninitialized: true,
                resave: true,
                unset: 'destroy'
            }));

            app.get('/destroy', function (req, res) {
                delete req.session;
                res.send('Destroyed!');
            });

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

                expect(cacheGetMethod.callCount).to.eql(0);
                expect(cacheRemoveMethod.callCount).to.eql(0);
                expect(cacheSetMethod.callCount).to.eql(2);

                done();

            });

        });

        it('should get the session from cache', function (done) {

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                expect(getMethod.callCount).to.eql(1);
                expect(destroyMethod.callCount).to.eql(0);
                expect(setMethod.callCount).to.eql(3);

                expect(cacheGetMethod.callCount).to.eql(1);
                expect(cacheRemoveMethod.callCount).to.eql(0);
                expect(cacheSetMethod.callCount).to.eql(3);

                done();

            });

        });

        it('should get the session from db if cache empty', function (done) {

            store._cache.remove(cacheSetMethod.lastCall.args[0]);

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                expect(getMethod.callCount).to.eql(2);
                expect(destroyMethod.callCount).to.eql(0);
                expect(setMethod.callCount).to.eql(4);

                expect(cacheGetMethod.callCount).to.eql(2);
                expect(cacheRemoveMethod.callCount).to.eql(1);
                expect(cacheSetMethod.callCount).to.eql(4);

                expect(cacheGetMethod.threw('Error')).to.eql(true);

                done();

            });

        });

        it('should destroy the session entry', function (done) {

            request('http://localhost:3030/destroy', function (err, response, body) {

                expect(body).to.eql('Destroyed!');

                expect(getMethod.callCount).to.eql(3);
                expect(destroyMethod.callCount).to.eql(1);
                expect(setMethod.callCount).to.eql(4);

                expect(cacheGetMethod.callCount).to.eql(3);
                expect(cacheRemoveMethod.callCount).to.eql(2);
                expect(cacheSetMethod.callCount).to.eql(4);

                done();

            });

        });

    });

    describe('with option for short cache expiry', function () {

        before(function (done) {

            store = new MongoDBStoreCached({
                collection: 'connect-mongodb-session-cached',
                expireCacheAfter: 10
            });

            getMethod = sinon.spy(store, 'get');
            destroyMethod = sinon.spy(store, 'destroy');
            setMethod = sinon.spy(store, 'set');

            cacheGetMethod = sinon.spy(store._cache, 'get');
            cacheRemoveMethod = sinon.spy(store._cache, 'remove');
            cacheSetMethod = sinon.spy(store._cache, 'set');


            request = request.defaults({ jar: request.jar() });


            var app = express();

            app.use(session({
                store: store,
                secret: 'sssh!',
                saveUninitialized: true,
                resave: true,
                unset: 'destroy'
            }));

            app.get('/destroy', function (req, res) {
                delete req.session;
                res.send('Destroyed!');
            });

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

        it('should load the session from db after cache expired', function (done) {

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                expect(getMethod.callCount).to.eql(0);
                expect(destroyMethod.callCount).to.eql(0);
                expect(setMethod.callCount).to.eql(2);

                expect(cacheGetMethod.callCount).to.eql(0);
                expect(cacheRemoveMethod.callCount).to.eql(0);
                expect(cacheSetMethod.callCount).to.eql(2);

                setTimeout(function () {

                    request('http://localhost:3030', function (err, response, body) {

                        expect(body).to.eql('Hello World!');

                        expect(getMethod.callCount).to.eql(1);
                        expect(destroyMethod.callCount).to.eql(0);
                        expect(setMethod.callCount).to.eql(3);

                        expect(cacheGetMethod.callCount).to.eql(1);
                        expect(cacheRemoveMethod.callCount).to.eql(0);
                        expect(cacheSetMethod.callCount).to.eql(3);

                        expect(cacheGetMethod.threw('Error')).to.eql(true);

                        done();

                    });

                }, 20);

            });

        });

    });

});
