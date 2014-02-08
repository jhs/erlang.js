var fs = require('fs')
var net = require('net')
var util = require('util')
var child_process = require('child_process')

var term_to_binary = require('../term_to_binary');

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
function send(term, callback) {
  var result = []
  var port = 1024 + Math.floor(Math.random() * 10000)
  process.env.port = port

  console.log('Echo on :%d', port)
  var echo = child_process.spawn('escript', [__dirname+'/echo.escript']
                                ,{'stdio':'inherit'})

  echo.on('close', function(code) {
    result = Buffer.concat(result)
    callback(null, result)
  })

  setTimeout(fire, 1000)
  function fire() {
    var client = net.connect({'port':port}, on_connect)

    function on_connect() {
      client.on('data', on_data)
      client.on('end', on_end)

      var bin = term_to_binary(term)
      //console.log('Write %d binary: %j', bin.length, bin)

      var length = new Buffer(4)
      length.writeUInt32BE(bin.length, 0)

      var body = Buffer.concat([length, bin])
      //console.log('Write %d body: %j', body.length, body)
      client.write(body)

      function on_data(data) {
        result.push(data)
      }

      function on_end() {
        client.end()
      }
    }
  }

  function done(er, stdout, stderr) {
    if(er)
      return callback(er)

    console.log('Done')
    console.inspect(stdout)
    console.log('err')
    console.inspect(stderr)
  }
}

function main() {
  send([ {t:[{a:'jason'},{a:'awesome'}]} ], function(er, results) {
    // Find the newline boundary
    var repr, encoding

    for (var i = 0; i < results.length; i++)
      if(results[i] == 13 && results[i+1] == 10) {
        repr = results.slice(0, i).toString('utf8')
        encoding = results.slice(i+2)
        break
      }

    if (!repr)
      throw new Error('Bad repr')
    if (!encoding)
      throw new Error('Bad encoded version')

    console.log('%j', repr)
    console.log('%j', encoding)
  })
}

if (require.main === module)
  main()
