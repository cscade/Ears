## 0.2.1 - 2012-08-23

* Updated docs

## 0.2.0 - 2012-08-23

* Rewrite tests for Mocha
* Integrate Travis-CI
* Respond with `400` on malformed json instead of `500`
* Provide optional callback hook for `muffs()` method

## 0.1.4 / 9/22/2011

* Ears will now choose it's own port from ports available if the port option is not specified. 1st port 4000 or above will be used.
* Now depends on "portfinder"

## 0.1.3 / 9/22/2011

* Add setMetadata() method to store arbitrary response data for the application ears is attached to
* Add directive: 'autodetect' response type, responds with data about this ears instance and attached application
* Responses are now JSON instead of plaintext, response object always contains an 'ok': true/false field

## 0.1.2 / 9/15/2011

* Update HTTP response codes to better reflect state

## 0.1.1 / 9/15/2011

* Customizable response messages via options.messages.ok/nok
* 'verbose' option to publish listening messages to stdout. defaults to true
* Initial test coverage in expresso
* ears.listen() now accepts a callback that fires on ready

## 0.1.0 / 9/15/2011

* Initial release to NPM