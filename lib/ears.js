/*jslint devel: true, node: true, sloppy: true, nomen: true, maxerr: 50, indent: 4 */
// 
//  ears.js
//  Ears
//  
//  Created by Carson Christian on 2011-09-14.
//  Copyright 2011 Carson Christian (cc@amplego.com).
//  MIT Licensed.
// 
var util = require('util'),
	EventEmitter = require('events').EventEmitter,
	http = require('http');

(function () {
	var Ears;
	
	Ears = function (options) {
		EventEmitter.call(this);
		this.options = {
			port: 3333,
			messages: {
				// Customizable response messages (text/plain)
				ok: 'ok\n',
				nok: 'NOT ok. Make sure to POST content-type: application/json with a "directive" and a "message".\n'
			},
			verbose: true
		};
		options = options || {};
		this.options.port = options.port || this.options.port;
		this.options.messages = options.messages || this.options.messages;
		this.options.verbose = options.verbose !== undefined ? options.verbose : this.options.verbose;
		this.stdout = this.options.verbose ? console.log : function () {};
		this.createServer(this.options.port);
	};
	util.inherits(Ears, EventEmitter);

/*
	***** PUBLIC
*/

	Ears.prototype.listen = function (next) {
		// Listen
		this.startListen(this.options.port, next);
	};
	
	Ears.prototype.muffs = function () {
		// Stop listening
		this.goDeaf();
	};
	
/*
	***** PRIVATE
*/
	Ears.prototype.respond = function (req, res) {
		// Called each time an HTTP request is received
		var data = '',
			that = this;
		
		if (req.method !== 'POST') {
			res.writeHead(405, {'Content-Type': 'text/plain'}); // Method Not Allowed
			res.end(this.options.messages.nok);
			return;
		}
		if (req.headers['content-type'] !== 'application/json') {
			res.writeHead(400, {'Content-Type': 'text/plain'}); // Bad Request
			res.end(this.options.messages.nok);
			return;
		}
		req.setEncoding('utf8');
		req.on('data', function (chunk) {
			data += chunk;
		});
		req.on('end', function () {
			that.decode(data, function (response) {
				res.writeHead(response, {'Content-Type': 'text/plain'});
				res.end(that.options.messages[response < 400 ? 'ok' : 'nok']);
			});
		});
	};
	
	Ears.prototype.decode = function (data, next) {
		// Attempt to decode an incoming JSON request
		if (data) {
			try {
				data = JSON.parse(data);
			} catch (e) {
				next(500); // Internal Server Error
			}
			// At this point, the data object should contain a 'directive' and a 'message'
			if (data.directive && data.message) {
				// If so, emit 'directive' with content 'message'
				this.emit(data.directive, data.message);
				next(200); // OK
			} else {
				next(400); // Bad Request
			}
		} else {
			next(400); // Bad Request
		}
	};
	
	Ears.prototype.startListen = function (port, next) {
		// Listen
		var that = this;
		
		next = next || function () {};
		this.server.listen(port, 'localhost', function () {
			that.stdout('Ears listening on localhost:' + port);
			next();
		});
	};
	
	Ears.prototype.createServer = function (port) {
		// Create an http server
		var that = this;
		
		if (!this.server) {
			this.server = http.createServer(function () {
				that.respond.apply(that, arguments);
			});
			this.server.on('close', function () {
				that.stdout('Ears no longer listening on localhost:' + port);
			});
		}
	};
	
	Ears.prototype.goDeaf = function () {
		// Stop listening
		if (this.server) {
			this.server.close();
		}
	};
	
	// Expose
	exports = module.exports = Ears;
}());