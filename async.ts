import * as arraybufferToBuffer from "arraybuffer-to-buffer";

export function blob_to_buffer(blob: Blob) {
  return new Promise(((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      const bs = arraybufferToBuffer(buf);
      resolve(bs);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  }));
}
