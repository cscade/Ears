// 
//  ears.test.js
//  Ears
//  
//  Created by Carson Christian on 2011-09-14.
//  Copyright 2011 Carson Christian (cc@amplego.com).
//  MIT Licensed.
// 

var Ears = require('../'),
	assert = require('assert'),
	http = require('http');

module.exports = {
	'initialize': function () {
		var ears = new Ears();
		
		assert.ok(ears instanceof Ears);
	},
	'default options': function () {
		var ears = new Ears();
		
		assert.equal(ears.options.verbose, true);
		assert.strictEqual(ears.stdout, console.log);
		assert.equal(ears.options.port, 3333);
		assert.equal(ears.options.messages.ok, 'ok');
		assert.equal(ears.options.messages.nok, 'NOT ok. Make sure to POST content-type: application/json with a "directive" and a "message".');
	},
	'custom options': function () {
		var ears = new Ears({
			port: 300,
			messages: {
				ok: 'ok',
				nok: 'nok'
			},
			verbose: false
		});
		
		assert.equal(ears.options.verbose, false);
		assert.notEqual(ears.stdout, console.log);
		assert.equal(ears.options.port, 300);
		assert.equal(ears.options.messages.ok, 'ok');
		assert.equal(ears.options.messages.nok, 'nok');
	},
	'expected methods': function () {
		var ears = new Ears();
		
		assert.equal(typeof ears.listen, 'function');
		assert.equal(typeof ears.muffs, 'function');
	},
	'listen and reject GET': function () {
		var ears = new Ears({ port: 3334, verbose: false });
		
		assert.response(ears.server, {
			url: '/',
			method: 'GET'
		}, function (res) {
			assert.equal(res.statusCode, 405);
		});
	},
	'muffs': function () {
		var ears = new Ears({ port: 3335, verbose: false });
		
		ears.listen(function () {
			ears.muffs();
			http.get({
				host: 'localhost',
				port: 3335,
				path: '/'
			}, function () {}).on('error', function (e) {
				assert.equal(e.code, 'ECONNREFUSED');
			});
		});	
	},
	'message passing': function () {
		var ears = new Ears({ port: 3336, verbose: false }),
			req;
		
		ears.on('testMessage', function (message) {
			assert.equal(message, 'Test Message!');
		});
		ears.listen(function () {
			req = http.request({
				host: 'localhost',
				port: 3336,
				path: '/',
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				}
			}, function (res) {
				res.on('end', function () {
					assert.equal(res.statusCode, 200);
					ears.muffs();
				});
			});
			req.write(JSON.stringify({
				directive: 'testMessage',
				message: 'Test Message!'
			}));
			req.end();
		});	
	},
	'incomplete json handling': function () {
		var ears = new Ears({ port: 3337, verbose: false }),
			req;
		
		ears.listen(function () {
			req = http.request({
				host: 'localhost',
				port: 3337,
				path: '/',
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				}
			}, function (res) {
				res.on('end', function () {
					assert.equal(res.statusCode, 400);
					ears.muffs();
				});
			});
			req.write('{ "directive": "doSomething" }');
			req.end();
		});
	},
	'bad json handling': function () {
		var ears = new Ears({ port: 3338, verbose: false }),
			req;
		
		ears.listen(function () {
			req = http.request({
				host: 'localhost',
				port: 3338,
				path: '/',
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				}
			}, function (res) {
				res.on('end', function () {
					assert.equal(res.statusCode, 500);
					ears.muffs();
				});
			});
			req.write('{ bad: "json" }');
			req.end();
		});
	}
};