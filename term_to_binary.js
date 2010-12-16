var lib = require('./lib.js');

function is_int(val) {
  return (!isNaN(val)) && (parseFloat(val) === parseInt(val));
}

// Use object creation because I don't like object literal syntax to place functions in a namespace.
var Encoder = function() {
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
}

var encoder = new Encoder;

exports.term_to_binary = function(term) {
  var bytes = [lib.VERSION_MAGIC, encoder.encode(term)];
  //console.log('bytes: %j', bytes);
  return new Buffer(lib.flatten(bytes));
}

//require('sys').puts(exports.term_to_binary(5));
console.log(exports.term_to_binary(500));
