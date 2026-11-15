// Answer checking for every answer type used by the problem generators.
// Each checker returns { ok, msg?, invalid? }.
// invalid means the input could not be read, so it should not count as an attempt.

import { parse, evaluate, variablesOf, normalize, toTex } from './expr.js';

const UNREADABLE = 'Could not read your answer. Check your symbols and parentheses.';

function stripEquals(raw) {
  const s = String(raw);
  const idx = s.lastIndexOf('=');
  return idx >= 0 ? s.slice(idx + 1) : s;
}

function close(a, b, tol) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
  return Math.abs(a - b) <= tol;
}

function cleanNumber(raw) {
  return String(raw)
    .trim()
    .replace(/^\$\s*/, '')
    .replace(/^(-)\s*\$\s*/, '$1')
    .replace(/\s*%$/, '')
    .replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
}

function numericValue(raw) {
  const ast = parse(cleanNumber(stripEquals(raw)));
  if (variablesOf(ast).size) throw new Error('Your answer should be a number.');
  const v = evaluate(ast);
  if (Number.isNaN(v)) throw new Error('That expression is undefined.');
  return v;
}

function defaultTol(value) {
  return 1e-6 * Math.max(1, Math.abs(value));
}

function checkNumber(part, raw) {
  let v;
  try {
    v = numericValue(raw);
  } catch (err) {
    return { ok: false, invalid: true, msg: err.message.startsWith('Your') ? err.message : UNREADABLE };
  }
  const tol = part.tol ?? defaultTol(part.value);
  if (close(v, part.value, tol)) return { ok: true };
  const diff = Math.abs(v - part.value);
  if (part.tol == null) {
    // a rounded decimal typed for an exact non-integer answer, such as 0.33 for 1/3
    const typedDecimal = /\d\.\d/.test(String(raw));
    if (typedDecimal && !Number.isInteger(part.value) && diff <= 0.006 * Math.max(1, Math.abs(part.value))) {
      return { ok: false, msg: 'Close, but this answer must be exact. Use a fraction instead of a rounded decimal.' };
    }
    return { ok: false };
  }
  if (diff <= part.tol * 10 && part.value !== 0) return { ok: false, msg: 'Close. Check your rounding.' };
  return { ok: false };
}

const DEFAULT_POINTS = [-2.61, -1.37, -0.58, 0.43, 0.91, 1.73, 2.29, 3.17];

function samplePoints(part) {
  if (part.points) return part.points;
  if (part.domain) {
    const [lo, hi] = part.domain;
    const fr = [0.07, 0.19, 0.31, 0.44, 0.58, 0.69, 0.83, 0.94];
    return fr.map((f) => lo + f * (hi - lo));
  }
  return DEFAULT_POINTS;
}

function checkExpr(part, raw) {
  const vars = part.vars || ['x'];
  let ast;
  try {
    ast = parse(stripEquals(raw), vars);
  } catch {
    return { ok: false, invalid: true, msg: UNREADABLE };
  }
  const used = [...variablesOf(ast)];
  const stray = used.filter((u) => !vars.includes(u));
  if (stray.length) {
    return { ok: false, invalid: true, msg: `Use only the variable ${vars.join(', ')} in your answer.` };
  }
  const expected = parse(part.value, vars);
  const pts = samplePoints(part);
  let compared = 0;
  for (let i = 0; i < pts.length; i++) {
    const scope = {};
    vars.forEach((name, j) => {
      scope[name] = pts[(i + j * 3) % pts.length];
    });
    let want;
    let got;
    try {
      want = evaluate(expected, scope);
      got = evaluate(ast, scope);
    } catch {
      return { ok: false, invalid: true, msg: UNREADABLE };
    }
    if (!Number.isFinite(want)) continue;
    compared++;
    if (!Number.isFinite(got)) return { ok: false };
    if (Math.abs(want - got) > 1e-6 * Math.max(1, Math.abs(want))) return { ok: false };
  }
  if (compared < 3) return { ok: false };
  if (part.form) {
    const complaint = part.form(ast, normalize(stripEquals(raw)));
    if (complaint) return { ok: false, msg: complaint };
  }
  return { ok: true };
}

// ---------- intervals ----------

function parseBound(text) {
  const s = normalize(text).toLowerCase().replace(/\s+/g, '');
  if (/^\+?(inf|infinity|oo)$/.test(s)) return Infinity;
  if (/^-(inf|infinity|oo)$/.test(s)) return -Infinity;
  return numericValue(s);
}

export function parseIntervals(raw) {
  let s = String(raw)
    .replace(/[−–—]/g, '-')
    .replace(/∞/g, 'inf')
    .replace(/∪/g, 'U')
    .trim();
  if (!s) throw new Error('empty');
  const lower = s.toLowerCase().replace(/\s+/g, ' ');
  if (['all real numbers', 'all reals', 'r', 'reals', 'all real'].includes(lower)) {
    return [{ lo: -Infinity, hi: Infinity, loC: false, hiC: false }];
  }
  if (['none', 'no interval', 'never', 'empty', 'dne'].includes(lower)) return [];
  s = s.replace(/\bor\b/gi, 'U').replace(/\band\b/gi, 'U');
  const pieces = s.split(/[Uu]/).map((p) => p.trim()).filter(Boolean);
  const out = [];
  for (const p of pieces) {
    const m = p.match(/^([\[(])(.+),(.+)([\])])$/s);
    if (!m) throw new Error('format');
    const lo = parseBound(m[2]);
    const hi = parseBound(m[3]);
    if (!(lo < hi)) throw new Error('order');
    out.push({
      lo,
      hi,
      loC: m[1] === '[' && Number.isFinite(lo),
      hiC: m[4] === ']' && Number.isFinite(hi),
      loRaw: m[1],
      hiRaw: m[4],
    });
  }
  out.sort((a, b) => a.lo - b.lo);
  return out;
}

function checkInterval(part, raw) {
  let got;
  let want;
  try {
    got = parseIntervals(raw);
  } catch {
    return {
      ok: false,
      invalid: true,
      msg: 'Use interval notation, for example (-inf, 2] U (5, inf).',
    };
  }
  want = parseIntervals(part.value);
  for (const g of got) {
    if ((g.loRaw === '[' && !Number.isFinite(g.lo)) || (g.hiRaw === ']' && !Number.isFinite(g.hi))) {
      return { ok: false, msg: 'Infinity is never included, so it always gets a parenthesis.' };
    }
  }
  if (got.length !== want.length) return { ok: false };
  let bracketOnly = false;
  for (let i = 0; i < want.length; i++) {
    const tolLo = Number.isFinite(want[i].lo) ? (part.tol ?? defaultTol(want[i].lo)) : 0;
    const tolHi = Number.isFinite(want[i].hi) ? (part.tol ?? defaultTol(want[i].hi)) : 0;
    if (!close(got[i].lo, want[i].lo, tolLo) || !close(got[i].hi, want[i].hi, tolHi)) return { ok: false };
    if (!part.flex && (got[i].loC !== want[i].loC || got[i].hiC !== want[i].hiC)) bracketOnly = true;
  }
  if (bracketOnly) {
    return { ok: false, msg: 'Your endpoints are right. Check which ones should be included.' };
  }
  return { ok: true };
}

// ---------- lists, sets, points ----------

function splitTopLevel(text) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '(' || ch === '{') depth++;
    if (ch === ')' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((p) => p.trim());
}

function checkSet(part, raw) {
  let s = String(raw).trim();
  const lower = s.toLowerCase();
  const saysNone = ['none', 'no solution', 'no solutions', 'dne', 'no real solutions', 'no real zeros'].includes(lower);
  if (saysNone) return { ok: part.values.length === 0 };
  s = s.replace(/^[a-z]\s*=/i, '').replace(/^\{(.*)\}$/s, '$1');
  s = s.replace(/\bor\b|\band\b/gi, ',');
  let vals;
  if (/\d\s+-?\d/.test(s)) {
    return { ok: false, invalid: true, msg: 'Separate your values with commas, for example -2, 3.' };
  }
  try {
    vals = splitTopLevel(s).map((piece) => numericValue(piece.replace(/^[a-z]\s*=/i, '')));
  } catch {
    return { ok: false, invalid: true, msg: 'Enter your values separated by commas, for example -2, 3.' };
  }
  const want = part.values.slice();
  const uniq = [];
  for (const v of vals) if (!uniq.some((u) => close(u, v, 1e-9))) uniq.push(v);
  const tolOf = (w) => part.tol ?? defaultTol(w);
  const allFound = want.every((w) => uniq.some((u) => close(u, w, tolOf(w))));
  const noExtra = uniq.every((u) => want.some((w) => close(u, w, tolOf(w))));
  if (allFound && noExtra) return { ok: true };
  if (noExtra && uniq.length < want.length && uniq.length > 0) {
    return { ok: false, msg: 'Every value you listed is correct, but you are missing at least one.' };
  }
  if (allFound && !noExtra) {
    return { ok: false, msg: 'You have every correct value, but at least one extra value does not belong.' };
  }
  return { ok: false };
}

function checkPoint(part, raw) {
  const s = String(raw).trim().replace(/^[a-z]\s*=/i, '').trim();
  const m = s.match(/^\(?(.*?)\)?$/s);
  let vals;
  try {
    const inner = s.startsWith('(') && s.endsWith(')') ? s.slice(1, -1) : m[1];
    vals = splitTopLevel(inner).map(numericValue);
  } catch {
    return { ok: false, invalid: true, msg: 'Enter an ordered pair such as (2, -5).' };
  }
  if (vals.length !== 2) return { ok: false, invalid: true, msg: 'Enter an ordered pair such as (2, -5).' };
  const tol = (w) => part.tol ?? defaultTol(w);
  const ok = close(vals[0], part.value[0], tol(part.value[0])) && close(vals[1], part.value[1], tol(part.value[1]));
  if (!ok && close(vals[0], part.value[1], tol(part.value[1])) && close(vals[1], part.value[0], tol(part.value[0]))) {
    return { ok: false, msg: 'Check the order of your coordinates.' };
  }
  return { ok };
}

function checkChoice(part, raw) {
  if (raw === '' || raw == null) return { ok: false, invalid: true, msg: 'Select an answer.' };
  return { ok: Number(raw) === part.correct };
}

function checkCustom(part, raw) {
  let ast;
  const vars = part.vars || ['x'];
  try {
    ast = parse(stripEquals(raw), vars);
    const stray = [...variablesOf(ast)].filter((u) => !vars.includes(u));
    if (stray.length) throw new Error('vars');
  } catch {
    return { ok: false, invalid: true, msg: UNREADABLE };
  }
  const f = (x) => {
    try {
      return evaluate(ast, { [vars[0]]: x });
    } catch {
      return NaN;
    }
  };
  const result = part.check(f, ast);
  return result === true ? { ok: true } : { ok: false, msg: typeof result === 'string' ? result : undefined };
}

export function checkPart(part, raw) {
  if (part.type !== 'choice' && String(raw ?? '').trim() === '') {
    return { ok: false, invalid: true, msg: 'Enter an answer first.' };
  }
  switch (part.type) {
    case 'number':
      return checkNumber(part, raw);
    case 'expr':
      return checkExpr(part, raw);
    case 'interval':
      return checkInterval(part, raw);
    case 'set':
      return checkSet(part, raw);
    case 'point':
      return checkPoint(part, raw);
    case 'choice':
      return checkChoice(part, raw);
    case 'custom':
      return checkCustom(part, raw);
    default:
      throw new Error(`Unknown answer type ${part.type}`);
  }
}

// Checks all parts. Returns { status: 'correct' | 'incorrect' | 'invalid', results, msg }.
export function checkProblem(problem, inputs) {
  const results = problem.parts.map((part, i) => checkPart(part, inputs[i]));
  const invalid = results.find((r) => r.invalid);
  if (invalid) return { status: 'invalid', results, msg: invalid.msg };
  const allOk = results.every((r) => r.ok);
  const msg = results.map((r) => r.msg).find(Boolean);
  return { status: allOk ? 'correct' : 'incorrect', results, msg };
}

// TeX for the accepted answer of one part, used by the Show Answer button.
export function answerTex(part) {
  if (part.ansTex) return part.ansTex;
  switch (part.type) {
    case 'choice':
      return null; // the choice text itself is shown
    case 'interval':
      return String(part.ans)
        .replace(/-inf/g, '-\\infty')
        .replace(/inf/g, '\\infty')
        .replace(/\s*U\s*/g, '\\cup ');
    case 'point':
      return `\\left(${part.ans.replace(/^\(|\)$/g, '').split(',').map((p) => safeTex(p)).join(',\\ ')}\\right)`;
    case 'set':
      return part.values.length ? splitTopLevel(String(part.ans)).map(safeTex).join(',\\ ') : '\\text{none}';
    default:
      return safeTex(part.ans, part.vars);
  }
}

function safeTex(str, vars = ['x']) {
  try {
    return toTex(parse(String(str), vars));
  } catch {
    return `\\text{${String(str)}}`;
  }
}
