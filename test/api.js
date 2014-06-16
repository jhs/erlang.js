var tap = require('tap')
var test = tap.test
var util = require('util')

var package = require('../package.json')
var api     = require('../' + package.main)

test('Erlang API', function(t) {
  console.dir(Object.keys(api))

  t.equal(typeof api, 'function', 'term_to_binary is the main export')
  t.equal(typeof api.Encoder, 'function', 'Erlang Encoder constructor')
  t.equal(typeof api.optlist_to_term, 'function', 'API optlist_to_term')
  t.equal(typeof api.optlist_to_binary, 'function', 'API optlist_to_binary')

  t.end()
})

if(0)
test('Serializing', function(t) {
  var stack = traceback()
  t.ok(stack, 'Got a stack from traceback')

  var json
  t.doesNotThrow(function() { json = JSON.stringify(stack) }, 'No problem using JSON.stringify')
  t.type(json, 'string', 'JSON stringification produced a string')

  var back
  t.doesNotThrow(function() { back = JSON.parse(json) }, 'No problem parsing the stack from JSON')
  t.ok(Array.isArray(back), 'Stack round-trip through JSON makes an array')
  t.ok(back.length > 1, 'Stack has some length')

  back.forEach(function(frame) {
    t.type(frame, 'object', 'Each frame after a JSON round-trip is an object')
  })

  t.end()
})
