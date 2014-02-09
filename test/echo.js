var fs = require('fs')
var net = require('net')
var tap = require('tap')
var util = require('util')
var async = require('async')
var child_process = require('child_process')

var term_to_binary = require('../term_to_binary');


var ECHO = null
var THAI = '<<224,184,160,224,184,178,224,184,169,224,184,178,224,185,132,224,184,151,224,184,162>>'
var TERMS =
  [ '["two","array"]'      , ['two', 'array']                     // Innocent 2-array
  , '"ABCDE"'              , "ABCDE"                              // string (char list, encoded as STRING)
  , 'foo'                  , {a:'foo'}                            // atom
  , "'GET'"                , {a:'GET'}
  , '[{jason,awesome}]'    , [ {t:[{a:'jason'}, {a:'awesome'}]} ]
  , THAI                   , {b:'ภาษาไทย'}                        // binary
  , '[[[[23,"skidoo"]]]]'  , [[[[23, 'skidoo']]]]                 // nested objects
  , '123456'               , 123456                               // normal integer
  , '{"tuple",here,too}'   , {t:['tuple', {a:'here'}, {a:'too'}]} //tuple
  , '{booleans,true,false}', {t:[ {a:'booleans'}, true, false ]}  // Booleans
  ].reduce(join_pairs, [])

function join_pairs(state, item, i, terms) {
  if(i % 2 == 0)
    state.push({'repr':item, 'term':terms[i+1]})
  return state
}

tap.test('Erlang round-trip echo', function(t) {
  t.plan(TERMS.length)

  async.eachSeries(TERMS, test_pair, pairs_tested)

  function test_pair(pair, to_async) {
    send(pair.term, function(er, results) {
      // Find the newline boundary
      t.equal(results.repr, pair.repr, 'Good representation: ' + pair.repr)
      return to_async(null)
    })
  }

  function pairs_tested(er) {
    if(er)
      throw er

    t.end()
    process.kill(ECHO.child.pid)
    ECHO.wait_timer = setTimeout(function() { process.exit(1) }, 3000)
  }
})


function send(term, callback) {
  with_server(function() {
    var response = []

    console.log('Echo to :%d', ECHO.port)
    var client = net.connect({'port':ECHO.port}, on_connect)
    client.on('data', on_data)
    client.on('end', on_end)

    function on_connect() {
      // Send the term.
      var bin = term_to_binary(term)
      var length = new Buffer(4)
      length.writeUInt32BE(bin.length, 0)

      client.write(length)
      client.write(bin)
    }

    function on_data(chunk) {
      console.log('data chunk %j', chunk)
      response.push(chunk)
    }

    function on_end() {
      console.log('Client done')
      client.end()

      response = Buffer.concat(response)

      var repr, encoded
      for (var i = 0; i < response.length; i++)
        if(response[i] == 13 && response[i+1] == 10) {
          repr = response.slice(0, i).toString('utf8').replace(/\r?\n\s*/g, '')
          encoded = response.slice(i+2)
          break
        }

      if (!repr)
        return callback(new Error('Bad repr'))
      if (!encoded)
        return callback(new Error('Bad encoded version'))

      callback(null, {'repr':repr, 'encoded':encoded})
    }
  }) // with_server
}

function with_server(callback) {
  if (ECHO)
    return process.nextTick(callback)

  ECHO = {}
  process.env.port = 1024 + Math.floor(Math.random() * 10000)
  ECHO.port = process.env.port
  ECHO.child = child_process.spawn('escript', [__dirname+'/echo.escript'], {'stdio':'ignore'})

  ECHO.child.on('close', function(code) {
    console.log('Echo child closed')
    clearTimeout(ECHO.wait_timer)
  })

  setTimeout(callback, 1000)
}
