exports.to_buffer = iolist_to_buffer
exports.size      = iolist_size

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


function process_iolist(obj, state) {
  if (! state)
    return process_iolist(obj, {size:0, buffers:[]})

  var type = typeof obj
  if (Array.isArray(obj)) {
    for (var element of obj)
      process_iolist(element, state)
  } else if (Buffer.isBuffer(obj)) {
    state.size += obj.length
    state.buffers.push(obj)
  } else if (type == 'string') {
    state.size += obj.length
    state.buffers.push(new Buffer(obj))
  } else if (type == 'number' && 0 <= obj && obj < 256) {
    state.size += 1
    state.buffers.push(new Buffer([obj]))
  } else
    throw new Error(`Unknown element in iolist: ${typeof obj}: ${obj}`)

  return state
}

function iolist_to_buffer(list) {
  var {size, buffers} = process_iolist(list)
  var body = Buffer.concat(buffers, size)
  return body
}

function iolist_size(list) {
  var result = process_iolist(list)
  return result.size
}
