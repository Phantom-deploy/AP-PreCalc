// Unit 2: Polynomial and Rational Functions (Lessons 2.1 to 2.6)

import {
  T, polyStr, polyEval, polyMul, polyAdd, polyFromRoots, fracStr, fracTex, reduce, htable, num, numFrac, expr, interval, set, point,
  mc, mcFixed, factorStr, shiftStr, plus, coef,
} from '../lib/fmt.js';
import { fnOf } from '../lib/expr.js';
import { plot } from '../lib/graph.js';

// Polynomial k(x - r1)(x - r2)... scaled so its humps fit in the graph window.
export function scaledPoly(roots, sign = 1, target = 6) {
  const raw = (x) => roots.reduce((acc, r) => acc * (x - r), 1);
  const lo = Math.min(...roots);
  const hi = Math.max(...roots);
  let mx = 0;
  for (let x = lo; x <= hi; x += 0.02) mx = Math.max(mx, Math.abs(raw(x)));
  const k = (sign * target) / (mx || 1);
  return (x) => k * raw(x);
}

// Terms [[coefficient, power], ...] written in the order given.
function termsStr(terms, v = 'x') {
  let out = '';
  for (const [c, p] of terms) {
    if (c === 0) continue;
    const mag = Math.abs(c);
    const body = p === 0 ? String(mag) : (mag === 1 ? '' : mag) + (p === 1 ? v : `${v}^${p}`);
    out += (c < 0 ? '-' : out ? '+' : '') + body;
  }
  return out;
}

// Random polynomial as terms, optionally scrambled so the leading term is not first.
function randomPolyTerms(rng, degree, scramble) {
  let terms = [[rng.nz(-6, 6), degree]];
  for (let p = degree - 1; p >= 0; p--) if (rng.bool(0.65)) terms.push([rng.nz(-9, 9), p]);
  if (terms.length === 1) terms.push([rng.nz(-9, 9), 0]);
  if (scramble) {
    const lead = terms[0];
    const rest = rng.shuffle(terms.slice(1));
    const at = rng.int(1, rest.length);
    terms = [...rest.slice(0, at), lead, ...rest.slice(at)];
  }
  return terms;
}

const LIM = (dir, val) => `\\displaystyle\\lim_{x\\to${dir < 0 ? '-' : ''}\\infty}f(x)=${val < 0 ? '-' : ''}\\infty`;

// ---------- Lesson 2.1 ----------

const degreeLeading = {
  id: 'degree-and-leading-coefficient',
  lesson: '2.1',
  title: 'Degree and Leading Coefficient',
  gen(rng, level) {
    let str;
    let degree;
    let lead;
    if (level < 2) {
      degree = rng.int(2, level === 0 ? 4 : 6);
      const terms = randomPolyTerms(rng, degree, level === 1);
      lead = terms.find((t) => t[1] === degree)[0];
      str = termsStr(terms);
    } else {
      const k = rng.nz(-4, 4);
      const xp = rng.int(0, 2);
      const a = rng.int(2, 4);
      const r1 = rng.nz(-5, 5);
      const r2 = rng.nz(-5, 5);
      const m2 = rng.int(1, 3);
      str = `${coef(k, xp === 0 ? '' : xp === 1 ? 'x' : `x^${xp}`)}${factorStr(r1)}(${plus(`${a}x`, r2)})${m2 > 1 ? `^${m2}` : ''}`;
      if (xp === 0 && Math.abs(k) === 1) str = `${k < 0 ? '-' : ''}${factorStr(r1)}(${plus(`${a}x`, r2)})${m2 > 1 ? `^${m2}` : ''}`;
      degree = xp + 1 + m2;
      lead = k * a ** m2;
    }
    return {
      prompt: `State the degree and the leading coefficient of the polynomial function.\n\n$$p(x)=${T(str)}$$`,
      parts: [num(degree, { label: 'Degree:' }), num(lead, { label: 'Leading coefficient:' })],
      hint:
        level === 2
          ? 'You do not need to multiply everything out. Track only the highest power of $x$ that each factor contributes, and its coefficient.'
          : 'The leading term is the one with the highest power of $x$, wherever it appears in the expression.',
    };
  },
};

const degreeFromDifferences = {
  id: 'degree-from-differences',
  lesson: '2.1',
  title: 'Degree of a Polynomial from a Table',
  gen(rng, level) {
    const degree = rng.pick([[1, 2], [2, 3], [3, 4]][level]);
    const c = [rng.pick([-2, -1, 1, 2])];
    for (let i = 0; i < degree; i++) c.push(rng.int(-4, 4));
    if (degree === 4) c[0] = rng.pick([-1, 1]);
    const n = degree + 3;
    const x0 = -Math.floor(n / 2);
    const xs = Array.from({ length: n }, (_, i) => x0 + i);
    const ys = xs.map((x) => polyEval(c, x));
    return {
      prompt: `The table shows values of a polynomial function $p$ at equally spaced inputs.\n\n${htable('$x$', xs, '$p(x)$', ys)}\n\nBased on successive differences of the outputs, what is the degree of $p$?`,
      parts: [num(degree, { label: 'Degree:' })],
      hint: 'Take differences of the outputs, then differences of those differences, and keep going. Count how many rounds it takes to reach a constant row.',
    };
  },
};

const turningPoints = {
  id: 'turning-points-and-degree',
  lesson: '2.1',
  title: 'Turning Points and Degree',
  gen(rng, level) {
    if (level === 0) {
      const n = rng.int(3, 9);
      if (rng.bool()) {
        return {
          prompt: `What is the greatest number of relative extrema (turning points) that a polynomial function of degree $${n}$ can have?`,
          parts: [num(n - 1)],
          hint: 'Think about simple cases: how many turning points can a parabola (degree 2) have? A cubic (degree 3)? Extend the pattern.',
        };
      }
      return {
        prompt: `The graph of a polynomial function has exactly $${n - 1}$ relative extrema (turning points). What is the least possible degree of the polynomial?`,
        parts: [num(n)],
        hint: 'Think about simple cases: a parabola (degree 2) turns once. Each extra turn needs at least one more degree.',
      };
    }
    const n = rng.int(3, 5);
    const roots = [];
    let r = rng.int(-6, -4);
    for (let i = 0; i < n; i++) {
      roots.push(r);
      r += rng.int(2, 3);
    }
    const shift = Math.round((roots[0] + roots[n - 1]) / 2);
    const rs = roots.map((v) => v - shift);
    const sign = rng.sign();
    const f = scaledPoly(rs, sign, 5);
    const fig = plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }] });
    if (level === 1) {
      return {
        prompt: `The complete graph of a polynomial function $p$ is shown. Its end behavior continues beyond the window.\n\n${fig}\n\nHow many relative extrema does $p$ have, and what is the least possible degree of $p$?`,
        parts: [num(n - 1, { label: 'Number of relative extrema:' }), num(n, { label: 'Least possible degree:' })],
        hint: 'Count each hilltop and each valley. The degree must be at least one more than the number of turning points.',
      };
    }
    const rightUp = sign > 0;
    return {
      prompt: `The complete graph of a polynomial function $p$ is shown. Its end behavior continues beyond the window.\n\n${fig}\n\nFind the least possible degree of $p$ and the sign of its leading coefficient.`,
      parts: [
        num(n, { label: 'Least possible degree:' }),
        mcFixed(['Positive', 'Negative'], rightUp ? 0 : 1, { label: 'Leading coefficient:' }),
      ],
      hint: 'Count the turning points to bound the degree. For the sign, look only at what the graph does at the far right.',
    };
  },
};

const globalExtrema = {
  id: 'global-extrema-of-polynomials',
  lesson: '2.1',
  title: 'Absolute Extrema of Polynomials',
  gen(rng, level) {
    const degree = level === 0 ? rng.pick([2, 4]) : rng.int(2, 7);
    let str;
    let lead;
    if (level < 2) {
      const terms = randomPolyTerms(rng, degree, level === 1);
      lead = terms.find((t) => t[1] === degree)[0];
      str = termsStr(terms);
    } else {
      const k = rng.nz(-3, 3);
      const m1 = rng.int(1, 3);
      const m2 = rng.int(1, 3);
      const r1 = rng.nz(-5, 5);
      const r2 = rng.intExcept(-5, 5, [0, r1]);
      const pow = (m) => (m > 1 ? `^${m}` : '');
      str = `${k === 1 ? '' : k === -1 ? '-' : k}${factorStr(r1)}${pow(m1)}${factorStr(r2)}${pow(m2)}`;
      lead = k;
      return finish(m1 + m2);
    }
    return finish(degree);

    function finish(deg) {
      const options = ['$p$ has an absolute minimum but no absolute maximum', '$p$ has an absolute maximum but no absolute minimum', '$p$ has neither an absolute maximum nor an absolute minimum'];
      const idx = deg % 2 === 1 ? 2 : lead > 0 ? 0 : 1;
      return {
        prompt: `Consider the polynomial function below, defined for all real numbers.\n\n$$p(x)=${T(str)}$$\n\nWhich statement must be true?`,
        parts: [mcFixed(options, idx)],
        hint: 'Decide where both ends of the graph head. If both ends go the same way, the graph must have a lowest or a highest point.',
      };
    }
  },
};

// ---------- Lesson 2.2 ----------

const zerosFactored = {
  id: 'zeros-of-polynomials',
  lesson: '2.2',
  title: 'Zeros of Polynomial Functions',
  gen(rng, level) {
    let str;
    let zeros;
    let ansStr;
    if (level === 0) {
      const [a, b] = rng.sample([-7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7], 2);
      const k = rng.pick([1, 1, 2, 3, -1, -2]);
      str = `${k === 1 ? '' : k === -1 ? '-' : k}${factorStr(a)}${factorStr(b)}`;
      zeros = [a, b];
    } else if (level === 1) {
      const q = rng.pick([2, 3, 4, 5]);
      const p = rng.pick([1, 3, 5, 7].filter((v) => v % q !== 0 && (q !== 4 || v % 2))) * rng.sign();
      const [pp, qq] = reduce(p, q);
      const r = rng.nz(-6, 6);
      const withX = rng.bool();
      str = `${withX ? 'x' : ''}(${plus(`${qq}x`, -pp)})${factorStr(r)}^2`;
      zeros = [pp / qq, r, ...(withX ? [0] : [])];
      ansStr = [fracStr(pp, qq), r, ...(withX ? [0] : [])].join(', ');
    } else if (rng.bool()) {
      const [a, b] = rng.sample([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6], 2);
      str = polyStr([1, -(a + b), a * b, 0]);
      zeros = [0, a, b];
    } else {
      const [a, b] = rng.sample([1, 2, 3, 4, 5], 2);
      str = polyStr([1, 0, -(a * a + b * b), 0, a * a * b * b]);
      zeros = [a, -a, b, -b];
    }
    zeros = [...new Set(zeros)].sort((x, y) => x - y);
    return {
      prompt: `Find all real zeros of the polynomial function. Separate your answers with commas.\n\n$$f(x)=${T(str)}$$`,
      parts: [set(zeros, { label: '$x=$', ...(ansStr ? { ans: ansStr } : {}) })],
      hint:
        level === 2
          ? 'Factor first. Look for a common factor of $x$, or treat the expression as a quadratic in $x^2$.'
          : 'Set each factor equal to zero and solve. A repeated factor still gives just one zero.',
    };
  },
};

const multiplicity = {
  id: 'multiplicity-of-zeros',
  lesson: '2.2',
  title: 'Multiplicity and Graph Behavior',
  gen(rng, level) {
    const [a, b, c] = rng.sample([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5], 3);
    if (level === 0) {
      const m = rng.int(1, 4);
      const str = `${factorStr(a)}${m > 1 ? `^${m}` : ''}${factorStr(b)}`;
      return {
        prompt: `Consider $f(x)=${T(str)}$.\n\nWhat does the graph of $f$ do at $x=${a}$?`,
        parts: [mcFixed(['It crosses the $x$-axis', 'It touches the $x$-axis and turns around', 'It does not meet the $x$-axis'], m % 2 ? 0 : 1)],
        hint: `Find the multiplicity of the zero at $x=${a}$. Think about whether the factor changes sign as $x$ passes through ${a}.`,
      };
    }
    if (level === 1) {
      const ms = rng.shuffle([1, 2, 3]);
      const roots = [a, b, c];
      const str = roots.map((r, i) => `${factorStr(r)}${ms[i] > 1 ? `^${ms[i]}` : ''}`).join('');
      const crossing = roots.filter((_, i) => ms[i] % 2 === 1).sort((x, y) => x - y);
      return {
        prompt: `Consider $f(x)=${T(str)}$.\n\nList every zero at which the graph of $f$ <b>crosses</b> the $x$-axis. Separate your answers with commas.`,
        parts: [set(crossing, { label: '$x=$' })],
        hint: 'A factor raised to an even power never changes sign, so the graph only touches the axis there.',
      };
    }
    const [p, q] = [Math.min(a, b), Math.max(a, b)];
    const sign = rng.sign();
    const dbl = rng.bool() ? p : q; // which zero has multiplicity 2
    const sng = dbl === p ? q : p;
    const f = scaledPoly([dbl, dbl, sng], sign, 6);
    const lead = (s) => (s > 0 ? '' : '-');
    const eq = (s, d, o) => `$y=${T(`${lead(s)}${factorStr(d)}^2${factorStr(o)}`)}$`;
    return {
      prompt: `The graph of a polynomial function is shown.\n\n${plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }] })}\n\nWhich equation could represent the graph? (Each option may be stretched vertically by a positive constant.)`,
      parts: [mc(rng, eq(sign, dbl, sng), [eq(-sign, dbl, sng), eq(sign, sng, dbl), eq(-sign, sng, dbl)])],
      hint: 'First decide which zero the graph only touches. Then test the sign of each option at a convenient $x$-value or use end behavior.',
    };
  },
};

const evenOdd = {
  id: 'even-odd-or-neither',
  lesson: '2.2',
  title: 'Even and Odd Functions',
  gen(rng, level) {
    const a = rng.int(2, 9);
    const b = rng.int(1, 9);
    const c = rng.int(1, 9);
    const bank = [
      [
        [`${a}x^4-${b}x^2+${c}`, 0],
        [`x^6+${b}x^2`, 0],
        [`${a}x^3-${b}x`, 1],
        [`x^5+${a}x^3-${b}x`, 1],
        [`x^3+${b}x^2`, 2],
        [`${a}x^2-${b}x+${c}`, 2],
        [`-${a}x^2+${c}`, 0],
        [`${a}x^5`, 1],
      ],
      [
        [`x^3-${b}x+${c}`, 2],
        [`${a}|x|-${c}`, 0],
        [`x^4-${b}x`, 2],
        [`${a}/x`, 1],
        [`${a}/x^2`, 0],
        [`x^5-${b}x^3+${c}`, 2],
        [`-x^7+${a}x`, 1],
        [`${c}`, 0],
      ],
      [
        [`${a}x/(x^2+${c})`, 1],
        [`x^2/(x^4+${c})`, 0],
        [`x|x|`, 1],
        [`(x-${b})^2`, 2],
        [`(x^3-${b}x)/(x^2+${c})`, 1],
        [`x^3/(x^5-${a}x)`, 0],
        [`(x+${b})^3`, 2],
        [`|x|/(x^2+${c})`, 0],
        [`(x^2+${a})/(x^3)`, 1],
        [`x^2+${b}/x`, 2],
      ],
    ];
    const [str, idx] = rng.pick(bank[level]);
    return {
      prompt: `Is the function even, odd, or neither?\n\n$$f(x)=${T(str)}$$`,
      parts: [mcFixed(['Even', 'Odd', 'Neither'], idx)],
      hint: 'Replace $x$ with $-x$ and simplify. Compare the result with the original $f(x)$ and with $-f(x)$.',
    };
  },
};

const symmetryValues = {
  id: 'even-odd-function-values',
  lesson: '2.2',
  title: 'Using Even and Odd Symmetry',
  gen(rng, level) {
    const a = rng.int(2, 9);
    const p = rng.nz(-9, 9);
    const q = rng.nz(-9, 9);
    if (level === 0) {
      return {
        prompt: `The function $f$ is <b>even</b>, and $f(${a})=${p}$.\n\nFind $f(${-a})$.`,
        parts: [num(p, { label: `$f(${-a})=$` })],
        hint: 'The graph of an even function is a mirror image across the $y$-axis. What does that say about the heights at opposite inputs?',
      };
    }
    if (level === 1) {
      return {
        prompt: `The function $g$ is <b>odd</b>, and $g(${a})=${p}$.\n\nFind $g(${-a})$.`,
        parts: [num(-p, { label: `$g(${-a})=$` })],
        hint: 'An odd function has rotational symmetry about the origin: opposite inputs give opposite outputs.',
      };
    }
    const k = rng.int(2, 4);
    return {
      prompt: `The function $f$ is <b>even</b> and the function $g$ is <b>odd</b>. Given $f(${a})=${p}$ and $g(${a})=${q}$, find the value of\n\n$$${k}f(${-a})-g(${-a})$$`,
      parts: [num(k * p + q)],
      hint: 'Handle each function separately. Use the even rule for $f$ and the odd rule for $g$, then combine carefully with the signs.',
    };
  },
};

const complexZeros = {
  id: 'complex-zeros',
  lesson: '2.2',
  title: 'Complex Zeros of Polynomials',
  gen(rng, level) {
    const a = rng.nz(-6, 6);
    const b = rng.int(1, 6);
    const z = (re, im) => `$${re === 0 ? '' : re}${im < 0 ? '-' : re === 0 ? '' : '+'}${Math.abs(im) === 1 ? '' : Math.abs(im)}i$`;
    if (level === 0) {
      const n = rng.int(3, 9);
      return {
        prompt: `A polynomial function has degree $${n}$. Counting multiplicities, how many complex zeros (real or non-real) does it have in total?`,
        parts: [num(n)],
        hint: 'The Fundamental Theorem of Algebra connects the number of complex zeros directly to the degree.',
      };
    }
    if (level === 1) {
      return {
        prompt: `A polynomial function with <b>real coefficients</b> has ${z(a, b)} as a zero. Which of the following must also be a zero?`,
        parts: [mc(rng, z(a, -b), [z(-a, b), z(-a, -b), z(-b, a)])],
        hint: 'Non-real zeros of polynomials with real coefficients always come in conjugate pairs.',
      };
    }
    const k = rng.int(1, 2);
    const n = 2 * k + rng.int(1, 3);
    const givens = [z(a, b)];
    if (k === 2) givens.push(z(rng.intExcept(-6, 6, [a, 0]), -rng.int(1, 6)));
    return {
      prompt: `A polynomial function $p$ of degree $${n}$ has <b>real coefficients</b>. ${k === 1 ? 'One of its zeros is' : 'Two of its zeros are'} ${givens.join(' and ')}, and every zero not determined by that information is real.\n\nCounting multiplicities, how many real zeros does $p$ have?`,
      parts: [num(n - 2 * k)],
      hint: 'Each non-real zero brings its conjugate along. Count all the non-real zeros, then compare with the degree.',
    };
  },
};

// ---------- Lesson 2.3 ----------

const polyEndBehavior = {
  id: 'polynomial-end-behavior',
  lesson: '2.3',
  title: 'End Behavior of Polynomials',
  gen(rng, level) {
    let str;
    let degree;
    let lead;
    if (level < 2) {
      degree = rng.int(2, 6);
      const terms = randomPolyTerms(rng, degree, level === 1);
      lead = terms.find((t) => t[1] === degree)[0];
      str = termsStr(terms);
    } else {
      const k = rng.nz(-3, 3);
      const r1 = rng.nz(-5, 5);
      const r2 = rng.intExcept(-5, 5, [0, r1]);
      const m1 = rng.int(1, 3);
      const m2 = rng.int(1, 2);
      const flip = rng.bool();
      const pow = (m) => (m > 1 ? `^${m}` : '');
      // optionally write one factor as (r - x), which contributes a negative sign
      const f2 = flip ? `(${r2}-x)` : factorStr(r2);
      str = `${k === 1 ? '' : k === -1 ? '-' : k}${factorStr(r1)}${pow(m1)}${f2}${pow(m2)}`;
      degree = m1 + m2;
      lead = k * (flip ? (-1) ** m2 : 1);
    }
    const right = Math.sign(lead);
    const left = degree % 2 === 0 ? right : -right;
    const opt = (l, r) => `$${LIM(-1, l)}$ &nbsp;and&nbsp; $${LIM(1, r)}$`;
    const all = [opt(1, 1), opt(-1, 1), opt(1, -1), opt(-1, -1)];
    const idx = (left > 0 ? 0 : 1) + (right > 0 ? 0 : 2);
    return {
      prompt: `Describe the end behavior of the polynomial function.\n\n$$f(x)=${T(str)}$$`,
      parts: [mcFixed(all, idx)],
      hint: 'Only the leading term matters for end behavior. Check whether its degree is even or odd and whether its coefficient is positive or negative.',
    };
  },
};

function randPolyCoefs(rng, degree, lead) {
  const c = [lead];
  for (let i = 0; i < degree; i++) c.push(rng.int(-7, 7));
  return c;
}

const rationalEndBehavior = {
  id: 'rational-end-behavior',
  lesson: '2.3',
  title: 'End Behavior of Rational Functions',
  gen(rng, level) {
    const a = rng.nz(-8, 8);
    const b = rng.pick([2, 3, 4, 5, 7].filter((v) => Math.abs(a) !== v)) * rng.sign();
    if (level === 0) {
      const d = rng.int(1, 3);
      const str = `(${polyStr(randPolyCoefs(rng, d, a))})/(${polyStr(randPolyCoefs(rng, d, b))})`;
      return {
        prompt: `Find the horizontal asymptote of the graph of the rational function.\n\n$$f(x)=${T(str)}$$`,
        parts: [numFrac(a, b, { label: '$y=$' })],
        hint: 'When the numerator and denominator have the same degree, the outputs approach the ratio of the leading coefficients.',
      };
    }
    if (level === 1) {
      const dn = rng.int(1, 3);
      const dd = rng.int(1, 3);
      const str = `(${polyStr(randPolyCoefs(rng, dn, a))})/(${polyStr(randPolyCoefs(rng, dd, b))})`;
      const ratio = `$y=${fracTex(a, b)}$`;
      const options = ['$y=0$', ratio, `$y=${fracTex(b, a)}$`, 'There is no horizontal asymptote'];
      const correct = dn < dd ? options[0] : dn === dd ? ratio : options[3];
      const uniq = [...new Set(options)];
      return {
        prompt: `Which of the following describes the horizontal asymptote of the graph of the rational function?\n\n$$f(x)=${T(str)}$$`,
        parts: [mcFixed(uniq, uniq.indexOf(correct))],
        hint: 'Compare the degree of the numerator with the degree of the denominator. There are three different cases.',
      };
    }
    const dd = rng.int(1, 2);
    const extra = rng.int(1, 2);
    const str = `(${polyStr(randPolyCoefs(rng, dd + extra, a))})/(${polyStr(randPolyCoefs(rng, dd, b))})`;
    const dir = rng.sign();
    const sign = Math.sign(a / b) * (dir < 0 && extra % 2 === 1 ? -1 : 1);
    const options = ['$\\infty$', '$-\\infty$', '$0$', `$${fracTex(a, b)}$`];
    return {
      prompt: `Evaluate the limit for the rational function $f(x)=${T(str)}$.\n\n$$\\lim_{x\\to${dir < 0 ? '-' : ''}\\infty}f(x)$$`,
      parts: [mcFixed(options, sign > 0 ? 0 : 1)],
      hint: 'For large inputs the function behaves like the quotient of its leading terms. Simplify that quotient, then think about its sign for the given direction.',
    };
  },
};

const leadingTermQuotient = {
  id: 'quotient-of-leading-terms',
  lesson: '2.3',
  title: 'Quotient of Leading Terms',
  gen(rng, level) {
    const b = rng.pick([1, 2, 3, 4, 5]) * rng.sign();
    let a;
    let dn;
    let dd;
    if (level === 0) {
      a = b * rng.nz(-4, 4);
      dd = rng.int(1, 2);
      dn = dd + rng.int(1, 2);
    } else {
      a = rng.nz(-9, 9);
      dd = rng.int(1, 3);
      dn = rng.intExcept(1, 4, [dd]);
    }
    let str;
    if (level < 2) {
      str = `(${polyStr(randPolyCoefs(rng, dn, a))})/(${polyStr(randPolyCoefs(rng, dd, b))})`;
    } else {
      // factored: leading coefficients multiply
      const lin = (k) => `(${plus(coef(k, 'x'), rng.nz(-5, 5))})`;
      const split = (total, deg) => {
        let out = '';
        let prod = 1;
        for (let i = 0; i < deg; i++) {
          const k = i === 0 ? total : 1;
          out += lin(k);
          prod *= k;
        }
        return out;
      };
      str = `(${split(a, dn)})/(${split(b, dd)})`;
    }
    const [p, q] = reduce(a, b);
    const e = dn - dd;
    const xp = (n) => (n === 1 ? 'x' : `x^${n}`);
    let ans;
    if (e > 0) ans = q === 1 ? coef(p, xp(e)) : `(${p}/${q})${xp(e)}`;
    else ans = `${p}/(${coef(q, xp(-e))})`;
    return {
      prompt: `For inputs of large magnitude, the rational function below behaves like a simpler function: the quotient of its leading terms. Find that simplified quotient.\n\n$$f(x)=${T(str)}$$`,
      parts: [expr(ans, { label: '$f(x)\\approx$', domain: [1, 4] })],
      hint: 'Identify the leading term of the numerator and of the denominator, divide the coefficients, and subtract the exponents.',
    };
  },
};

// ---------- Lesson 2.4 ----------

// Builds a rational function from zeros, poles, and optional hole locations.
function rationalStr(zeros, poles, holes, expanded, k = 1) {
  const top = [...zeros, ...holes];
  const bot = [...poles, ...holes];
  const side = (roots, lead) => {
    if (!roots.length) return String(lead);
    if (expanded) return polyStr(polyFromRoots(roots, lead));
    return `${lead === 1 ? '' : lead === -1 ? '-' : lead}${roots.map((r) => factorStr(r)).join('')}`;
  };
  return `(${side(top, k)})/(${side(bot, 1)})`;
}

function pickRoots(rng, n) {
  return rng.sample([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6], n);
}

const verticalAsymptotes = {
  id: 'vertical-asymptotes',
  lesson: '2.4',
  title: 'Vertical Asymptotes',
  gen(rng, level) {
    const [z, p1, p2, h] = pickRoots(rng, 4);
    let str;
    let vas;
    if (level === 0) {
      str = `(${plus(coef(rng.nz(-4, 4), 'x'), rng.int(-6, 6))})/(${shiftStr(p1)})`;
      if (fnOf(str.split('/')[0])(p1) === 0) str = `${rng.int(1, 6)}/(${shiftStr(p1)})`;
      vas = [p1];
    } else if (level === 1) {
      str = rationalStr([z], [p1, p2], [], rng.bool());
      vas = [p1, p2];
    } else {
      str = rationalStr([z], [p1], [h], true);
      vas = [p1];
    }
    return {
      prompt: `Find the equation(s) of all vertical asymptotes of the graph of the rational function. Enter the $x$-values, separated by commas.\n\n$$f(x)=${T(str)}$$`,
      parts: [set(vas.sort((a, b) => a - b), { label: '$x=$' })],
      hint:
        level === 2
          ? 'Factor the numerator and the denominator completely. A factor that cancels creates a hole, not a vertical asymptote.'
          : 'Vertical asymptotes occur where the denominator is zero and the numerator is not.',
    };
  },
};

const zerosRational = {
  id: 'zeros-of-rational-functions',
  lesson: '2.4',
  title: 'Zeros of Rational Functions',
  gen(rng, level) {
    const [z1, z2, p1, h] = pickRoots(rng, 4);
    let str;
    let zeros;
    if (level === 0) {
      str = rationalStr([z1, z2], [p1], [], false);
      zeros = [z1, z2];
    } else if (level === 1) {
      str = `(${polyStr(polyFromRoots([z1, z2]))})/(${shiftStr(p1)})`;
      zeros = [z1, z2];
    } else {
      str = rationalStr([z1], [p1], [h], true);
      zeros = [z1];
    }
    return {
      prompt: `Find all real zeros of the rational function. Separate your answers with commas.\n\n$$f(x)=${T(str)}$$`,
      parts: [set(zeros.sort((a, b) => a - b), { label: '$x=$' })],
      hint:
        level === 2
          ? 'A zero of the numerator only counts if the function is actually defined there. Factor both parts and compare.'
          : 'A fraction equals zero only when its numerator is zero (and its denominator is not).',
    };
  },
};

const holes = {
  id: 'holes-of-rational-functions',
  lesson: '2.4',
  title: 'Holes in Rational Graphs',
  gen(rng, level) {
    const [z, p, h] = pickRoots(rng, 3);
    const str = rationalStr([z], [p], [h], level === 2);
    if (level === 0) {
      return {
        prompt: `The graph of the rational function has a hole. Find the $x$-coordinate of the hole.\n\n$$f(x)=${T(str)}$$`,
        parts: [num(h, { label: '$x=$' })],
        hint: 'A hole appears where a factor is shared by the numerator and the denominator.',
      };
    }
    return {
      prompt: `The graph of the rational function has a hole. Find the coordinates of the hole.\n\n$$f(x)=${T(str)}$$`,
      parts: [point(h, (h - z) / (h - p), { label: 'Hole:', ans: `(${h}, ${fracStr(h - z, h - p)})` })],
      hint: `${level === 2 ? 'Factor first. ' : ''}Cancel the shared factor, then evaluate the simplified expression at the $x$-value of the hole to find its height.`,
    };
  },
};

const rationalDomain = {
  id: 'domain-of-rational-functions',
  lesson: '2.4',
  title: 'Domain of Rational Functions',
  gen(rng, level) {
    const [z, p1, p2] = pickRoots(rng, 3);
    let str;
    let excluded;
    if (level === 0) {
      str = `(${plus(coef(rng.nz(-4, 4), 'x'), rng.int(-6, 6))})/(${shiftStr(p1)})`;
      excluded = [p1];
    } else if (level === 1) {
      str = rationalStr([z], [p1, p2], [], false);
      excluded = [p1, p2];
    } else {
      // one excluded value is a hole: it is still not in the domain
      str = rationalStr([z], [p1], [p2], true);
      excluded = [p1, p2];
    }
    excluded.sort((a, b) => a - b);
    const pieces = [`(-inf, ${excluded[0]})`];
    for (let i = 1; i < excluded.length; i++) pieces.push(`(${excluded[i - 1]}, ${excluded[i]})`);
    pieces.push(`(${excluded[excluded.length - 1]}, inf)`);
    return {
      prompt: `Find the domain of the rational function. Write your answer in interval notation, using $\\cup$ (type U) to join intervals.\n\n$$f(x)=${T(str)}$$`,
      parts: [interval(pieces.join(' U '), { label: 'Domain:' })],
      hint:
        level === 2
          ? 'Use the original (unsimplified) denominator. Every input that makes it zero is excluded, even if a factor later cancels.'
          : 'The only inputs excluded from the domain are the ones that make the denominator zero.',
    };
  },
};

// ---------- Lesson 2.5 ----------

const limitAtAsymptote = {
  id: 'limits-at-vertical-asymptotes',
  lesson: '2.5',
  title: 'Behavior Near Vertical Asymptotes',
  gen(rng, level) {
    const [a, b, c] = pickRoots(rng, 3);
    const k = rng.nz(-5, 5);
    let str;
    if (level === 0) str = `${k}/(${shiftStr(a)})`;
    else if (level === 1) str = rng.bool() ? `${factorStr(b)}/(${shiftStr(a)})` : `(${plus(coef(k, 'x'), -k * b)})/(${factorStr(a)}${factorStr(c)})`;
    else str = rng.bool() ? `${k}${factorStr(b)}/${factorStr(a)}^2` : `${k}${factorStr(b)}/(${factorStr(a)}(${c}-x))`;
    const side = rng.sign();
    const f = fnOf(str);
    const val = f(a + side * 1e-5);
    return {
      prompt: `Let $f(x)=${T(str)}$. Evaluate the one-sided limit.\n\n$$\\lim_{x\\to ${a}^{${side > 0 ? '+' : '-'}}}f(x)$$`,
      parts: [mcFixed(['$\\infty$', '$-\\infty$', '$0$', '$1$'], val > 0 ? 0 : 1)],
      hint: `Pick a number just barely ${side > 0 ? 'greater' : 'less'} than $${a}$ and work out the sign of each factor. You only need signs, not exact values.`,
    };
  },
};

const matchRationalGraph = {
  id: 'match-rational-graph',
  lesson: '2.5',
  title: 'Matching Rational Function Graphs',
  gen(rng, level) {
    const a = rng.nz(-4, 4);
    let correct;
    let wrongs;
    let hl;
    let vl;
    if (level === 0) {
      const k = rng.nz(-3, 3);
      const s = rng.sign();
      const make = (aa, kk, ss) => plus(`${ss}/(${shiftStr(aa)})`, kk);
      correct = make(a, k, s);
      wrongs = [make(-a, k, s), make(a, -k, s), make(-a, -k, s), make(a, k, -s)];
      hl = [k];
      vl = [a];
    } else if (level === 1) {
      const b = rng.intExcept(-5, 5, [a, 0, -a]);
      const c = rng.pick([1, 2, -1, -2]);
      const make = (zz, pp, cc) => `${cc === 1 ? '' : cc === -1 ? '-' : cc}${factorStr(zz)}/(${shiftStr(pp)})`;
      correct = make(b, a, c);
      wrongs = [make(a, b, c), make(-b, -a, c), make(b, a, -c), make(-b, a, c)];
      hl = [c];
      vl = [a];
    } else {
      const p2 = rng.intExcept(-5, 5, [a, 0, -a]);
      const z = rng.intExcept(-5, 5, [a, p2, 0, -a, -p2]);
      const s = rng.pick([2, 3, -2, -3]);
      const make = (zz, p, q, ss) => `${ss}${factorStr(zz)}/(${factorStr(p)}${factorStr(q)})`;
      correct = make(z, a, p2, s);
      wrongs = [make(z, -a, -p2, s), make(-z, a, p2, s), make(z, a, p2, -s), make(a, z, p2, s)];
      hl = [0];
      vl = [a, p2];
    }
    const f = fnOf(correct);
    const fig = plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], vlines: vl, hlines: hl });
    return {
      prompt: `The graph of a rational function is shown, with its asymptotes dashed.\n\n${fig}\n\nWhich function matches the graph?`,
      parts: [mc(rng, `$y=${T(correct)}$`, wrongs.map((w) => `$y=${T(w)}$`))],
      hint: 'Read the asymptotes and the $x$-intercept off the graph. Then check the sign of the function on one side of an asymptote to settle the rest.',
    };
  },
};

const rationalFeatures = {
  id: 'features-of-rational-functions',
  lesson: '2.5',
  title: 'Key Features of Rational Functions',
  gen(rng, level) {
    const [z1, p1, z2, p2] = pickRoots(rng, 4);
    const k = rng.pick([1, 2, 3, -1, -2]);
    if (level === 0) {
      const str = `(${plus(coef(k, 'x'), -k * z1)})/(${shiftStr(p1)})`;
      return {
        prompt: `Find the $y$-intercept of the graph of $f(x)=${T(str)}$.`,
        parts: [numFrac(k * z1, p1, { label: '$y=$' })],
        hint: 'The $y$-intercept is where the graph meets the $y$-axis. What is the input at every point on that axis?',
      };
    }
    if (level === 1) {
      const str = `(${plus(coef(k, 'x'), -k * z1)})/(${shiftStr(p1)})`;
      return {
        prompt: `For the rational function $f(x)=${T(str)}$, find each feature of its graph.`,
        parts: [
          num(z1, { label: '$x$-intercept: $x=$' }),
          num(p1, { label: 'Vertical asymptote: $x=$' }),
          num(k, { label: 'Horizontal asymptote: $y=$' }),
        ],
        hint: 'Zeros come from the numerator, vertical asymptotes from the denominator, and the horizontal asymptote from the ratio of leading coefficients.',
      };
    }
    const str = rationalStr([z1, z2], [p1, p2], [], false, k);
    return {
      prompt: `For the rational function below, find each feature of its graph. Separate multiple values with commas.\n\n$$f(x)=${T(str)}$$`,
      parts: [
        set([z1, z2].sort((a, b) => a - b), { label: '$x$-intercepts: $x=$' }),
        set([p1, p2].sort((a, b) => a - b), { label: 'Vertical asymptotes: $x=$' }),
        num(k, { label: 'Horizontal asymptote: $y=$' }),
        numFrac(k * z1 * z2, p1 * p2, { label: '$y$-intercept: $y=$' }),
      ],
      hint: 'Work through one feature at a time: numerator zeros, denominator zeros, leading coefficients, and finally the value at $x=0$.',
    };
  },
};

const buildRational = {
  id: 'build-a-rational-function',
  lesson: '2.5',
  title: 'Writing Rational Functions from Features',
  gen(rng, level) {
    const [va, z, h] = pickRoots(rng, 3);
    const c = rng.pick([2, 3, 4, -1, -2, -3]);
    const big = (f, x) => !Number.isFinite(f(x)) || Math.abs(f(x + 1e-7)) > 1e4;
    const haCheck = (f, y) => Math.abs(f(1e7) - y) < 1e-3 && Math.abs(f(-1e7) - y) < 1e-3;
    const features = [`a vertical asymptote at $x=${va}$`];
    let ans;
    let check;
    if (level === 0) {
      features.push('a horizontal asymptote at $y=0$');
      ans = `1/(${shiftStr(va)})`;
      check = (f) => {
        if (!big(f, va)) return `Your function does not have a vertical asymptote at $x=${va}$.`;
        if (!haCheck(f, 0)) return 'Check the horizontal asymptote of your function.';
        return true;
      };
    } else if (level === 1) {
      features.push(`an $x$-intercept at $x=${z}$`, `a horizontal asymptote at $y=${c}$`);
      ans = `${c}${factorStr(z)}/(${shiftStr(va)})`;
      check = (f) => {
        if (!big(f, va)) return `Your function does not have a vertical asymptote at $x=${va}$.`;
        if (!(Math.abs(f(z)) < 1e-9)) return `Your function does not have a zero at $x=${z}$.`;
        if (!haCheck(f, c)) return 'Check the horizontal asymptote of your function.';
        return true;
      };
    } else {
      features.push(`a hole at $x=${h}$`, `an $x$-intercept at $x=${z}$`, `a horizontal asymptote at $y=${c}$`);
      ans = `${c}${factorStr(z)}${factorStr(h)}/(${factorStr(va)}${factorStr(h)})`;
      check = (f) => {
        if (!big(f, va)) return `Your function does not have a vertical asymptote at $x=${va}$.`;
        const atHole = f(h);
        const near = Math.abs(f(h + 1e-6)) < 1e4 && Math.abs(f(h - 1e-6)) < 1e4;
        if (Number.isFinite(atHole) || !near) return `Your function does not have a hole at $x=${h}$.`;
        if (!(Math.abs(f(z)) < 1e-9)) return `Your function does not have a zero at $x=${z}$.`;
        if (!haCheck(f, c)) return 'Check the horizontal asymptote of your function.';
        return true;
      };
    }
    const list = features.length === 2 ? features.join(' and ') : `${features.slice(0, -1).join(', ')}, and ${features[features.length - 1]}`;
    return {
      prompt: `Write a rule for a rational function $f$ whose graph has ${list}.\n\nMany answers are possible. Any correct function will be accepted.`,
      parts: [{ type: 'custom', check, ans, vars: ['x'], label: '$f(x)=$' }],
      hint: 'Build it from factors: each feature tells you a factor that belongs in the numerator, the denominator, or both.',
    };
  },
};

// ---------- Lesson 2.6 ----------

const polyDivision = {
  id: 'polynomial-long-division',
  lesson: '2.6',
  title: 'Polynomial Long Division',
  gen(rng, level) {
    const r = rng.nz(-5, 5);
    let q;
    let rem;
    if (level === 0) {
      q = [1, rng.nz(-6, 6)];
      rem = 0;
    } else if (level === 1) {
      q = [rng.pick([1, 2, 3]), rng.nz(-6, 6)];
      rem = rng.nz(-9, 9);
    } else {
      q = [rng.pick([1, 2, -1]), rng.int(-4, 4), rng.nz(-5, 5)];
      rem = rng.nz(-9, 9);
    }
    const dividend = polyAdd(polyMul(q, [1, -r]), [rem]);
    return {
      prompt: `Divide using polynomial long division. Give the quotient and the remainder.\n\n$$\\frac{${T(polyStr(dividend))}}{${T(shiftStr(r))}}$$`,
      parts: [expr(polyStr(q), { label: 'Quotient:' }), num(rem, { label: 'Remainder:' })],
      hint: 'Divide the leading terms, multiply back, subtract, and bring down the next term. If a power of $x$ is missing, hold its place with a zero coefficient.',
    };
  },
};

const slantAsymptote = {
  id: 'slant-asymptotes',
  lesson: '2.6',
  title: 'Slant Asymptotes',
  gen(rng, level) {
    let num0;
    let den;
    let q;
    if (level < 2) {
      const r = rng.nz(-4, 4);
      q = [level === 0 ? 1 : rng.pick([2, 3, -1, -2]), rng.nz(-6, 6)];
      den = [1, -r];
      num0 = polyAdd(polyMul(q, den), [rng.nz(-9, 9)]);
    } else {
      q = [rng.pick([1, 2, -1]), rng.nz(-5, 5)];
      den = [1, 0, rng.int(1, 5)];
      num0 = polyAdd(polyMul(q, den), [rng.int(-4, 4), rng.nz(-9, 9)]);
    }
    return {
      prompt: `The graph of the rational function has a slant (oblique) asymptote. Find its equation.\n\n$$f(x)=\\frac{${T(polyStr(num0))}}{${T(polyStr(den))}}$$`,
      parts: [expr(polyStr(q), { label: '$y=$' })],
      hint: 'Divide the numerator by the denominator. The slant asymptote is the quotient; the remainder part fades away for large inputs.',
    };
  },
};

function choose(n, k) {
  let out = 1;
  for (let i = 1; i <= k; i++) out = (out * (n - k + i)) / i;
  return Math.round(out);
}

const noParens = (_ast, raw) => (raw.includes('(') ? 'Expand completely. Your answer should not contain parentheses.' : null);

const binomialExpansion = {
  id: 'binomial-theorem',
  lesson: '2.6',
  title: 'Binomial Theorem',
  gen(rng, level) {
    if (level === 2) {
      const n = rng.int(5, 6);
      const a = rng.pick([1, 2]);
      const b = rng.nz(-3, 3);
      const k = rng.int(2, n - 2);
      const value = choose(n, k) * a ** k * b ** (n - k);
      return {
        prompt: `Find the coefficient of $x^{${k}}$ in the expansion of $${T(`(${plus(coef(a, 'x'), b)})^${n}`)}$.`,
        parts: [num(value)],
        hint: `Use the term of the binomial expansion that contains $x^{${k}}$: a number from Pascal's triangle times a power of each part of the binomial.`,
      };
    }
    const n = level === 0 ? rng.int(2, 3) : rng.int(3, 4);
    const a = level === 0 ? 1 : rng.pick([1, 2, 3]);
    const b = rng.nz(level === 0 ? -5 : -3, level === 0 ? 5 : 3);
    const c = [];
    for (let k = n; k >= 0; k--) c.push(choose(n, k) * a ** k * b ** (n - k));
    return {
      prompt: `Expand and simplify. Write your answer as a polynomial in standard form.\n\n$$${T(`(${plus(coef(a, 'x'), b)})^${n}`)}$$`,
      parts: [expr(polyStr(c), { form: noParens })],
      hint: `Use row ${n} of Pascal's triangle for the coefficients. The powers of the first term count down while the powers of the second term count up.`,
    };
  },
};

const equivalentForms = {
  id: 'equivalent-forms',
  lesson: '2.6',
  title: 'Equivalent Forms of Polynomial and Rational Expressions',
  gen(rng, level) {
    const [a, b, c] = pickRoots(rng, 3);
    if (level < 2) {
      const roots = level === 0 ? [a, b] : [a, b, c];
      const k = level === 0 ? rng.pick([1, 1, 2, -1]) : 1;
      const str = `${k === 1 ? '' : k === -1 ? '-' : k}${roots.map((r) => factorStr(r)).join('')}`;
      return {
        prompt: `Rewrite the polynomial in standard form (expanded, with like terms combined).\n\n$$${T(str)}$$`,
        parts: [expr(polyStr(polyFromRoots(roots, k)), { form: noParens })],
        hint: 'Multiply two factors at a time, combining like terms before moving on to the next factor.',
      };
    }
    const A = rng.nz(-4, 4);
    const B = rng.nz(-9, 9);
    const str = `(${polyStr([A, B - A * a])})/(${shiftStr(a)})`;
    return {
      prompt: `The function $f(x)=${T(str)}$ can be rewritten in the form\n\n$$f(x)=A+\\frac{B}{${T(shiftStr(a))}}$$\n\nFind the constants $A$ and $B$.`,
      parts: [num(A, { label: '$A=$' }), num(B, { label: '$B=$' })],
      hint: 'Divide the numerator by the denominator. The quotient is $A$ and the remainder is $B$.',
    };
  },
};

export default [
  degreeLeading, degreeFromDifferences, turningPoints, globalExtrema,
  zerosFactored, multiplicity, evenOdd, symmetryValues, complexZeros,
  polyEndBehavior, rationalEndBehavior, leadingTermQuotient,
  verticalAsymptotes, zerosRational, holes, rationalDomain,
  limitAtAsymptote, matchRationalGraph, rationalFeatures, buildRational,
  polyDivision, slantAsymptote, binomialExpansion, equivalentForms,
];
