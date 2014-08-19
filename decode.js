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
  this.emit('log', 'binary_to_term(%j) -> %j', bin, term)
}

//function Decoder () {}
//Decoder.prototype.decode = function(term) {
//  var type = lib.typeOf(term)
//  var encoder = this[type]
//
//  if(!encoder)
//    throw new Error("Do not know how to encode " + lib.typeOf(term) + ': ' + sys.inspect(term))
//
//  return encoder.apply(this, [term])
//}
//
//Decoder.prototype.number = function(x) {
//  return is_int(x) ? this.int(x) : this.float(x)
//}
//
//Decoder.prototype.int = function(x) {
//  if(x >= 0 && x < 256)
//    return [lib.tags.SMALL_INTEGER, x]
//  else if(lib.MIN_INTEGER <= x && x <= lib.MAX_INTEGER)
//    return [lib.tags.INTEGER, lib.uint32(x)]
//  else
//    throw new Error('Unknown integer: ' + x)
//}
//
//Decoder.prototype.object = function(x) {
//  var keys = Object.keys(x)
//  if(keys.length !== 1)
//    throw new Error("Don't know how to process: " + sys.inspect(x))
//
//  var tag = keys[0]
//  var val = x[tag]
//  var valType = lib.typeOf(val)
//
//  if((tag === 'binary' || tag === 'b') && valType === 'string')
//    // Encode the given string as a binary.
//    return this.encode(new Buffer(val, 'utf8'))
//
//  if((tag === 'atom' || tag === 'a') && valType === 'string')
//    // Encode the string as an atom.
//    return this.atom(val)
//
//  if((tag === 'tuple' || tag === 't') && valType === 'array')
//    // Encode the array as a tuple.
//    return this.tuple(val)
//
//  throw new Error("Unknown tag " + tag.toString() + " for value: " + sys.inspect(val))
//}
//
//Decoder.prototype.buffer = function(x) {
//  var result = [lib.tags.BINARY]
//  result.push(lib.uint32(x.length))
//  for(var a = 0; a < x.length; a++)
//    result.push(x[a])
//  return result
//}
//
//Decoder.prototype.boolean = function(x) {
//  return this.atom(x ? "true" : "false")
//}
//
//// Provide convenience to convert to Erlang opt lists: [{verbose, true}, quiet, etc]
//// Array elements must be either:
//// 1. String, from 1 to 255 characters of only lower-case alphanumerics -> atom
//// 2. A 2-array, first element are strings like #1. If the second element is
////    a string like #1, it is converted, otherwise left alone -> {two, tuple}
////
//// Booleans are converted to tuples too.
//function term_to_optlist (opts) {
//  var args = Array.prototype.slice.apply(arguments)
//  if(args.length > 1)
//    return term_to_optlist(args)
//
//  if(typeOf(opts) !== 'array')
//    throw new Error("Cannot convert to OptList: " + sys.inspect(opts))
//
//  var looks_like_atom = /^[a-z][a-zA-Z0-9@\._]{0,254}$/
//
//  function to_atom(el, opts) {
//    var type = typeOf(el)
//
//    if(type === 'boolean')
//      return el
//
//    if(type === 'string') {
//      if(looks_like_atom.test(el))
//        return {'atom': el}
//      else if(opts && opts.identity)
//        return el
//      throw new Error("Invalid atom: " + el)
//    }
//
//    if(opts && opts.identity)
//      return el
//
//    throw new Error("Cannot convert to atom: " + sys.inspect(el))
//  }
//
//  function to_2_tuple(el) {
//    return {'tuple': [ to_atom(el[0])
//                     , to_atom(el[1], {identity:true}) ] }
//  }
//
//  function element_to_opt(el) {
//    var type = typeOf(el)
//    if(type === 'string' || type === 'boolean') {
//      return to_atom(el)
//    } else if(type === 'array' && el.length === 2) {
//      return to_2_tuple(el)
//    } else if(type === 'object' && Object.keys(el).length === 1) {
//      var key = Object.keys(el)[0]
//      return to_2_tuple([key, el[key]])
//    } else {
//      throw new Error("Invalid optlist element: " + sys.inspect(el))
//    }
//  }
//
//  return opts.map(function(el) { return element_to_opt(el) })
//}
//
//function binary_to_optlist() {
//  return term_to_optlist(binary_to_term.apply(this, arguments))
//}
//
//function is_int(val) {
//  return (!isNaN(val)) && (parseFloat(val) === parseInt(val))
//}
