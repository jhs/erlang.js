module.exports = binary_to_term
module.exports.term_to_optlist = term_to_optlist
module.exports.binary_to_optlist = binary_to_optlist

var sys = require('sys')
var lib = require('./lib.js')

function binary_to_term(term) {
  if (!Buffer.isBuffer(term))
    throw new Error('Not a buffer')
  if (term[0] !== lib.VERSION_MAGIC)
    throw new Error('No magic number ' + lib.VERSION_MAGIC)

  term = term.slice(1) // Cut out the version magic
  return decode(term)
}

function decode(bin) {
  var NUM = lib.numbers

  var type = bin[0]
  switch (type) {
    case lib.tags.SMALL_INTEGER:
      return bin.readUInt8(1)
  }

  throw new Error('Unknown type '+type+' '+NUM[type])
}

if(require.main === module) {
  var bin = new Buffer([131, 97, 87])
  var term = binary_to_term(bin)
  console.log('binary_to_term -> %j', term)
}

function term_to_optlist() {}
function binary_to_optlist() {}
