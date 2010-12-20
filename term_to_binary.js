var lib = require('./lib.js');

function is_int(val) {
  return (!isNaN(val)) && (parseFloat(val) === parseInt(val));
}

// Use object creation because I don't like object literal syntax to place functions in a namespace.
var Encoder = function() {
  var self = this;

  this.encode = function(term) {
    return this[lib.typeOf(term)].apply(this, [term]);
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
      result.push(lib.tags.LIST);
      result.push(lib.uint32(x.length));
      result.push(x.map(function(e) { return self.encode(e) }));
    }

    result.push(lib.tags.NIL);
    return result;
  }

  this.string = function(x) {
    var result = [];
    result.push(lib.tags.STRING);

    var bytes = new Buffer(x, 'utf8');
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

//require('sys').puts(exports.term_to_binary(5));
console.log(exports.term_to_binary(500));
