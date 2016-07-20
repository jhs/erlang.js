// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var encode = require('./encode.js')
var decode = require('./decode.js')
var iolist = require('./iolist.js')

module.exports =
  { term_to_binary   : encode
  , optlist_to_term  : encode.optlist_to_term
  , optlist_to_binary: encode.optlist_to_binary

  , binary_to_term   : decode

  , iolist_to_binary : iolist.to_buffer
  , iolist_to_buffer : iolist.to_buffer
  , iolist_size      : iolist.size
  }
