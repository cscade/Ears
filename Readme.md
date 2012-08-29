# Ears

Simple communications plugin for node.js applications. Talk to your running application with JSON.

[![build status](https://secure.travis-ci.org/cscade/Ears.png)](http://travis-ci.org/cscade/Ears)

## Installation

	$ npm install ears

## Usage

Ears is very simple to use. It listens on your port of choice (or auto-detects a free port above 3999) on your address of choice (defaulting to INADDR_ANY) for incoming JSON POST requests. Ears is an EventEmitter, and will emit "message" on every incoming "directive".

````javascript
var Ears = require('ears');

ears = new Ears({ port: 3333 });
ears.on('testMessage', function (message) {
	console.log(message); // This is my test message!
});
ears.listen();
````

	$ curl localhost:3333 -H 'content-type: application/json' -d '{ "directive": "testMessage", "message": "This is my test message!" }'
	{"ok":true,"message":"ok"}
	$

### Options

````javascript
port: [null],			// Port to listen on, defaults to first available above 3999
verbose: [true]/false,	// Send listening messages to stdout
messages: {				// Responses to requests
	ok: 'ok',
	nok: 'NOT ok. Make sure to POST content-type: application/json with a "directive" and a "message".'
}
````

### Methods

#### listen([options], [callback])

````javascript
// Just listen
ears.listen();

// Listen with a callback
ears.listen(function () {});

// Listen on a specific address with a callback
ears.listen({
	host: '127.0.0.1' // Defaults to INADDR_ANY (all addresses on host)
}, function () {});
````

#### muffs([callback])

````javascript
// Stop responding to requests, with an optional callback
ears.muffs();
ears.muffs(function () {});
````

### Response Codes

If you...

	send a properly formed request with appropriate properties		-> 200 OK
	send a GET request												-> 405 Method Not Allowed
	send a POST request without application/json content type		-> 400 Bad Request
	send a JSON object missing the required properties				-> 400 Bad Request
	send malformed JSON												-> 400 Bad Request

## What can it do?

I developed this module initially to provide a way to talk to production node.js applications from the command line
using cURL. By integrating Ears into applications, I can communicate graceful shutdown commands to node instances
as part of deploy scripts, etc.

Since it is not specialized to a particular purpose, it can be used anywhere it would be useful to convey messages or data
via JSON to a node.js application from the local host.

## Test Coverage

Ears has a full test suite written for mocha. `npm install -g mocha` for access to the binary.

## License 

(The MIT License)

Copyright (c) 2011 Carson Christian &lt;cc@amplego.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.