// Small seeded random number generator so problems can be reproduced from a seed.

export function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function makeRng(seed) {
  let a = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = (arr) => arr[Math.floor(next() * arr.length)];
  const shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return {
    next,
    int,
    pick,
    shuffle,
    bool: (p = 0.5) => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
    // nonzero integer in [lo, hi]
    nz(lo, hi) {
      let v = 0;
      while (v === 0) v = int(lo, hi);
      return v;
    },
    // integer in [lo, hi] that is not in the excluded list
    intExcept(lo, hi, excluded) {
      let v = int(lo, hi);
      let guard = 0;
      while (excluded.includes(v) && guard++ < 200) v = int(lo, hi);
      return v;
    },
    // n distinct integers in [lo, hi], sorted ascending
    distinct(n, lo, hi) {
      const pool = [];
      for (let v = lo; v <= hi; v++) pool.push(v);
      return shuffle(pool).slice(0, n).sort((x, y) => x - y);
    },
    sample: (arr, n) => shuffle(arr).slice(0, n),
  };
}

export function randomSeed() {
  return (Math.random() * 4294967296) >>> 0;
}
