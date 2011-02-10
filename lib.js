exports.VERSION_MAGIC = 131;           // 131  83
exports.MAX_INTEGER = (1 << 27) - 1;
exports.MIN_INTEGER = -(1 << 27);

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

// Actually these need to be integers to be useful.
Object.keys(exports.tags).forEach(function(key) {
  exports.tags[key] = exports.tags[key].charCodeAt(0);
})

function to_s(val) {
  return Object.prototype.toString.apply(val);
}

typeOf = exports.typeOf = function(value) {
  var s = typeof value;

  // Note: using Object.prototype.toString instead of instanceof because it's not working.
  if (s === 'object') {
    if (value) {
      if(to_s(value) === '[object Array]') {
        s = 'array';
      } else if(to_s(value) === '[object Buffer]') {
        s = 'buffer';
      }
    } else {
      s = 'null';
    }
  } else if(s === 'function' && to_s(value) === '[object RegExp]') {
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

exports.uint16 = function(n) {
  return [ n >> 16 & 0xff
         , n >>  0 & 0xff ];
}
