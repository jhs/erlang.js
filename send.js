var term_to_binary = require('./term_to_binary');

//require('sys').puts(exports.term_to_binary(5));
var t = [                          // array
        , ['two', 'array']         // Innocent 2-array
        , "ABCDE"                  // string (char list, encoded as STRING)
        , {a:'foo'}                // atom
        , {a:'GET'}
        , {b:'ภาษาไทย'}            // binary
        , [[[[23, 'skidoo']]]]     // nested objects
        , {t:['tuple', {a:'here'}  // tuple
             , {a:'too'}
             ]
          }
        ];

console.log("Sending: " + require('sys').inspect(t));
var b = term_to_binary.term_to_binary(t);
var fs = require('fs');
fs.open('/tmp/out', 'w', 0644, function(er, fd) {
  if(er) throw er;
  fs.write(fd, b, 0, b.length, null, function(er, bytes) {
    if(er) throw er;
    if(bytes != b.length)
      throw new Error("Tried to write " + b.length + " but only wrote " + bytes);
    console.log('Written');
  })
})
