module.exports = term_to_binary
module.exports.Encoder = Encoder
module.exports.optlist_to_term = optlist_to_term
module.exports.optlist_to_binary = optlist_to_binary

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


var util = require('util')
var lib = require('./lib.js')

function Encoder () {
}

Encoder.prototype.encode = function(term) {
  var type = lib.typeOf(term)
  var encoder = this[type]

  if(!encoder)
    throw new Error("Do not know how to encode " + lib.typeOf(term) + ': ' + util.inspect(term))

  return encoder.apply(this, [term])
}

Encoder.prototype.null = function(x) {
  return this.atom('nil')
}

Encoder.prototype.number = function(x) {
  return is_int(x) ? this.int(x) : this.float(x)
}

Encoder.prototype.int = function(x) {
  if(x >= 0 && x < 256)
    return [lib.tags.SMALL_INTEGER, x]
  else if(lib.MIN_INTEGER <= x && x <= lib.MAX_INTEGER)
    return [lib.tags.INTEGER, lib.uint32(x)]
  else
    throw new Error('Unknown integer: ' + x)
}

Encoder.prototype.array = function(x) {
  // Simple array encoding, without worrying about tagging.
  var result = []
  var encoded = []

  for(var a = 0; a < x.length; a++) {
    var val = x[a]
    //if(!val)
    //  // TODO: Warning: new Error("Bad array: " + util.inspect(x))
    //  continue
    encoded.push(this.encode(val))
  }

  if(encoded.length)
    result.push( lib.tags.LIST
               , lib.uint32(encoded.length)
               , encoded )

  result.push(lib.tags.NIL)
  return result
}

Encoder.prototype.object = function(x) {
  var keys = Object.keys(x)
  if(keys.length !== 1)
    throw new Error("Don't know how to process: " + util.inspect(x))

  var tag = keys[0]
  var val = x[tag]
  var valType = lib.typeOf(val)

  if((tag === 'binary' || tag === 'b') && valType === 'string')
    // Encode the given string as a binary.
    return this.encode(new Buffer(val, 'utf8'))

  if((tag === 'atom' || tag === 'a') && valType === 'string')
    // Encode the string as an atom.
    return this.atom(val)

  if((tag === 'tuple' || tag === 't') && valType === 'array')
    // Encode the array as a tuple.
    return this.tuple(val)

  throw new Error("Unknown tag " + tag.toString() + " for value: " + util.inspect(val))
}

Encoder.prototype.atom = function(x) {
  var bytes = new Buffer(x, 'utf8')
  var result = [ lib.tags.ATOM
               , lib.uint16(bytes.length) ]

  for(var a = 0; a < bytes.length; a++)
    result.push(bytes[a])

  return result
}

Encoder.prototype.tuple = function(x) {
  var result = []

  if(x.length < 256)
    result.push(lib.tags.SMALL_TUPLE, x.length)
  else
    result.push(lib.tags.LARGE_TUPLE, lib.uint32(x.length))

  for (var i = 0; i < x.length; i++)
    result.push(this.encode(x[i]))

  return result
}

Encoder.prototype.buffer = function(x) {
  var result = [lib.tags.BINARY]
  result.push(lib.uint32(x.length))
  for(var a = 0; a < x.length; a++)
    result.push(x[a])
  return result
}

Encoder.prototype.string = function(x) {
  var result = [lib.tags.STRING]

  var bytes = new Buffer(x, 'utf8')
  if(bytes.length != x.length) {
    // TODO: Some kind of warning that this should probably be a binary since it is not only low-ASCII.
  }

  result.push(lib.uint16(bytes.length))
  for(var a = 0; a < bytes.length; a++)
    result.push(bytes[a])

  return result
}

Encoder.prototype.boolean = function(x) {
  return this.atom(x ? "true" : "false")
}

function term_to_binary(term) {
  var encoder = new Encoder
  var bytes = [lib.VERSION_MAGIC, encoder.encode(term)]
  //console.log('bytes: %j', bytes)
  return new Buffer(lib.flatten(bytes))
}

// Provide convenience to convert to Erlang opt lists: [{verbose, true}, quiet, etc]
// Array elements must be either:
// 1. String, from 1 to 255 characters of only lower-case alphanumerics -> atom
// 2. A 2-array, first element are strings like #1. If the second element is
//    a string like #1, it is converted, otherwise left alone -> {two, tuple}
//
// Booleans are converted to tuples too.
function optlist_to_term (opts) {
  var args = Array.prototype.slice.apply(arguments)
  if(args.length > 1)
    return optlist_to_term(args)

  if(typeOf(opts) !== 'array')
    throw new Error("Cannot convert to OptList: " + util.inspect(opts))

  var looks_like_atom = /^[a-z][a-zA-Z0-9@\._]{0,254}$/

  function to_atom(el, opts) {
    var type = typeOf(el)

    if(type === 'boolean')
      return el

    if(type === 'string') {
      if(looks_like_atom.test(el))
        return {'atom': el}
      else if(opts && opts.identity)
        return el
      throw new Error("Invalid atom: " + el)
    }

    if(opts && opts.identity)
      return el

    throw new Error("Cannot convert to atom: " + util.inspect(el))
  }

  function to_2_tuple(el) {
    return {'tuple': [ to_atom(el[0])
                     , to_atom(el[1], {identity:true}) ] }
  }

  function element_to_opt(el) {
    var type = typeOf(el)
    if(type === 'string' || type === 'boolean') {
      return to_atom(el)
    } else if(type === 'array' && el.length === 2) {
      return to_2_tuple(el)
    } else if(type === 'object' && Object.keys(el).length === 1) {
      var key = Object.keys(el)[0]
      return to_2_tuple([key, el[key]])
    } else {
      throw new Error("Invalid optlist element: " + util.inspect(el))
    }
  }

  return opts.map(function(el) { return element_to_opt(el) })
}

function optlist_to_binary() {
  return term_to_binary(optlist_to_term.apply(this, arguments))
}

function is_int(val) {
  return (!isNaN(val)) && (parseFloat(val) === parseInt(val))
}
