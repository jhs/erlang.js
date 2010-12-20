exports.VERSION_MAGIC = 131;
exports.tags = { 'SMALL_INTEGER' : 'a'
               , 'INTEGER'       : 'b'
               , 'FLOAT'         : 'c'
               , 'ATOM'          : 'd'
               , 'SMALL_ATOM'    : 's'
               , 'REFERENCE'     : 'e'
               , 'NEW_REFERENCE' : 'r'
               , 'PORT'          : 'f'
               , 'NEW_FLOAT'     : 'F'
               , 'PID'           : 'g'
               , 'SMALL_TUPLE'   : 'h'
               , 'LARGE_TUPLE'   : 'i'
               , 'NIL'           : 'j'
               , 'STRING'        : 'k'
               , 'LIST'          : 'l'
               , 'BINARY'        : 'm'
               , 'BIT_BINARY'    : 'M'
               , 'SMALL_BIG'     : 'n'
               , 'LARGE_BIG'     : 'o'
               , 'NEW_FUN'       : 'p'
               , 'EXPORT'        : 'q'
               , 'FUN'           : 'u'
               }

// Actually these need to be integers to be useful.
Object.keys(exports.tags).forEach(function(key) {
  exports.tags[key] = exports.tags[key].charCodeAt(0);
})

typeOf = exports.typeOf = function(value) {
  var s = typeof value;

  // Note: using Object.prototype.toString instead of instanceof because it's not working.
  if (s === 'object') {
    if (value) {
      if(Object.prototype.toString.apply(value) === '[object Array]') {
        s = 'array';
      }
    } else {
      s = 'null';
    }
  } else if(s === 'function' && Object.prototype.toString.apply(value) === '[object RegExp]') {
    return 'regexp';
  }
  return s;
}

flatten = exports.flatten = function (ar) {
  return ar.reduce(function(state, elem) {
    return state.concat(typeOf(elem) === 'array' ? flatten(elem) : [elem]);
  }, [])
}

exports.uint32 = function(n) {
  return [ n >> 24 & 0xff
         , n >> 16 & 0xff
         , n >>  8 & 0xff
         , n >>  0 & 0xff ];
}
