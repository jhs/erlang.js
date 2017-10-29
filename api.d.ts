type Buffer = Uint8Array | ArrayBuffer;
type ByteArray = any[]

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

interface encode {
    (term): Buffer;

    Encoder: Encoder;

    optlist_to_term(opts): any[];

    optlist_to_binary(opts): Buffer;
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

interface decode {
    (term): any;

    Decoder: Decoder
}

interface iolist {
    to_buffer(list): Buffer

    size(list): number;
}

declare let encode: encode;
declare let decode: decode;
declare let iolist: iolist;

export default {
    term_to_binary: encode
    , optlist_to_term: encode.optlist_to_term
    , optlist_to_binary: encode.optlist_to_binary

    , binary_to_term: decode

    , iolist_to_binary: iolist.to_buffer
    , iolist_to_buffer: iolist.to_buffer
    , iolist_size: iolist.size
}

