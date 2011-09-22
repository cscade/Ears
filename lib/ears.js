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
				// Customizable response messages
				ok: 'ok',
				nok: 'NOT ok. Make sure to POST content-type: application/json with a "directive" and a "message".'
			},
			verbose: true
		};
		options = options || {};
		this.options.port = options.port || this.options.port;
		this.options.messages = options.messages || this.options.messages;
		this.options.verbose = options.verbose !== undefined ? options.verbose : this.options.verbose;
		this.stdout = this.options.verbose ? console.log : function () {};
		this.setMetaData();
		this.createServer(this.options.port);
	};
	util.inherits(Ears, EventEmitter);

/*
	***** PUBLIC
*/

	Ears.prototype.setMetaData = function (metadata) {
		// Store metadata about the application. Provide an object literal.
		// This will be returned on directive:autodetect requests
		this.metadata = metadata || {};
		this.metadata._ears = {
			listeningOn: this.options.port
		};
	};
	
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
			res.writeHead(405, {'Content-Type': 'application/json'}); // Method Not Allowed
			res.end(JSON.stringify({ ok: false, message: this.options.messages.nok }));
			return;
		}
		if (req.headers['content-type'] !== 'application/json') {
			res.writeHead(400, {'Content-Type': 'application/json'}); // Bad Request
			res.end(JSON.stringify({ ok: false, message: this.options.messages.nok }));
			return;
		}
		req.setEncoding('utf8');
		req.on('data', function (chunk) {
			data += chunk;
		});
		req.on('end', function () {
			that.decode(data, function (response, message) {
				res.writeHead(response, {'Content-Type': 'application/json'});
				if (response < 400) {
					res.end(JSON.stringify({ ok: true, message: (message || that.options.messages.ok) }));
				} else {
					res.end(JSON.stringify({ ok: false, message: that.options.messages.nok }));
				}
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
			// At this point, the data object should contain a 'directive' and an optional 'message'
			if (data.directive) {
				if (data.directive === 'autodetect') {
					// An autodetect request is looking for information about this application
					next(200, this.metadata); // OK
				} else if (data.message) {
					// emit 'directive' with content 'message' to application
					this.emit(data.directive, data.message);
					next(200); // OK
				} else {
					next(400); // Bad Request
				}
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