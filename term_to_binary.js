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

  this.raw_array = function(x) {
    // Simple array encoding, without worrying about tagging.
    var result = [];
    if(x.length) {
      result.push( lib.tags.LIST
                 , lib.uint32(x.length)
                 , x.map(function(e) { return self.encode(e) }));
    }
    result.push(lib.tags.NIL);
    return result;
  }

  this.array = function(x) {
    if(x.length !== 2)
      // All arays not of length 2 are innocent.
      return self.raw_array(x);

    // 2-Arrays are used to encode special-cases where Javascript has no syntax to match Erlang.
    var tag = x[0], val = x[1];
    var re = regex_of(tag);

    if(!re)
      // Nope, just an innocent 2-array.
      return self.raw_array(x);

    if((re === 'binary' || re === 'b') && lib.typeOf(val) === 'string')
      // Encode the given string as a binary.
      return self.encode(new Buffer(val, 'utf8'));

    if((re === 'atom' || re === 'a') && lib.typeOf(val) === 'string')
      // Encode the string as an atom.
      return self.atom(val);

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
