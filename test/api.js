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

test('Erlang API', function(t) {
  t.equal(typeof api.term_to_binary, 'function', 'API term_to_binary')
  t.equal(typeof api.binary_to_term, 'function', 'API binary_to_term')
  t.equal(typeof api.optlist_to_term, 'function', 'API optlist_to_term')
  t.equal(typeof api.optlist_to_binary, 'function', 'API optlist_to_binary')
  t.equal(typeof api.term_to_binary.Encoder, 'function', 'Encoder constructor')
  t.equal(typeof api.binary_to_term.Decoder, 'function', 'Decoder constructor')
  t.end()
})
