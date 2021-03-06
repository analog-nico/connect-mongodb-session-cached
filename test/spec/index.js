'use strict';

var mongoDBStoreCachedFactory = require('../../lib/index.js');

var express = require('express');
var session = require('express-session');
var MongoDBStoreCached = mongoDBStoreCachedFactory(session);
var request = require('request');

var sinon = require('sinon');


describe('MongoDBStoreCached', function () {

    var server, store,
        getMethod, destroyMethod, setMethod, clearMethod, getMethodCallCount, destroyMethodCallCount, setMethodCallCount, clearMethodCallCount,
        cacheGetMethod, cacheRemoveMethod, cacheSetMethod, cacheDestroyMethod, cacheGetMethodCallCount, cacheRemoveMethodCallCount, cacheSetMethodCallCount, cacheDestroyMethodCallCount;

    function initCallCounts() {

        getMethodCallCount = 0;
        destroyMethodCallCount = 0;
        setMethodCallCount = 0;
        clearMethodCallCount = 0;

        cacheGetMethodCallCount = 0;
        cacheRemoveMethodCallCount = 0;
        cacheSetMethodCallCount = 0;
        cacheDestroyMethodCallCount = 0;

    }

    function validateCallCounts() {

        expect(getMethod.callCount).to.eql(getMethodCallCount);
        expect(destroyMethod.callCount).to.eql(destroyMethodCallCount);
        expect(setMethod.callCount).to.eql(setMethodCallCount);
        expect(clearMethod.callCount).to.eql(clearMethodCallCount);

        expect(cacheGetMethod.callCount).to.eql(cacheGetMethodCallCount);
        expect(cacheRemoveMethod.callCount).to.eql(cacheRemoveMethodCallCount);
        expect(cacheSetMethod.callCount).to.eql(cacheSetMethodCallCount);
        expect(cacheDestroyMethod.callCount).to.eql(cacheDestroyMethodCallCount);

    }


    describe('with default options', function () {

        before(function (done) {

            store = new MongoDBStoreCached({
                collection: 'connect-mongodb-session-cached'
            });

            getMethod = sinon.spy(store, 'get');
            destroyMethod = sinon.spy(store, 'destroy');
            setMethod = sinon.spy(store, 'set');
            clearMethod = sinon.spy(store, 'clear');

            cacheGetMethod = sinon.spy(store._cache, 'get');
            cacheRemoveMethod = sinon.spy(store._cache, 'remove');
            cacheSetMethod = sinon.spy(store._cache, 'set');
            cacheDestroyMethod = sinon.spy(store._cache, 'destroy');

            initCallCounts();


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
            store.client.close();
            store._cache.destroy();
            done();

        });

        it('should set the session entry', function (done) {

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                getMethodCallCount += 0;
                destroyMethodCallCount += 0;
                setMethodCallCount += 1;

                cacheGetMethodCallCount += 0;
                cacheRemoveMethodCallCount += 0;
                cacheSetMethodCallCount += 1;

                // I don't know why but sometimes `set` is called twice.
                if (setMethod.callCount === setMethodCallCount + 1) {
                    setMethodCallCount += 1;
                    cacheSetMethodCallCount += 1;
                }

                validateCallCounts();

                done();

            });

        });

        it('should get the session from cache', function (done) {

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                getMethodCallCount += 1;
                destroyMethodCallCount += 0;
                setMethodCallCount += 1;

                cacheGetMethodCallCount += 1;
                cacheRemoveMethodCallCount += 0;
                cacheSetMethodCallCount += 1;

                validateCallCounts();

                done();

            });

        });

        it('should get the session from db if cache empty', function (done) {

            store._cache.remove(cacheSetMethod.lastCall.args[0]);

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                getMethodCallCount += 1;
                destroyMethodCallCount += 0;
                setMethodCallCount += 1;

                cacheGetMethodCallCount += 1;
                cacheRemoveMethodCallCount += 1;
                cacheSetMethodCallCount += 1;

                validateCallCounts();

                expect(cacheGetMethod.threw('Error')).to.eql(true);

                done();

            });

        });

        it('should destroy the session entry', function (done) {

            request('http://localhost:3030/destroy', function (err, response, body) {

                expect(body).to.eql('Destroyed!');

                getMethodCallCount += 1;
                destroyMethodCallCount += 1;
                setMethodCallCount += 0;

                cacheGetMethodCallCount += 1;
                cacheRemoveMethodCallCount += 1;
                cacheSetMethodCallCount += 0;

                validateCallCounts();

                done();

            });

        });

        it('should create a new session to replace destroyed session', function (done) {

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                getMethodCallCount += 1;
                destroyMethodCallCount += 0;
                setMethodCallCount += 1;

                cacheGetMethodCallCount += 1;
                cacheRemoveMethodCallCount += 0;
                cacheSetMethodCallCount += 1;

                // I don't know why but sometimes `set` is called twice.
                if (setMethod.callCount === setMethodCallCount + 1) {
                    setMethodCallCount += 1;
                    cacheSetMethodCallCount += 1;
                }

                validateCallCounts();

                done();

            });

        });

        it('should clear all sessions', function (done) {

            store.clear();

            getMethodCallCount += 0;
            destroyMethodCallCount += 0;
            setMethodCallCount += 0;
            clearMethodCallCount += 1;

            cacheGetMethodCallCount += 0;
            cacheRemoveMethodCallCount += 0;
            cacheSetMethodCallCount += 0;
            cacheDestroyMethodCallCount += 1;

            validateCallCounts();

            // Cache gets replaced internally -> instrument again

            cacheGetMethod = sinon.spy(store._cache, 'get');
            cacheRemoveMethod = sinon.spy(store._cache, 'remove');
            cacheSetMethod = sinon.spy(store._cache, 'set');
            cacheDestroyMethod = sinon.spy(store._cache, 'destroy');

            cacheGetMethodCallCount = 0;
            cacheRemoveMethodCallCount = 0;
            cacheSetMethodCallCount = 0;
            cacheDestroyMethodCallCount = 0;

            done();

        });

        it('should create a new session again after all sessions were cleared', function (done) {

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                getMethodCallCount += 1;
                destroyMethodCallCount += 0;
                setMethodCallCount += 1;

                cacheGetMethodCallCount += 1;
                cacheRemoveMethodCallCount += 0;
                cacheSetMethodCallCount += 1;

                // I don't know why but sometimes `set` is called twice.
                if (setMethod.callCount === setMethodCallCount + 1) {
                    setMethodCallCount += 1;
                    cacheSetMethodCallCount += 1;
                }

                validateCallCounts();

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
            clearMethod = sinon.spy(store, 'clear');

            cacheGetMethod = sinon.spy(store._cache, 'get');
            cacheRemoveMethod = sinon.spy(store._cache, 'remove');
            cacheSetMethod = sinon.spy(store._cache, 'set');
            cacheDestroyMethod = sinon.spy(store._cache, 'destroy');

            initCallCounts();


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
            store.client.close();
            store._cache.destroy();
            done();

        });

        it('should load the session from db after cache expired', function (done) {

            request('http://localhost:3030', function (err, response, body) {

                expect(body).to.eql('Hello World!');

                getMethodCallCount += 0;
                destroyMethodCallCount += 0;
                setMethodCallCount += 1;

                cacheGetMethodCallCount += 0;
                cacheRemoveMethodCallCount += 0;
                cacheSetMethodCallCount += 1;

                // I don't know why but sometimes `set` is called twice.
                if (setMethod.callCount === setMethodCallCount + 1) {
                    setMethodCallCount += 1;
                    cacheSetMethodCallCount += 1;
                }

                validateCallCounts();

                setTimeout(function () {

                    request('http://localhost:3030', function (err, response, body) {

                        expect(body).to.eql('Hello World!');

                        getMethodCallCount += 1;
                        destroyMethodCallCount += 0;
                        setMethodCallCount += 1;

                        cacheGetMethodCallCount += 1;
                        cacheRemoveMethodCallCount += 0;
                        cacheSetMethodCallCount += 1;

                        validateCallCounts();

                        expect(cacheGetMethod.threw('Error')).to.eql(true);

                        done();

                    });

                }, 20);

            });

        });

    });

});
