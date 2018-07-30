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

test('Simple object codec', function(t) {
  var o = {username:'user',password:'123'};

  var bin = api.term_to_binary(o)
  t.equal(bin[0], lib.VERSION_MAGIC, 'Encoded tuple begins with the magic number')
  t.equal(bin[1], lib.tags.SMALL_TUPLE, 'Object is encoded as a SMALL_TUPLE')

  var dec = api.binary_to_term(bin)
  t.equal(JSON.stringify(o), JSON.stringify(dec), 'Decoded is same as original data')

  t.end()
})

var o = {username:'user',password:'123', logs:[{time:123}, {time:234}]};

function test_deep_object(format){
 test(`Deep object codec (${format})`, function(t){
   var bin = api.term_to_binary(o, format)
   t.equal(bin[0], lib.VERSION_MAGIC, 'Encoded tuple begins with the magic number')
   t.equal(bin[1], lib.tags.SMALL_TUPLE, 'Object is encoded as a SMALL_TUPLE')

   var dec = api.binary_to_term(bin, format)
   t.equal(JSON.stringify(o), JSON.stringify(dec), 'Decoded is same as original data')

   t.end()
 })
}

test_deep_object("map_optlist");
test_deep_object("map_list");
test_deep_object("util");
