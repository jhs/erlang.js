export const map_optlist_tag = 'map_optlist';

const map_object = x => {
  return typeof x === "object" && x !== null && !Array.isArray(x)
    ? object_to_optlist(x)
    : Array.isArray(x)
      ? x.map(x => map_object(x))
      : x;
};

/**
 * object -> optlist
 * */
export function object_to_optlist(o: any): any {
  const vs = Object.keys(o)
    .map(x => ({t: [x, map_object(o[x])]}));
  return {t: [map_optlist_tag, vs]};
}

/**
 * optlist -> object
 * */
export function optlist_to_object(term: [any, any]): any {
  if (!term) {
    throw new TypeError("argument should be a tuple");
  }
  if (!Array.isArray(term) || term.length !== 2) {
    throw new TypeError("argument should be a tuple");
  }
  if (term[0] !== map_optlist_tag || !Array.isArray(term[1])) {
    throw new TypeError("argument should be optlist");
  }
  const vs = term[1];
  const o = {} as any;
  vs.forEach(tuple => o[tuple.t[0]] = tuple.t[1]);
  return o;
}
