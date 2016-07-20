// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var tap = require('tap')
var test = tap.test
var util = require('util')

var package = require('../package.json')
var api     = require('../' + package.main)
var lib     = require('../lib.js')

test('Small tuple codec', function(t) {
  var biggest_small_tuple = mk_tuple(255)
  t.equal(biggest_small_tuple.t.length, 255, 'The biggest SMALL_TUPLE has an unsigned 1-byte size, 255 elements')

  var bin = api.term_to_binary(biggest_small_tuple)
  t.equal(bin[0], lib.VERSION_MAGIC, 'Encoded tuple begins with the magic number')
  t.equal(bin[1], lib.tags.SMALL_TUPLE, 'Tuple is encoded as a SMALL_TUPLE')

  var dec = api.binary_to_term(bin)
  t.equal(dec.t.length, 255, 'Decoded tuple has the correct element count')
  for (var i = 0; i < 255; i++)
    t.equal(dec.t[i].toString(), `tuple element ${i}`, 'Tuple element is in the right position: ' + i)

  t.end()
})

test('Large tuple codec', (t) => {
  var smallest_large_tuple = mk_tuple(256)
  t.equal(smallest_large_tuple.t.length, 256, 'The smallest LARGE_TUPLE has 256 or more elements')

  var bin = api.term_to_binary(smallest_large_tuple)
  t.equal(bin[0], lib.VERSION_MAGIC, 'Encoded tuple begins with the magic number')
  t.equal(bin[1], lib.tags.LARGE_TUPLE, 'Tuple is encoded as a LARGE_TUPLE')

  var tuple_size = bin.slice(2, 6)
  t.ok(tuple_size.equals(new Buffer([0x00, 0x00, 0x01, 0x00])), 'Tuple size is 256 encoded in unsigned 32-bit big-endian')

  tuple_size = bin.readUInt32BE(2)
  t.equal(tuple_size, 256, 'Tuple size is 256 as decoded from the buffer')

  var dec = api.binary_to_term(bin)
  t.equal(dec.t.length, 256, 'Decoded tuple has the correct element count')
  for (var i = 0; i < 256; i++)
    t.equal(dec.t[i].toString(), `tuple element ${i}`, 'Large tuple element is in the right position: ' + i)

  t.end()
})

test('Very large tuple', (t) => {
  var size = 10000

  var tuple = mk_tuple(size, {a:'foo'})
  var bin = api.term_to_binary(tuple)
  var dec = api.binary_to_term(bin)
  t.same(dec, tuple, `Round-trip through a large tuple (${size} elements) works`)
  t.end()
})

function mk_tuple(size, fill) {
  var result = []
  for (var i = 0; i < size; i++)
    result.push(fill || new Buffer('tuple element ' + i))
  return {t: result}
}
