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

exports.VERSION_MAGIC = 131;           // 131  83
exports.MAX_INTEGER = (1 << 27) - 1;
exports.MIN_INTEGER = -(1 << 27);
exports.typeOf = typeOf
exports.flatten = flatten

exports.numbers = {}  // To be filled in later.
exports.tags = { 'SMALL_INTEGER' : 'a' // 97   61
               , 'INTEGER'       : 'b' // 98   62
               , 'FLOAT'         : 'c' // 99   63
               , 'ATOM'          : 'd' // 100  64
               , 'SMALL_ATOM'    : 's' // 115  73
               , 'REFERENCE'     : 'e' // 101  65
               , 'NEW_REFERENCE' : 'r' // 114  72
               , 'PORT'          : 'f' // 102  66
               , 'NEW_FLOAT'     : 'F' // 70   46
               , 'PID'           : 'g' // 103  67
               , 'SMALL_TUPLE'   : 'h' // 104  68
               , 'LARGE_TUPLE'   : 'i' // 105  69
               , 'NIL'           : 'j' // 106  6a
               , 'STRING'        : 'k' // 107  6b
               , 'LIST'          : 'l' // 108  6c
               , 'BINARY'        : 'm' // 109  6d
               , 'BIT_BINARY'    : 'M' // 77   4d
               , 'SMALL_BIG'     : 'n' // 110  6e
               , 'LARGE_BIG'     : 'o' // 111  6f
               , 'NEW_FUN'       : 'p' // 112  70
               , 'EXPORT'        : 'q' // 113  71
               , 'FUN'           : 'u' // 117  75
               }

// Actually these need to be integers to be useful. And set up a reverse-lookup object.
for (var tag in exports.tags) {
  var num = exports.tags[tag].charCodeAt(0)
  exports.tags[tag] = num
  exports.numbers[num] = tag
}

// Note: using Object.prototype.toString instead of instanceof because it's not working.
function to_s(val) {
  return Object.prototype.toString.apply(val);
}

function typeOf(value) {
  if (Buffer.isBuffer(value))
    return 'buffer'

  if (Array.isArray(value))
    return 'array'

  var s = typeof value

  if (s === 'object' && !value)
    return 'null'

  if(s === 'function' && to_s(value) === '[object RegExp]')
    return 'regexp'

  return s
}

function flatten(ar) {
  return ar.reduce(function(state, elem) {
    return typeOf(elem) === 'array'
            ? state.concat(flatten(elem))
            : state.concat([elem])
  }, [])
}

exports.uint32 = function(n) {
  return [ n >> 24 & 0xff
         , n >> 16 & 0xff
         , n >>  8 & 0xff
         , n >>  0 & 0xff ]
}

exports.uint16 = function(n) {
  return [ n >> 16 & 0xff
         , n >>  0 & 0xff ]
}
