var fs = require('fs')
var util = require('util')
var child_process = require('child_process')

var term_to_binary = require('./term_to_binary');

//require('sys').puts(exports.term_to_binary(5));
var t = [                          // array
        , ['two', 'array']         // Innocent 2-array
        , "ABCDE"                  // string (char list, encoded as STRING)
        , {a:'foo'}                // atom
        , {a:'GET'}
        , {b:'ภาษาไทย'}            // binary
        , [[[[23, 'skidoo']]]]     // nested objects
        , 123456                   // normal integer
        , {t:['tuple', {a:'here'}  // tuple
             , {a:'too'}
             ]
          }
        , {t:[ {a:'booleans'}, true // Booleans
             , false ]}
        ];

// t = term_to_binary.optlist_to_term('extra_gravy', {cursing: false}, ['ip', {t:[127,0,0,1]}]);
function send(terms, callback) {
  var cb = callback
  callback = function() {
    cb.apply(this, arguments)
    cb = function() {}
  }

  var echo = child_process.spawn('escript', [__dirname + '/echo.escript'], {'stdio':'pipe'})

  echo.on('error', function(er) {
    console.log('Child error: %s', er.message)
    callback(er)
  })

  echo.on('exit', function(code) {
    console.log('Exit %j', code || 0)
    callback(null, code || 0)
  })

  echo.on('disconnect', function(er) {
    console.log('Disconnect')
    callback(new Error('Disconnect'))
  })

  echo.on('close', function() {
    console.log('Close')
    callback(new Error('Close'))
  })

  var results = []
  send_term()

  function send_term() {
    var term = terms.shift()
    if (!term) {
      console.log('Terms done: %j', results)
      return callback(null, results)
    }

    console.log('Send term: %j', term)
    var bin = term_to_binary(term)

    echo.stdin.write(bin)
    echo.stdin.write('\n')

    echo.stdout.once('data', function(repr) {
      console.log('  repr %s', util.inspect(repr))
      echo.stdout.once('data', function(bin) {
        console.log('  encd %s', util.inspect(bin))
        results.push({'repr':repr, 'bin':bin})

        send_term()
      })
    })
  }
}

if (require.main === module)
  main()

console.error("Sending: " + require('sys').inspect(t));
console.error('Written');
