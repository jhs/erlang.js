var sys = require('util')
  , lib = require('./lib.js')
  ;

function is_int(val) {
  return (!isNaN(val)) && (parseFloat(val) === parseInt(val));
}

// Use object creation because I don't like object literal syntax to place functions in a namespace.
var Encoder = function() {
  var self = this;

  self.encode = function(term) {
    var encoder = self[lib.typeOf(term)];
    if(!encoder)
      throw new Error("Do not know how to encode " + lib.typeOf(term) + ': ' + sys.inspect(term));
    return encoder.apply(self, [term]);
  }

  self.null = function() {
    return [lib.tags.NIL]
  }

  self.number = function(x) {
    return is_int(x) ? self.int(x) : self.float(x);
  }

  self.int = function(x) {
    if(x >= 0 && x < 256)
      return [lib.tags.SMALL_INTEGER, x];
    else if(lib.MIN_INTEGER <= x && x <= lib.MAX_INTEGER)
      return [lib.tags.INTEGER, lib.uint32(x)];
    else
      throw new Error('Unknown integer: ' + x);
  }

  self.array = function(x) {
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

  self.object = function(x) {
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

    if((tag === 'pid' || tag === 'p') && valType === 'object')
      return self.pid(val);

    throw new Error("Unknown tag " + tag.toString() + " for value: " + sys.inspect(val));
  }

  self.atom = function(x) {
    var bytes = new Buffer(x, 'utf8');
    var result = [ lib.tags.ATOM
                 , lib.uint16(bytes.length) ];
    for(var a = 0; a < bytes.length; a++)
      result.push(bytes[a]);
    return result;
  }

  self.tuple = function(x) {
    var result = [];
    if(x.length < 256)
      result.push(lib.tags.SMALL_TUPLE, x.length);
    else
      result.push(lib.tags.LARGE_TUPLE, lib.uint32(x.length));

    result.push(x.map(function(e) { return self.encode(e) }));
    return result;
  }

  self.pid = function(x) {
    return [
      lib.tags.PID,
      self.encode(x.node),
      lib.uint32(x.id),
      lib.uint32(x.serial),
      x.creation
    ];
  }

  self.buffer = function(x) {
    var result = [lib.tags.BINARY];
    result.push(lib.uint32(x.length));
    for(var a = 0; a < x.length; a++)
      result.push(x[a]);
    return result;
  }

  self.string = function(x) {
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

  self.boolean = function(x) {
    return self.atom(x ? "true" : "false");
  }
}

var encoder = new Encoder;

exports.term_to_binary = function(term) {
  var bytes = [lib.VERSION_MAGIC, encoder.encode(term)];
  //console.log('bytes: %j', bytes);
  return new Buffer(lib.flatten(bytes));
}

// Provide convenience to convert to Erlang opt lists: [{verbose, true}, quiet, etc]
// Array elements must be either:
// 1. String, from 1 to 255 characters of only lower-case alphanumerics -> atom
// 2. A 2-array, first element are strings like #1. If the second element is
//    a string like #1, it is converted, otherwise left alone -> {two, tuple}
//
// Booleans are converted to tuples too.
exports.optlist_to_term = optlist_to_term = function(opts) {
  var args = Array.prototype.slice.apply(arguments);
  if(args.length > 1)
    return optlist_to_term(args);

  if(typeOf(opts) !== 'array')
    throw new Error("Cannot convert to OptList: " + sys.inspect(opts));

  var looks_like_atom = /^[a-z][a-zA-Z0-9@\._]{0,254}$/;

  function to_atom(el, opts) {
    var type = typeOf(el);

    if(type === 'boolean')
      return el;

    if(type === 'string') {
      if(looks_like_atom.test(el))
        return {'atom': el};
      else if(opts && opts.identity)
        return el;
      throw new Error("Invalid atom: " + el);
    }

    if(opts && opts.identity)
      return el;

    throw new Error("Cannot convert to atom: " + sys.inspect(el));
  }

  function to_2_tuple(el) {
    return {'tuple': [ to_atom(el[0])
                     , to_atom(el[1], {identity:true}) ] };
  }

  function element_to_opt(el) {
    var type = typeOf(el);
    if(type === 'string' || type === 'boolean') {
      return to_atom(el);
    } else if(type === 'array' && el.length === 2) {
      return to_2_tuple(el);
    } else if(type === 'object' && Object.keys(el).length === 1) {
      var key = Object.keys(el)[0];
      return to_2_tuple([key, el[key]]);
    } else {
      throw new Error("Invalid optlist element: " + sys.inspect(el));
    }
  }

  return opts.map(function(el) { return element_to_opt(el) });
}

exports.optlist_to_binary = function() {
  return exports.term_to_binary(exports.optlist_to_term.apply(this, arguments));
}
