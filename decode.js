module.exports = binary_to_term
module.exports.Decoder = Decoder

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

//module.exports.term_to_optlist = term_to_optlist
//module.exports.binary_to_optlist = binary_to_optlist

var EE = require('events').EventEmitter
var util = require('util')

var lib = require('./lib.js')

function binary_to_term(term) {
  if (!Buffer.isBuffer(term))
    throw new Error('Not a buffer')
  if (term[0] !== lib.VERSION_MAGIC)
    throw new Error('No magic number ' + lib.VERSION_MAGIC)

  term = term.slice(1) // Cut out the version magic
  var decoder = new Decoder(term)
  var decoded = decoder.decode()

  if (decoder.bin.length !== 0)
    throw new Error('Term encoding has '+decoder.bin.length+' bytes remaining')

  return decoded
}

util.inherits(Decoder, EE)
function Decoder (bin) {
  EE.call(this)

  this.bin = bin || new Buffer([])
}

Decoder.prototype.decode = function() {
  var NUM = lib.numbers
  var TAG = lib.tags

  var type_num = this.bin[0]
  var type = lib.numbers[type_num]

  if (!type)
    throw new Error('Unknown magic number: ' + type_num + ' ' + JSON.stringify(this.bin))

  if (!this[type])
    throw new Error('Unknown decoder: ' + type)

  return this[type]()
}

Decoder.prototype.SMALL_INTEGER = function() {
  var term = this.bin.readUInt8(1)
  this.bin = this.bin.slice(2)
  return term
}

Decoder.prototype.INTEGER = function() {
  var term = this.bin.readUInt32BE(this.bin[0])
//  else if(lib.MIN_INTEGER <= x && x <= lib.MAX_INTEGER)
//    return [lib.tags.INTEGER, lib.uint32(x)]
  this.bin = this.bin.slice(4)
  return term
}

Decoder.prototype.STRING = function() {
  var start = 1 + 2 // The string tag and the length part
  var length = this.bin.readUInt16BE(1)
  var term = this.bin.slice(start, start + length).toJSON()

  this.bin = this.bin.slice(start + length)
  return term
}

Decoder.prototype.ATOM = function() {
  this.emit('log', 'ATOM %j', this.bin)
  var start = 1 + 2 // The string tag and the length part
  var length = this.bin.readUInt16BE(1)
  var term = this.bin.slice(start, start + length).toString('utf8')

  this.bin = this.bin.slice(start + length)
  return term
}

Decoder.prototype.LIST = function() {
  var length = this.bin.readUInt32BE(1)
  this.emit('log', 'LIST[%d] %j', length, this.bin)
  var term = new Array(length)

  var body = new Decoder(this.bin.slice(5))
  for (var i = 0; i < length; i++)
    term[i] = body.decode()

  if(body.bin[0] !== lib.tags.NIL)
    throw new Error('Non-nil at end of list: ' + JSON.stringify(body.bin))

  // The body's remainder is the new position in the decoding sequence.
  this.bin = body.bin.slice(1) // Slice the array NIL out.
  return term
}

Decoder.prototype.SMALL_TUPLE = function() {
  var tag = this.bin[0]
  if (tag === lib.tags.SMALL_TUPLE) {
    var length = this.bin[1]
    var body = new Decoder(this.bin.slice(2))
  } else if (tag === lib.tags.LARGE_TUPLE) {
    var length = this.bin.readUInt32BE(1)
    var body = new Decoder(this.bin.slice(3))
  } else
    throw new Error('Unknown tuple tag: ' + tag)

  var term = new Array(length)
  for (var i = 0; i < length; i++)
    term[i] = body.decode()

  // The body's remainder is the new position in the decoding sequence.
  this.bin = body.bin

  this.emit('log', 'Small tuple %j', this.bin)
  console.dir(term)
  return term
}

if(require.main === module) {
  var ttb = require('./encode.js')
  var source = [1, 12, 13]
  var bin = ttb(source)
  var term = binary_to_term(bin)
  debug('binary_to_term(%j) -> %j', bin, term)
}
