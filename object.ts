export const map_optlist_tag = "map_optlist";
export const map_list_tag = "map_list";
import * as util from "util";

export type format = "tagged_optlist" | "optlist" | "list" ;
const default_format: format = "tagged_optlist";

const map_object = x => {
  return typeof x === "object" && x !== null && !Array.isArray(x)
    ? object_to_optlist(x)
    : Array.isArray(x)
      ? x.map(x => map_object(x))
      : x;
};

export function getTupleArray(term): any[] {
  if (!term) {
    throw new TypeError("argument is not tuple: " + util.inspect(term));
  }
  const xs = term.t || term.tuple;
  if (Array.isArray(xs)) {
    return xs;
  }
  throw new TypeError("argument is not tuple: " + util.inspect(term));
}

/**
 * object -> optlist
 * */
export function object_to_optlist(o: any, format: format = default_format): any {
  switch (format) {
    case "tagged_optlist":
    case "optlist": {
      const vs = Object.keys(o)
        .map(x => ({t: [x, map_object(o[x])]}));
      return format === "tagged_optlist"
        ? {t: [map_optlist_tag, vs]}
        : vs;
    }
    case "list": {
      const vs = [];
      Object.keys(o)
        .forEach(x => vs.push(x, o[x]));
      return {t: [map_list_tag, vs]};
    }
    default:
      throw new TypeError("unsupported format: " + util.inspect(format));
  }
}

/**
 * optlist -> object
 * */
export function optlist_to_object(term: [any, any], format: format = default_format): any {
  if (!term) {
    throw new TypeError("unsupported term: " + util.inspect(term));
  }
  switch (format) {
    case "tagged_optlist":
    case "optlist": {
      if (format === "tagged_optlist") {
        if (term.length !== 2) {
          throw new Error("term should be tuple of 2 elements: " + util.inspect(term));
        }
        term = term[1];
      }
      const o = {};
      term.forEach(tuple => {
        const xs = getTupleArray(tuple);
        if (xs.length !== 2) {
          throw new Error("tuple should be size of 2: " + util.inspect(tuple));
        }
        o[xs[0]] = xs[1];
      });
      return o;
    }
    case "list": {
      const o = {};
      if (term.length % 2 !== 0) {
        throw new Error("invalid list, should be even number of element: " + util.inspect(term));
      }
      for (let i = 0; i < term.length; i += 2) {
        o[term[i]] = term[i + 1];
      }
      return o;
    }
    default:
      throw new TypeError("unsupported format: " + util.inspect(format));
  }
}
