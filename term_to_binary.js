var sys = require('sys')
  , lib = require('./lib.js')
  ;

function is_int(val) {
  return (!isNaN(val)) && (parseFloat(val) === parseInt(val));
}

// Return the "meat" of a regex, or null if it is not a regex.
function regex_of(val) {
  return lib.typeOf(val) === 'regexp' ? val.toString().slice(1, -1) : null;
}

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
    var result = []
    if(x.length) {
      // Arrays are used to encode special-cases where Javascript has no syntax to match Erlang.
      if(x.length === 2) {
        var tag = x[0], val = x[1];
        var re = regex_of(tag);
        if(re && lib.typeOf(val) !== 'string') {
          throw new Error("Unknown value to encode: " + sys.inspect(x[1]));
        } else if(re === 'binary' || re === 'b') {
          // Encode the given string as a binary.
          return self.encode(new Buffer(val, 'utf8'));
        } else if(re === 'atom' || re === 'a') {
          // Encode the string as an atom.
          return self.atom(val);
        } else if(re) {
          throw new Error("Do not know what regex means: " + re.toString());
        }
      } else {
        // Nope, just a normal array (list).
        result.push(lib.tags.LIST);
        result.push(lib.uint32(x.length));
        result.push(x.map(function(e) { return self.encode(e) }));
      }
    }

    result.push(lib.tags.NIL);
    return result;
  }

  this.atom = function(x) {
    var bytes = new Buffer(x, 'utf8');
    var result = [ lib.tags.ATOM
                 , lib.uint16(bytes.length) ];
    for(var a = 0; a < bytes.length; a++)
      result.push(bytes[a]);
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
}

var encoder = new Encoder;

exports.term_to_binary = function(term) {
  var bytes = [lib.VERSION_MAGIC, encoder.encode(term)];
  //console.log('bytes: %j', bytes);
  return new Buffer(lib.flatten(bytes));
}
