// 
//  test.js
//  Ears
//  
//  Created by Carson Christian on 2012-08-23.
//  Copyright 2012 Carson Christian. All rights reserved.
// 


var Ears = require('../'),
	assert = require('assert'),
	http = require('http');

describe('Ears', function () {
	var ears = new Ears({ port: 3000 });
	
	describe('core methods and initialization', function () {
		it('should be an instance of Ears', function () {
			var ear = new Ears();
			
			assert.ok(ear instanceof Ears);
		});
		it ('should have the correct default options', function () {
			var ear = new Ears();
			
			assert.equal(ear.options.verbose, true);
			assert.strictEqual(ear.stdout, console.log);
			assert.equal(ear.options.port, null);
			assert.equal(ear.options.messages.ok, 'ok');
			assert.equal(ear.options.messages.nok, 'NOT ok. Make sure to POST content-type: application/json with a "directive" and a "message".');
		});
		it('should have the expected methods', function () {
			var ear = new Ears();
			
			assert.equal(typeof ear.listen, 'function');
			assert.equal(typeof ear.muffs, 'function');
		});
		it('should support custom options', function () {
			var ear = new Ears({
				port: 300,
				messages: {
					ok: 'ok',
					nok: 'nok'
				},
				verbose: false
			});
		
			assert.equal(ear.options.verbose, false);
			assert.notEqual(ear.stdout, console.log);
			assert.equal(ear.options.port, 300);
			assert.equal(ear.options.messages.ok, 'ok');
			assert.equal(ear.options.messages.nok, 'nok');
		});
	});
	
	describe('#listen()', function () {
		it('should listen on port 3000', function (done) {
			ears.listen(function () {
				var req = http.request({
					host: 'localhost',
					port: 3000,
					path: '/',
					method: 'GET'
				}, function (res) {
					res.on('end', function () {
						assert.equal(res.statusCode, 405/* Method Not Allowed */);
						done();
					});
				});
				req.on('error', function(e) { throw e; });
				req.end();
			});
		});
	});
	
	describe('operation', function () {
		describe('status codes', function () {
			it('should respond to a properly formed request with appropriate properties with -> 200 OK', function (done) {
				var req = http.request({
					host: 'localhost',
					port: 3000,
					path: '/',
					method: 'POST',
					headers: {
						'content-type': 'application/json'
					}
				}, function (res) {
					res.on('end', function () {
						assert.equal(res.statusCode, 200);
						done();
					});
				});
				req.on('error', function(e) { throw e; });
				req.write(JSON.stringify({
					directive: '200ok',
					message: 'Test Message!'
				}));
				req.end();
			});
			it('should respond to a GET request with -> 405 Method Not Allowed', function (done) {
				var req = http.request({
					host: 'localhost',
					port: 3000,
					path: '/',
					method: 'GET'
				}, function (res) {
					res.on('end', function () {
						assert.equal(res.statusCode, 405);
						done();
					});
				});
				req.on('error', function(e) { throw e; });
				req.end();
			});
			it('should respond to a POST request without application/json content type with -> 400 Bad Request', function (done) {
				var req = http.request({
					host: 'localhost',
					port: 3000,
					path: '/',
					method: 'POST'
				}, function (res) {
					res.on('end', function () {
						assert.equal(res.statusCode, 400);
						done();
					});
				});
				req.on('error', function(e) { throw e; });
				req.end();
			});
			it('should respond to a POST request missing the required properties with -> 400 Bad Request', function (done) {
				var req = http.request({
					host: 'localhost',
					port: 3000,
					path: '/',
					method: 'POST',
					headers: {
						'content-type': 'application/json'
					}
				}, function (res) {
					res.on('end', function () {
						assert.equal(res.statusCode, 400);
						done();
					});
				});
				req.on('error', function(e) { throw e; });
				req.write(JSON.stringify({
					directive: '400bad'
				}));
				req.end();
			});
			it('should respond to a POST request with malformed JSON with a -> 400 Bad Request', function (done) {
				var req = http.request({
					host: 'localhost',
					port: 3000,
					path: '/',
					method: 'POST',
					headers: {
						'content-type': 'application/json'
					}
				}, function (res) {
					res.on('end', function () {
						assert.equal(res.statusCode, 400);
						done();
					});
				});
				req.on('error', function(e) { throw e; });
				req.write('{"directive":"test", "message');
				req.end();
			});
		});
		it('should emit message on directive', function (done) {
			ears.on('testMessage', function (message) {
				assert.equal(message, 'Test Message!');
				done();
			});
			var req = http.request({
				host: 'localhost',
				port: 3000,
				path: '/',
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				}
			});
			req.on('error', function(e) { throw e; });
			req.write(JSON.stringify({
				directive: 'testMessage',
				message: 'Test Message!'
			}));
			req.end();
		});
	});
	
	describe('#muffs()', function () {
		it('should stop listening', function (done) {
			ears.muffs(function () {
				var req = http.request({
					host: 'localhost',
					port: 3000,
					path: '/',
					method: 'GET'
				}, function (res) {
					res.on('end', function () {
						throw new Error('response received');
					});
				});
				req.on('error', function (e) {
					assert.equal(e.code, 'ECONNREFUSED');
					done();
				});
				req.end();
			});
		});
	});
});