import * as arraybufferToBuffer from "arraybuffer-to-buffer";
import {binary_to_term} from "./api";

export async function blob_to_term(blob: Blob) {
  return new Promise(((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      const bs = arraybufferToBuffer(buf);
      resolve(binary_to_term(bs));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  }));
}
