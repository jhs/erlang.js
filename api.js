// The erlang.js API
//

var term_to_binary = require('./term_to_binary');

module.exports = { "term_to_binary": term_to_binary.term_to_binary
                 , "optlist_to_binary": term_to_binary.optlist_to_binary
                 }
