// Formatting helpers shared by the problem generators.

import { T } from './expr.js';

export { T };

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function reduce(n, d) {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return [n / g, d / g];
}

// Plain text fraction that the answer checker can read, such as -3/4.
export function fracStr(n, d = 1) {
  const [p, q] = reduce(n, d);
  return q === 1 ? String(p) : `${p}/${q}`;
}

export function fracTex(n, d = 1) {
  const [p, q] = reduce(n, d);
  if (q === 1) return String(p);
  return `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`;
}

// Round to dp decimals and drop trailing zeros.
export function round(v, dp = 2) {
  const f = 10 ** dp;
  return Math.round((v + Number.EPSILON * Math.sign(v)) * f) / f;
}

export function fixed(v, dp = 2) {
  return round(v, dp).toFixed(dp);
}

export function commas(v) {
  const [whole, dec] = String(v).split('.');
  const w = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${w}.${dec}` : w;
}

// Polynomial with coefficients in descending order as a plain string, such as 2x^2-3x+1.
export function polyStr(coefs, v = 'x') {
  const n = coefs.length - 1;
  let out = '';
  coefs.forEach((c, i) => {
    if (c === 0) return;
    const p = n - i;
    const mag = Math.abs(c);
    const sign = c < 0 ? '-' : out ? '+' : '';
    let body;
    if (p === 0) body = String(mag);
    else {
      const vp = p === 1 ? v : `${v}^${p}`;
      body = mag === 1 ? vp : `${mag}${vp}`;
    }
    out += sign + body;
  });
  return out || '0';
}

export const polyTex = (coefs, v = 'x') => T(polyStr(coefs, v), [v]);

export function polyEval(coefs, x) {
  return coefs.reduce((acc, c) => acc * x + c, 0);
}

export function polyMul(a, b) {
  const out = new Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] += x * y)));
  return out;
}

export function polyAdd(a, b) {
  const n = Math.max(a.length, b.length);
  const pad = (p) => new Array(n - p.length).fill(0).concat(p);
  const A = pad(a);
  const B = pad(b);
  return A.map((x, i) => x + B[i]);
}

// Polynomial from its roots with leading coefficient k.
export function polyFromRoots(roots, k = 1) {
  return roots.reduce((acc, r) => polyMul(acc, [1, -r]), [k]);
}

// Factor (x - r) as a plain string: (x-3), (x+3), or x when r is 0.
export function factorStr(r, v = 'x') {
  if (r === 0) return v;
  return r > 0 ? `(${v}-${r})` : `(${v}+${-r})`;
}

// x shifted by h as a plain string without parentheses: x-3, x+3, or x.
export function shiftStr(h, v = 'x') {
  if (h === 0) return v;
  return h > 0 ? `${v}-${h}` : `${v}+${-h}`;
}

export function signed(n) {
  return n < 0 ? `-${-n}` : `+${n}`;
}

// Appends a constant: withConst('2x', -3) gives 2x-3, and adding 0 leaves it unchanged.
export function plus(str, c) {
  if (c === 0) return str;
  return `${str}${signed(c)}`;
}

// Coefficient times something: coef(1,'x')='x', coef(-1,'x')='-x', coef(3,'x')='3x'.
export function coef(c, body) {
  if (c === 1) return body;
  if (c === -1) return `-${body}`;
  return `${c}${body}`;
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---------- HTML helpers ----------

// Horizontal table in the style used on AP exams: one row of inputs, one row of outputs.
export function htable(xLabel, xs, yLabel, ys) {
  const cell = (v) => `<td>${typeof v === 'number' ? `$${v}$` : v}</td>`;
  return (
    `<div class="table-wrap"><table class="dm-table"><tbody>` +
    `<tr><th>${xLabel}</th>${xs.map(cell).join('')}</tr>` +
    `<tr><th>${yLabel}</th>${ys.map(cell).join('')}</tr>` +
    `</tbody></table></div>`
  );
}

// Multiple row table with a header row.
export function table(head, rows) {
  const cell = (v) => `<td>${typeof v === 'number' ? `$${v}$` : v}</td>`;
  return (
    `<div class="table-wrap"><table class="dm-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody></table></div>`
  );
}

// ---------- answer part constructors ----------

export function num(value, opts = {}) {
  return { type: 'number', value, ans: opts.ans ?? String(value), ...opts };
}

// Exact rational answer n/d.
export function numFrac(n, d, opts = {}) {
  const [p, q] = reduce(n, d);
  return { type: 'number', value: p / q, ans: fracStr(p, q), ...opts };
}

export function expr(value, opts = {}) {
  return { type: 'expr', value, ans: value, vars: ['x'], ...opts };
}

export function interval(value, opts = {}) {
  return { type: 'interval', value, ans: value, ...opts };
}

export function set(values, opts = {}) {
  return { type: 'set', values, ans: opts.ans ?? (values.length ? values.join(', ') : 'none'), ...opts };
}

export function point(x, y, opts = {}) {
  return { type: 'point', value: [x, y], ans: opts.ans ?? `(${x}, ${y})`, ...opts };
}

// Multiple choice with shuffled options. Duplicate distractors are removed.
export function mc(rng, correct, wrongs, opts = {}) {
  const seen = new Set([correct]);
  const uniq = [];
  for (const w of wrongs) {
    if (!seen.has(w)) {
      seen.add(w);
      uniq.push(w);
    }
  }
  const all = rng.shuffle([correct, ...uniq.slice(0, opts.max ?? 3)]);
  return { type: 'choice', choices: all, correct: all.indexOf(correct), ...opts };
}

// Multiple choice with a fixed option order.
export function mcFixed(choices, correctIndex, opts = {}) {
  return { type: 'choice', choices, correct: correctIndex, ...opts };
}
