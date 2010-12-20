var sys = require('sys')
  , lib = require('./lib.js')
  ;

function is_int(val) {
  return (!isNaN(val)) && (parseFloat(val) === parseInt(val));
}

/* XXX This used to be used however now objects are used to create special types. Keeping for posterity.
// Return the "meat" of a regex, or null if it is not a regex.
function regex_of(val) {
  return lib.typeOf(val) === 'regexp' ? val.toString().slice(1, -1) : null;
}
*/

// Use object creation because I don't like object literal syntax to place functions in a namespace.
var Encoder = function() {
  var self = this;

  this.encode = function(term) {
    var encoder = this[lib.typeOf(term)];
    if(!encoder)
      throw new Error("Do not know how to encode " + lib.typeOf(term) + ': ' + sys.inspect(term));
    return encoder.apply(self, [term]);
  }

  this.number = function(x) {
    return is_int(x) ? this.int(x) : this.float(x);
  }

  this.int = function(x) {
    if(x >= 0 && x < 256)
      return [lib.tags.SMALL_INTEGER, x];
    else
      throw new Error('Unknown integer: ' + x);
  }

  this.array = function(x) {
    // Simple array encoding, without worrying about tagging.
    var result = []
      , encoded = [];

    for(var a = 0; a < x.length; a++) {
      var val = x[a];
      if(!val)
        // TODO: Warning: new Error("Bad array: " + sys.inspect(x));
        continue;
      encoded.push(self.encode(val));
    }

    if(encoded.length) {
      result.push( lib.tags.LIST
                 , lib.uint32(encoded.length)
                 , encoded );
    }

    result.push(lib.tags.NIL);
    return result;
  }

  this.object = function(x) {
    if(Object.keys(x).length !== 1)
      throw new Error("Don't know how to process: " + sys.inspect(x));

    var tag = Object.keys(x)[0]
    var val = x[tag];
    var valType = lib.typeOf(val);

    if((tag === 'binary' || tag === 'b') && valType === 'string')
      // Encode the given string as a binary.
      return self.encode(new Buffer(val, 'utf8'));

    if((tag === 'atom' || tag === 'a') && valType === 'string')
      // Encode the string as an atom.
      return self.atom(val);

    if((tag === 'tuple' || tag === 't') && valType === 'array')
      // Encode the array as a tuple.
      return self.tuple(val);

    throw new Error("Unknown tag " + tag.toString() + " for value: " + sys.inspect(val));
  }

  this.atom = function(x) {
    var bytes = new Buffer(x, 'utf8');
    var result = [ lib.tags.ATOM
                 , lib.uint16(bytes.length) ];
    for(var a = 0; a < bytes.length; a++)
      result.push(bytes[a]);
    return result;
  }

  this.tuple = function(x) {
    var result = [];
    if(x.length < 256)
      result.push(lib.tags.SMALL_TUPLE, x.length);
    else
      result.push(lib.tags.LARGE_TUPLE, lib.uint32(x.length));

    result.push(x.map(function(e) { return self.encode(e) }));
    return result;
  }

  this.buffer = function(x) {
    var result = [lib.tags.BINARY];
    result.push(lib.uint32(x.length));
    for(var a = 0; a < x.length; a++)
      result.push(x[a]);
    return result;
  }

  this.string = function(x) {
    var result = [];
    result.push(lib.tags.STRING);

    var bytes = new Buffer(x, 'utf8');
    if(bytes.length != x.length) {
      // TODO: Some kind of warning that this should probably be a binary since it is not only low-ASCII.
    }

    result.push(lib.uint16(bytes.length));
    for(var a = 0; a < bytes.length; a++)
      result.push(bytes[a]);

    return result;
  }

  this.boolean = function(x) {
    return self.atom(x ? "true" : "false");
  }
}

var encoder = new Encoder;

exports.term_to_binary = function(term) {
  var bytes = [lib.VERSION_MAGIC, encoder.encode(term)];
  //console.log('bytes: %j', bytes);
  return new Buffer(lib.flatten(bytes));
}
