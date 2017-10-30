type Buffer = Uint8Array | ArrayBuffer;
type ByteArray = any[];

declare class Encoder {
  encode(term): ByteArray;

  undefined(x): ByteArray;

  null(x): ByteArray;

  number(x): ByteArray;

  int(x): ByteArray;

  array(x): ByteArray;

  object(x): ByteArray;

  atom(x): ByteArray;

  tuple(x): ByteArray;

  buffer(x): ByteArray;

  string(x): ByteArray;

  boolean(x): ByteArray;
}

interface Encode {
  (term: any): Buffer;

  Encoder: Encoder;

  optlist_to_term(opts: any[]): any[];

  optlist_to_binary(opts: any[]): Buffer;
}

declare class Decoder {
  constructor(bin: ArrayBuffer)

  decode(): any;

  SMALL_INTEGER(): any;

  INTEGER(): any;

  STRING(): any;

  ATOM(): any;

  LIST(): any;

  LARGE_TUPLE(): any;

  SMALL_TUPLE(): any;

  BINARY(): any;
}

interface Decode {
  (term: Buffer): any;

  Decoder: Decoder
}

interface IOList {
  to_buffer(list): Buffer

  size(list): number;
}

declare let encode: Encode;
declare let decode: Decode;
declare let iolist: IOList;

export function term_to_binary(term: any): Buffer;

export function optlist_to_term(opts: any[]): any[];

export function optlist_to_binary(opts: any[]): Buffer;


export function binary_to_term(term: Buffer): any;


export function iolist_to_binary(list): Buffer;

export function iolist_to_buffer(list): Buffer;

export function iolist_size(list): number;

export function blob_to_term(blob: Blob): Promise<any>;
