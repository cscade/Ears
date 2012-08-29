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
	http = require('http'),
	portfinder = require('portfinder');

(function () {
	var Ears;

	Ears = function (options) {
		EventEmitter.call(this);
		this.options = {
			messages: {
				// Customizable response messages
				ok: 'ok',
				nok: 'NOT ok. Make sure to POST content-type: application/json with a "directive" and a "message".'
			},
			verbose: true
		};
		options = options || {};
		this.options.port = options.port || null;
		this.options.messages = options.messages || this.options.messages;
		this.options.verbose = options.verbose !== undefined ? options.verbose : this.options.verbose;
		// verbose options
		if (this.options.verbose) {
			if (options.winston) {
				// log with winston if available
				this.stdout = function (message) {
					try {
						options.winston.logger.log(options.winston.level, message);
					} catch (e) {}
				};
			} else {
				// log to stdout
				this.stdout = console.log;
			}
		} else {
			// shh
			this.stdout = function () {};
		}
	};
	util.inherits(Ears, EventEmitter);

/*
	***** PUBLIC
*/

	Ears.prototype.setMetaData = function (metadata) {
		// Store metadata about the application. Provide an object literal.
		// This will be returned on directive:autodetect requests
		this.metadata = metadata || {};
	};

	Ears.prototype.listen = function (options, next) {
		// Listen
		var that = this;

		if (typeof options === 'function') {
			next = options;
			options = {};
		}
		if (!this.server) {
			if (!this.options.port) {
				// Auto-select a port
				portfinder.basePort = 4000;
				portfinder.getPort(function (e, port) {
					if (!e) {
						that.options.port = port;
						that.createServer(port);
						that.startListen(port, next);
					}
				});
			} else {
				// Use defined port
				this.createServer();
				this.startListen(this.options.port, options.host, next);
			}
		} else {
			this.startListen(this.options.port, options.host, next);
		}
	};

	Ears.prototype.muffs = function (next) {
		// Stop listening
		this.goDeaf(next);
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
		var meta;

		if (data) {
			try {
				data = JSON.parse(data);
			} catch (e) {
				next(400); // Internal Server Error
			}
			// At this point, the data object should contain a 'directive' and an optional 'message'
			if (data.directive) {
				if (data.directive === 'autodetect') {
					// An autodetect request is looking for information about this application
					meta = this.metadata || {};
					meta._ears = {
						listeningOn: this.options.port
					};
					next(200, meta); // OK
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

	Ears.prototype.startListen = function (port, host, next) {
		// Listen
		var that = this;

		next = next || function () {};
		this.server.listen(port, host, function () {
			that.stdout('Ears listening on ' + (host || '(all)') + ':' + port);
			next();
		});
	};

	Ears.prototype.createServer = function () {
		// Create an http server
		var that = this;

		if (!this.server) {
			this.server = http.createServer(function () {
				that.respond.apply(that, arguments);
			});
			this.server.on('close', function () {
				that.stdout('Ears no longer listening');
			});
		}
	};

	Ears.prototype.goDeaf = function (next) {
		// Stop listening
		if (this.server) {
			this.server.close(next || function () {});
		} else {
			(next || function () {})();
		}
	};

	// Expose
	exports = module.exports = Ears;
}());