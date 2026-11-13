// Unit 5: Composition, Inverses, and Logarithmic Functions (Lessons 5.1 to 5.9)

import {
  T, polyStr, fracStr, reduce, round, htable, table, num, numFrac, expr, interval, set, point, mc, mcFixed, shiftStr, plus, coef, commas,
} from '../lib/fmt.js';
import { fnOf, walk } from '../lib/expr.js';
import { plot } from '../lib/graph.js';
import { zigzag } from './unit1.js';

const POS = [0.7, 1.3, 2.1, 2.9, 3.6, 4.4, 5.2, 6.5];
const logTex = (b, arg) => (b === 10 ? `\\log\\left(${arg}\\right)` : b === 'e' ? `\\ln\\left(${arg}\\right)` : `\\log_{${b}}\\left(${arg}\\right)`);
const logStr = (b, arg) => (b === 10 ? `log(${arg})` : b === 'e' ? `ln(${arg})` : `log_${b}(${arg})`);
const LOG_NOTE = 'To type a logarithm with a base, use an underscore: log_2(x) means $\\log_2(x)$.';

// ---------- Lesson 5.1 ----------

const composeValues = {
  id: 'evaluate-compositions',
  lesson: '5.1',
  title: 'Evaluating Composite Functions',
  gen(rng, level) {
    const f = level === 0 ? polyStr([rng.nz(-4, 4), rng.int(-6, 6)]) : polyStr([rng.pick([-1, 1, 2]), rng.int(-3, 3), rng.int(-5, 5)]);
    const g = polyStr([rng.nz(-3, 3), rng.int(-5, 5)]);
    const F = fnOf(f);
    const G = fnOf(g);
    const a = rng.int(-3, 4);
    const given = `Let $f(x)=${T(f)}$ and $g(x)=${T(g)}$.`;
    let ask;
    let value;
    if (level === 0) {
      ask = `f(g(${a}))`;
      value = F(G(a));
    } else if (level === 1) {
      if (rng.bool()) {
        ask = `(g\\circ f)(${a})`;
        value = G(F(a));
      } else {
        ask = `(f\\circ g)(${a})`;
        value = F(G(a));
      }
    } else if (rng.bool()) {
      ask = `g(g(g(${a})))`;
      value = G(G(G(a)));
    } else {
      ask = `g(f(g(${a})))`;
      value = G(F(G(a)));
    }
    return {
      prompt: `${given}\n\nFind $${ask}$.`,
      parts: [num(value, { label: `$${ask}=$` })],
      hint: 'Work from the inside out. Evaluate the innermost function first, then feed that output into the next function.',
    };
  },
};

const composeTable = {
  id: 'compositions-from-tables',
  lesson: '5.1',
  title: 'Composite Functions from Tables',
  gen(rng, level) {
    const xs = [1, 2, 3, 4, 5];
    const fv = rng.shuffle(xs);
    let gv = rng.shuffle(xs);
    if (gv.every((v, i) => v === fv[i])) gv = gv.slice(1).concat(gv[0]);
    const f = (x) => fv[x - 1];
    const g = (x) => gv[x - 1];
    const a = rng.pick(xs);
    const tbl = table(['$x$', '$f(x)$', '$g(x)$'], xs.map((x) => [x, f(x), g(x)]));
    let ask;
    let value;
    if (level === 0) {
      ask = `f(g(${a}))`;
      value = f(g(a));
    } else if (level === 1) {
      [ask, value] = rng.pick([[`g(f(${a}))`, g(f(a))], [`(f\\circ f)(${a})`, f(f(a))], [`(g\\circ g)(${a})`, g(g(a))]]);
    } else {
      [ask, value] = rng.pick([[`f(g(f(${a})))`, f(g(f(a)))], [`g(g(f(${a})))`, g(g(f(a)))]]);
    }
    if (level === 2 && rng.bool()) {
      const target = f(g(a));
      return {
        prompt: `Selected values of the functions $f$ and $g$ are shown.\n\n${tbl}\n\nFind the value of $x$ for which $f(g(x))=${target}$.`,
        parts: [num(a, { label: '$x=$' })],
        hint: `Work backward. First find the input that makes $f$ output ${target}. That input must be the output of $g$.`,
      };
    }
    return {
      prompt: `Selected values of the functions $f$ and $g$ are shown.\n\n${tbl}\n\nFind $${ask}$.`,
      parts: [num(value, { label: `$${ask}=$` })],
      hint: 'Start with the innermost function. Its output becomes the input you look up in the next column.',
    };
  },
};

const composeExpression = {
  id: 'composition-expressions',
  lesson: '5.1',
  title: 'Writing Composite Functions',
  gen(rng, level) {
    const m = rng.nz(-4, 4);
    const b = rng.int(-6, 6);
    const g = polyStr([m, b]);
    let f;
    let ans;
    let domain = [-3, 3];
    if (level === 0) {
      const p = rng.nz(-4, 4);
      const q = rng.int(-6, 6);
      f = polyStr([p, q]);
      ans = polyStr([p * m, p * b + q]);
    } else if (level === 1) {
      const c = rng.int(-6, 6);
      f = polyStr([1, 0, c]);
      ans = plus(`(${g})^2`, c);
    } else if (rng.bool()) {
      const c = rng.nz(-5, 5);
      f = `${rng.int(1, 6)}/(${shiftStr(c)})`;
      ans = f.replace('(' + shiftStr(c) + ')', `(${polyStr([m, b - c])})`);
      domain = [5.3, 9.7];
    } else {
      const c = rng.int(1, 9);
      const k = rng.int(1, 6);
      const gg = polyStr([1, 0, k]);
      return {
        prompt: `Let $f(x)=${T(`sqrt(x+${c})`)}$ and $g(x)=${T(gg)}$.\n\nWrite a simplified rule for $f(g(x))$.`,
        parts: [expr(`sqrt(x^2+${c + k})`, { label: '$f(g(x))=$' })],
        hint: 'Replace the $x$ in the rule for $f$ with the entire rule for $g$, then combine like terms.',
      };
    }
    return {
      prompt: `Let $f(x)=${T(f)}$ and $g(x)=${T(g)}$.\n\nWrite a rule for $f(g(x))$.`,
      parts: [expr(ans, { label: '$f(g(x))=$', domain })],
      hint: 'Replace every $x$ in the rule for $f$ with the entire rule for $g$, in parentheses. Then simplify.',
    };
  },
};

const decompose = {
  id: 'decompose-functions',
  lesson: '5.1',
  title: 'Decomposing Functions',
  gen(rng, level) {
    const a = rng.int(2, 6);
    const b = rng.int(1, 9);
    const n = rng.int(3, 7);
    let h;
    let outer;
    let inner;
    let wrongs;
    const pair = (fo, gi) => `$f(x)=${fo}$ and $g(x)=${gi}$`;
    if (level === 0) {
      h = `\\left(${a}x-${b}\\right)^{${n}}`;
      outer = `x^{${n}}`;
      inner = `${a}x-${b}`;
      wrongs = [pair(inner, outer), pair(`${a}x^{${n}}`, `x-${b}`), pair(`x^{${n}}-${b}`, `${a}x`)];
    } else if (level === 1) {
      h = `\\sqrt{x^2+${b}}`;
      outer = '\\sqrt{x}';
      inner = `x^2+${b}`;
      wrongs = [pair(inner, outer), pair(`\\sqrt{x}+${b}`, 'x^2'), pair('x^2', `\\sqrt{x+${b}}`)];
      if (rng.bool()) {
        h = `\\left|x^3-${b}\\right|`;
        outer = '|x|';
        inner = `x^3-${b}`;
        wrongs = [pair(inner, outer), pair(`|x|-${b}`, 'x^3'), pair('x^3', `|x-${b}|`)];
      }
    } else {
      h = `\\frac{${a}}{\\left(x^2+${b}\\right)^{3}}`;
      outer = `\\frac{${a}}{x^3}`;
      inner = `x^2+${b}`;
      wrongs = [pair(inner, outer), pair(`\\frac{${a}}{x^2+${b}}`, 'x^3'), pair(`\\frac{${a}}{x^3}+${b}`, 'x^2')];
    }
    return {
      prompt: `Let $h(x)=${h}$. Which pair of functions satisfies $h(x)=f(g(x))$?`,
      parts: [mc(rng, pair(outer, inner), wrongs)],
      hint: 'The inner function $g$ is what happens to $x$ first. The outer function $f$ is what is done to that result. Test a pair by composing it.',
    };
  },
};

// ---------- Lesson 5.2 ----------

const inverseExpression = {
  id: 'inverse-function-rules',
  lesson: '5.2',
  title: 'Finding Inverse Functions',
  gen(rng, level) {
    const a = rng.pick([2, 3, 4, 5, -2, -3]);
    const b = rng.nz(-9, 9);
    let f;
    let ans;
    let domain;
    if (level === 0) {
      f = polyStr([a, b]);
      ans = `(${shiftStr(b)})/${a < 0 ? `(${a})` : a}`;
    } else if (level === 1) {
      if (rng.bool()) {
        f = plus(coef(Math.abs(a), 'x^3'), b);
        ans = `cbrt((${shiftStr(b)})/${Math.abs(a)})`;
      } else {
        f = `(${shiftStr(-b)})/${Math.abs(a)}`;
        ans = plus(`${Math.abs(a)}x`, -b);
      }
    } else {
      const d = rng.intExcept(-6, 6, [0, -a]);
      const c = rng.nz(-6, 6);
      // f(x) = (ax + c)/(x + d), inverse is (c - dx)/(x - a)
      if (c === a * d) return inverseExpression.gen(rng, level);
      f = `(${polyStr([a, c])})/(${plus('x', d)})`;
      ans = `(${polyStr([-d, c])})/(${shiftStr(a)})`;
      domain = [a + 0.6, a + 6];
    }
    return {
      prompt: `Find the inverse function of $f(x)=${T(f)}$.`,
      parts: [expr(ans, { label: '$f^{-1}(x)=$', ...(domain ? { domain } : {}) })],
      hint: 'Write $y=f(x)$, swap the roles of $x$ and $y$, and solve the new equation for $y$.',
    };
  },
};

const inverseValues = {
  id: 'inverse-function-values',
  lesson: '5.2',
  title: 'Values of Inverse Functions',
  gen(rng, level) {
    if (level === 0) {
      const xs = rng.distinct(5, -4, 8);
      const ys = rng.shuffle(rng.distinct(5, -6, 12));
      const i = rng.int(0, 4);
      return {
        prompt: `The table shows values of a one-to-one function $f$.\n\n${htable('$x$', xs, '$f(x)$', ys)}\n\nFind $f^{-1}(${ys[i]})$.`,
        parts: [num(xs[i], { label: `$f^{-1}(${ys[i]})=$` })],
        hint: 'The inverse function reverses the table: it takes an output of $f$ and returns the input that produced it.',
      };
    }
    const x = rng.int(-4, 5);
    if (level === 1) {
      const m = rng.nz(-5, 5);
      const b = rng.int(-9, 9);
      const k = m * x + b;
      return {
        prompt: `Let $f(x)=${T(polyStr([m, b]))}$.\n\nFind $f^{-1}(${k})$.`,
        parts: [num(x, { label: `$f^{-1}(${k})=$` })],
        hint: `You do not need a formula for the inverse. Ask: which input makes $f(x)$ equal to ${k}?`,
      };
    }
    const a = rng.pick([1, 2, -1]);
    const c = rng.int(-9, 9);
    const k = a * x ** 3 + c;
    return {
      prompt: `Let $f(x)=${T(plus(coef(a, 'x^3'), c))}$.\n\nFind $f^{-1}(${k})$.`,
      parts: [num(x, { label: `$f^{-1}(${k})=$` })],
      hint: `Ask which input makes $f(x)$ equal to ${k}. Set up that equation and solve it.`,
    };
  },
};

const oneToOne = {
  id: 'one-to-one-functions',
  lesson: '5.2',
  title: 'One-to-One Functions',
  gen(rng, level) {
    const options = ['Yes, $f$ is one-to-one and has an inverse function', 'No, $f$ is not one-to-one'];
    if (level === 0) {
      const yes = rng.bool();
      const xs = rng.distinct(5, -4, 8);
      const ys = rng.shuffle(rng.distinct(5, -6, 12));
      if (!yes) ys[rng.int(1, 4)] = ys[0];
      return {
        prompt: `The table shows all the values of a function $f$.\n\n${htable('$x$', xs, '$f(x)$', ys)}\n\nIs $f$ one-to-one?`,
        parts: [mcFixed(options, yes ? 0 : 1)],
        hint: 'A one-to-one function never repeats an output. Scan the output row for duplicates.',
      };
    }
    if (level === 1) {
      const k = rng.int(1, 9);
      const [str, yes] = rng.pick([
        [`x^2-${k}`, false], [`x^3+${k}`, true], [`abs(x)+${k}`, false], [`${k + 1}x-${k}`, true], [`${k}/x`, true],
        [`sqrt(x)+${k}`, true], [`x^4`, false], [`2^x-${k}`, true], [`(x-${k})^2`, false], [`cbrt(x-${k})`, true],
      ]);
      return {
        prompt: `Is the function one-to-one on its natural domain?\n\n$$f(x)=${T(str)}$$`,
        parts: [mcFixed(options, yes ? 0 : 1)],
        hint: 'Picture the graph and imagine sliding a horizontal line up and down. If it ever hits the graph twice, two inputs share an output.',
      };
    }
    const yes = rng.bool();
    let fig;
    if (yes) {
      const s = rng.sign();
      const h = rng.int(-2, 2);
      const f = (x) => s * (0.08 * (x - h) ** 3 + 0.5 * (x - h));
      fig = plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }] });
    } else {
      const pts = zigzag(rng);
      fig = plot({ x: [-8, 8], y: [-8, 8], paths: [{ pts }], points: [pts[0], pts[4]].map(([x, y]) => ({ x, y })) });
    }
    return {
      prompt: `The graph of $y=f(x)$ is shown.\n\n${fig}\n\nIs $f$ one-to-one?`,
      parts: [mcFixed(options, yes ? 0 : 1)],
      hint: 'Use the horizontal line test: a function is one-to-one only if no horizontal line meets its graph more than once.',
    };
  },
};

const inversePoints = {
  id: 'points-on-inverse-graphs',
  lesson: '5.2',
  title: 'Points on Inverse Graphs',
  gen(rng, level) {
    const a = rng.int(-8, 8);
    const b = rng.intExcept(-8, 8, [a]);
    if (level === 0) {
      return {
        prompt: `The point $(${a}, ${b})$ lies on the graph of the one-to-one function $f$.\n\nWhich point must lie on the graph of $f^{-1}$?`,
        parts: [point(b, a, { label: 'Point:' })],
        hint: 'An inverse function swaps the roles of input and output.',
      };
    }
    if (level === 1) {
      const c = rng.intExcept(-8, 8, [a, b]);
      const d = rng.intExcept(-8, 8, [a, b, c]);
      return {
        prompt: `A one-to-one function $f$ satisfies $f(${a})=${b}$ and $f(${c})=${d}$.\n\nFind $f^{-1}(${d})+f^{-1}(${b})$.`,
        parts: [num(a + c)],
        hint: 'Each statement $f(p)=q$ can be rewritten as a statement about the inverse: $f^{-1}(q)=p$.',
      };
    }
    const k = rng.nz(-6, 6);
    const h = rng.nz(-6, 6);
    if (rng.bool()) {
      return {
        prompt: `The point $(${a}, ${b})$ lies on the graph of the one-to-one function $f$.\n\nWhich point must lie on the graph of $y=f^{-1}(x)${k > 0 ? '+' : '-'}${Math.abs(k)}$?`,
        parts: [point(b, a + k, { label: 'Point:' })],
        hint: 'First find the matching point on the graph of $f^{-1}$. Then apply the vertical shift to it.',
      };
    }
    return {
      prompt: `The point $(${a}, ${b})$ lies on the graph of the one-to-one function $f$.\n\nWhich point must lie on the graph of $y=f^{-1}(x${h > 0 ? '-' : '+'}${Math.abs(h)})$?`,
      parts: [point(b + h, a, { label: 'Point:' })],
      hint: 'First find the matching point on the graph of $f^{-1}$. Then apply the horizontal shift to it, watching the direction.',
    };
  },
};

// ---------- Lesson 5.3 ----------

const evaluateLogs = {
  id: 'evaluate-logarithms',
  lesson: '5.3',
  title: 'Evaluating Logarithms',
  gen(rng, level) {
    let tex;
    let part;
    if (level === 0) {
      const b = rng.pick([2, 3, 4, 5, 10]);
      const k = rng.int(1, b === 2 ? 6 : b === 10 ? 5 : 3);
      tex = logTex(b, commas(b ** k).replace(/,/g, '{,}'));
      part = num(k);
    } else if (level === 1) {
      const b = rng.pick([2, 3, 5, 10]);
      const k = rng.int(1, 3);
      const which = rng.int(0, 4);
      if (which === 0) {
        tex = logTex(b, `\\frac{1}{${b ** k}}`);
        part = num(-k);
      } else if (which === 1) {
        tex = logTex(b, '1');
        part = num(0);
      } else if (which === 2) {
        tex = `\\ln\\left(e^{${k + 1}}\\right)`;
        part = num(k + 1);
      } else if (which === 3) {
        tex = `\\log\\left(${(10 ** -k).toFixed(k)}\\right)`;
        part = num(-k);
      } else {
        tex = `\\ln\\left(\\frac{1}{e^{${k}}}\\right)`;
        part = num(-k);
      }
    } else {
      const [b, arg, n, d] = rng.pick([
        [8, '2', 1, 3], [4, '8', 3, 2], [9, '27', 3, 2], [27, '9', 2, 3], [16, '8', 3, 4], [25, '\\frac{1}{5}', -1, 2],
        [4, '\\frac{1}{8}', -3, 2], [2, '\\sqrt{2}', 1, 2], [3, '\\sqrt[3]{9}', 2, 3], [8, '4', 2, 3], [32, '2', 1, 5], [9, '\\frac{1}{3}', -1, 2],
      ]);
      tex = logTex(b, arg);
      part = numFrac(n, d);
    }
    return {
      prompt: `Evaluate without a calculator.\n\n$$${tex}$$`,
      parts: [part],
      hint: 'A logarithm asks a question: what exponent on the base produces the number inside? Write both as powers of the same number if it helps.',
    };
  },
};

const convertForms = {
  id: 'logarithmic-and-exponential-forms',
  lesson: '5.3',
  title: 'Converting Between Logarithmic and Exponential Form',
  gen(rng, level) {
    const b = rng.pick([2, 3, 4, 5, 6, 7]);
    const k = rng.int(2, 4);
    const N = b ** k;
    const lg = (base, arg, val) => `$\\log_{${base}}\\left(${arg}\\right)=${val}$`;
    const ex = (base, e, val) => `$${base}^{${e}}=${val}$`;
    if (level === 0) {
      return {
        prompt: `Which logarithmic equation is equivalent to $${b}^{${k}}=${N}$?`,
        parts: [mc(rng, lg(b, N, k), [lg(k, N, b), lg(b, k, N), lg(N, b, k), lg(N, k, b)])],
        hint: 'In both forms the base stays the base, and the logarithm is equal to the exponent.',
      };
    }
    if (level === 1) {
      return {
        prompt: `Which exponential equation is equivalent to $\\log_{${b}}\\left(${N}\\right)=${k}$?`,
        parts: [mc(rng, ex(b, k, N), [ex(k, b, N), ex(b, N, k), ex(N, k, b), ex(k, N, b)])],
        hint: 'The base of the logarithm becomes the base of the power, and the value of the logarithm becomes the exponent.',
      };
    }
    const c = rng.int(2, 9);
    if (rng.bool()) {
      return {
        prompt: `Which exponential equation is equivalent to $\\ln\\left(x\\right)=${c}$?`,
        parts: [mc(rng, `$e^{${c}}=x$`, [`$x^{${c}}=e$`, `$${c}^{e}=x$`, `$e^{x}=${c}$`, `$10^{${c}}=x$`])],
        hint: 'The natural logarithm has a base that is not written. Decide what that base is, then convert as usual.',
      };
    }
    return {
      prompt: `Which logarithmic equation is equivalent to $${b}^{-${k}}=\\frac{1}{${N}}$?`,
      parts: [mc(rng, lg(b, `\\frac{1}{${N}}`, -k), [lg(b, -k, `\\frac{1}{${N}}`), lg(`\\frac{1}{${N}}`, b, -k), lg(b, N, -k), lg(-k, `\\frac{1}{${N}}`, b)])],
      hint: 'The same pattern works with negative exponents: the base stays the base, and the logarithm equals the exponent.',
    };
  },
};

const basicLogEquations = {
  id: 'basic-logarithmic-equations',
  lesson: '5.3',
  title: 'Solving Basic Logarithmic Equations',
  gen(rng, level) {
    const b = rng.pick([2, 3, 4, 5, 10]);
    const k = rng.int(2, b === 2 ? 5 : 3);
    if (level === 0) {
      return {
        prompt: `Solve for $x$.\n\n$$${logTex(b, 'x')}=${k}$$`,
        parts: [num(b ** k, { label: '$x=$' })],
        hint: 'Rewrite the equation in exponential form. The base of the logarithm becomes the base of a power.',
      };
    }
    if (level === 1) {
      if (rng.bool()) {
        return {
          prompt: `Solve for $x$.\n\n$$${b}^{x}=${b ** k}$$`,
          parts: [num(k, { label: '$x=$' })],
          hint: `Rewrite the right side as a power of ${b}. Equivalently, take the base ${b} logarithm of both sides.`,
        };
      }
      return {
        prompt: `Solve for the base $x$, where $x>0$.\n\n$$\\log_{x}\\left(${b ** k}\\right)=${k}$$`,
        parts: [num(b, { label: '$x=$' })],
        hint: 'Rewrite in exponential form. You will get an unknown base raised to a known exponent, which you can undo with a root.',
      };
    }
    const [bb, n, d, val] = rng.pick([[4, 3, 2, 8], [9, 3, 2, 27], [8, 2, 3, 4], [16, 3, 4, 8], [27, 2, 3, 9], [4, 5, 2, 32]]);
    if (rng.bool()) {
      return {
        prompt: `Solve for $x$.\n\n$$\\log_{${bb}}\\left(x\\right)=\\frac{${n}}{${d}}$$`,
        parts: [num(val, { label: '$x=$' })],
        hint: 'Rewrite in exponential form. A fractional exponent means a root and a power together.',
      };
    }
    return {
      prompt: `Solve for $x$. Give an exact answer.\n\n$$\\log_{${b}}\\left(x\\right)=-${k}$$`,
      parts: [numFrac(1, b ** k, { label: '$x=$' })],
      hint: 'Rewrite in exponential form. A negative exponent produces a reciprocal.',
    };
  },
};

const inverseOfExponential = {
  id: 'inverses-of-exponential-functions',
  lesson: '5.3',
  title: 'Inverses of Exponential Functions',
  gen(rng, level) {
    const b = rng.pick([2, 3, 5, 10]);
    const k = rng.nz(-6, 6);
    const base = b === 10 ? '10' : String(b);
    let f;
    let ans;
    let domain;
    if (level === 0) {
      f = plus(`${base}^x`, k);
      ans = logStr(b, shiftStr(k));
      domain = [k + 0.5, k + 9];
    } else if (level === 1) {
      const a = rng.int(2, 6);
      f = `${a}*${base}^x`;
      ans = logStr(b, `x/${a}`);
      domain = [0.5, 9];
    } else {
      const h = rng.nz(-4, 4);
      f = plus(`${base}^(${shiftStr(h)})`, k);
      ans = plus(logStr(b, shiftStr(k)), h);
      domain = [k + 0.5, k + 9];
    }
    return {
      prompt: `Find the inverse function of $f(x)=${T(f)}$.\n\n${LOG_NOTE}${b === 10 ? ' Plain log(x) means base 10.' : ''}`,
      parts: [expr(ans, { label: '$f^{-1}(x)=$', domain })],
      hint: 'Swap $x$ and $y$, isolate the power, and then rewrite the equation in logarithmic form to get $y$ out of the exponent.',
    };
  },
};

// ---------- Lesson 5.4 ----------

const logDomain = {
  id: 'domain-and-asymptotes-of-logarithmic-functions',
  lesson: '5.4',
  title: 'Domain and Asymptotes of Logarithmic Functions',
  gen(rng, level) {
    const b = rng.pick([2, 3, 5, 10, 'e']);
    const h = rng.nz(-7, 7);
    const k = rng.int(-5, 5);
    if (level === 0) {
      const tex = `${logTex(b, T(shiftStr(h)))}${k === 0 ? '' : k > 0 ? `+${k}` : k}`;
      return {
        prompt: `Find the equation of the vertical asymptote of the graph of $f(x)=${tex}$.`,
        parts: [num(h, { label: '$x=$' })],
        hint: 'The graph of a logarithm has a vertical asymptote where its argument (the inside) equals zero.',
      };
    }
    if (level === 1) {
      const a = rng.int(2, 5);
      const c = rng.nz(-9, 9);
      return {
        prompt: `Find the domain of $f(x)=${logTex(b, T(plus(`${a}x`, c)))}$. Write your answer in interval notation.`,
        parts: [interval(`(${fracStr(-c, a)}, inf)`, { label: 'Domain:' })],
        hint: 'A logarithm only accepts positive inputs. Write an inequality saying the argument is greater than zero, and solve it.',
      };
    }
    if (rng.bool()) {
      return {
        prompt: `Find the domain of $f(x)=${logTex(b, T(`${h}-x`))}$. Write your answer in interval notation.`,
        parts: [interval(`(-inf, ${h})`, { label: 'Domain:' })],
        hint: 'Set the argument greater than zero and solve. Be careful with the direction of the inequality when $x$ has a negative coefficient.',
      };
    }
    const r = rng.int(1, 6);
    return {
      prompt: `Find the domain of $f(x)=${logTex(b, T(`x^2-${r * r}`))}$. Write your answer in interval notation, using $\\cup$ (type U) to join intervals.`,
      parts: [interval(`(-inf, ${-r}) U (${r}, inf)`, { label: 'Domain:' })],
      hint: 'The argument must be positive. Factor the quadratic and decide on which intervals it is above zero.',
    };
  },
};

const logFeatures = {
  id: 'key-features-of-logarithmic-graphs',
  lesson: '5.4',
  title: 'Key Features of Logarithmic Graphs',
  gen(rng, level) {
    const b = rng.pick([2, 3, 4, 5]);
    const k = rng.int(1, b === 2 ? 4 : 2);
    const h = rng.nz(-6, 6);
    if (level === 0) {
      return {
        prompt: `Find the $x$-intercept of the graph of $f(x)=${logTex(b, 'x')}-${k}$.`,
        parts: [num(b ** k, { label: '$x=$' })],
        hint: 'At an $x$-intercept the output is 0. Set the function equal to 0, isolate the logarithm, and convert to exponential form.',
      };
    }
    if (level === 1) {
      return {
        prompt: `Find the $x$-intercept of the graph of $f(x)=${logTex(b, T(shiftStr(h)))}-${k}$.`,
        parts: [num(b ** k + h, { label: '$x=$' })],
        hint: 'Set the function equal to 0 and isolate the logarithm. After converting to exponential form, one more step remains.',
      };
    }
    const neg = rng.bool();
    const str = `${neg ? '-' : ''}${logTex(b, T(shiftStr(h)))}`;
    return {
      prompt: `Consider $f(x)=${str}$. Describe its behavior.`,
      parts: [
        mcFixed(['$\\infty$', '$-\\infty$'], neg ? 0 : 1, { label: `$\\displaystyle\\lim_{x\\to ${h}^{+}}f(x)=$` }),
        mcFixed(['Increasing on its domain', 'Decreasing on its domain'], neg ? 1 : 0, { label: '$f$ is:' }),
      ],
      hint: 'Start from the parent graph $y=\\log_b(x)$ with $b>1$: it rises slowly and plunges downward near its asymptote. Then apply any reflection.',
    };
  },
};

const matchLogGraph = {
  id: 'match-logarithmic-graph',
  lesson: '5.4',
  title: 'Matching Logarithmic Graphs',
  gen(rng, level) {
    const h = rng.nz(-4, 4);
    const k = level === 0 ? 0 : rng.nz(-3, 3);
    const s = level === 2 ? -1 : 1;
    const mk = (hh, kk, ss) => plus(`${ss < 0 ? '-' : ''}log_2(${shiftStr(hh)})`, kk);
    const correct = mk(h, k, s);
    const wrongs = level === 0 ? [mk(-h, 0, 1), mk(0, h, 1), mk(0, -h, 1)] : [mk(-h, k, s), mk(h, -k, s), mk(h, k, -s), mk(-h, -k, s)];
    const f = fnOf(correct);
    return {
      prompt: `The graph of a logarithmic function is shown, with its vertical asymptote dashed.\n\n${plot({ x: [-8, 8], y: [-8, 8], curves: [{ f, from: h + 1e-6 }], vlines: [h], points: [{ x: h + 1, y: f(h + 1) }] })}\n\nWhich function matches the graph?`,
      parts: [mc(rng, `$y=${T(correct)}$`, wrongs.map((w) => `$y=${T(w)}$`))],
      hint: 'The asymptote shows the horizontal shift. The marked point is 1 unit to the right of the asymptote, where the logarithm part equals 0.',
    };
  },
};

// ---------- Lesson 5.5 ----------

const expandedForm = (ast) => {
  let bad = false;
  walk(ast, (n) => {
    if (n.k === 'fn' && (n.n === 'log' || n.n === 'ln') && !['var', 'num', 'const'].includes(n.a.k)) bad = true;
  });
  return bad ? 'Expand completely. Each logarithm should contain only a single variable or number.' : null;
};

const singleLog = (ast) => {
  let count = 0;
  walk(ast, (n) => {
    if (n.k === 'fn' && (n.n === 'log' || n.n === 'ln')) count++;
  });
  return count !== 1 || ast.k !== 'fn' ? 'Write your answer as one single logarithm with no coefficient in front.' : null;
};

const expandLogs = {
  id: 'expand-logarithms',
  lesson: '5.5',
  title: 'Expanding Logarithms',
  gen(rng, level) {
    const b = rng.pick([2, 3, 5, 10, 'e']);
    const m = rng.int(2, 5);
    const n = rng.int(2, 5);
    const L = (v) => logStr(b, v);
    let inside;
    let ans;
    if (level === 0) {
      if (rng.bool()) {
        inside = `x^{${m}}y`;
        ans = `${m}${L('x')}+${L('y')}`;
      } else {
        inside = '\\frac{x}{y}';
        ans = `${L('x')}-${L('y')}`;
      }
    } else if (level === 1) {
      if (rng.bool()) {
        inside = `\\frac{x^{${m}}}{y^{${n}}}`;
        ans = `${m}${L('x')}-${n}${L('y')}`;
      } else {
        inside = `y^{${n}}\\sqrt{x}`;
        ans = `(1/2)${L('x')}+${n}${L('y')}`;
      }
    } else {
      const bb = b === 'e' || b === 10 ? 2 : b;
      const k = rng.int(2, 3);
      inside = `\\frac{${bb ** k}x^{${m}}}{y}`;
      ans = `${k}+${m}log_${bb}(x)-log_${bb}(y)`;
      return finish(logTex(bb, inside));
    }
    return finish(logTex(b, inside));

    function finish(tex) {
      return {
        prompt: `Expand the logarithm completely. Assume $x>0$ and $y>0$.\n\n$$${tex}$$\n\n${LOG_NOTE}`,
        parts: [expr(ans, { vars: ['x', 'y'], points: POS, form: expandedForm })],
        hint: 'Products inside a logarithm become sums, quotients become differences, and exponents come out front as coefficients.',
      };
    }
  },
};

const condenseLogs = {
  id: 'condense-logarithms',
  lesson: '5.5',
  title: 'Condensing Logarithms',
  gen(rng, level) {
    const b = rng.pick([2, 3, 5, 10, 'e']);
    const m = rng.int(2, 5);
    const n = rng.int(2, 4);
    const Lt = (v) => logTex(b, v);
    let tex;
    let ans;
    if (level === 0) {
      if (rng.bool()) {
        tex = `${Lt('x')}+${Lt('y')}`;
        ans = logStr(b, 'xy');
      } else {
        tex = `${Lt('x')}-${Lt('y')}`;
        ans = logStr(b, 'x/y');
      }
    } else if (level === 1) {
      tex = `${m}${Lt('x')}-${Lt('y')}`;
      ans = logStr(b, `x^${m}/y`);
    } else {
      const c = rng.int(2, 7);
      tex = `\\frac{1}{2}${Lt('x')}+${n}${Lt('y')}-${Lt(c)}`;
      ans = logStr(b, `sqrt(x)y^${n}/${c}`);
    }
    return {
      prompt: `Write the expression as a single logarithm. Assume $x>0$ and $y>0$.\n\n$$${tex}$$\n\n${LOG_NOTE}`,
      parts: [expr(ans, { vars: ['x', 'y'], points: POS, form: singleLog })],
      hint: 'Move each coefficient up to become an exponent first. Then sums of logarithms combine by multiplying, and differences by dividing.',
    };
  },
};

const logArithmetic = {
  id: 'evaluate-with-logarithm-properties',
  lesson: '5.5',
  title: 'Evaluating with Logarithm Properties',
  gen(rng, level) {
    if (level === 0) {
      const [b, p, q, k] = rng.pick([[6, 4, 9, 2], [10, 25, 4, 2], [6, 2, 3, 1], [10, 50, 20, 3], [12, 9, 16, 2], [15, 3, 5, 1], [10, 8, 125, 3], [6, 8, 27, 3], [14, 2, 7, 1]]);
      return {
        prompt: `Evaluate without a calculator.\n\n$$${logTex(b, p)}+${logTex(b, q)}$$`,
        parts: [num(k)],
        hint: 'Neither logarithm is a nice number by itself, but a sum of logarithms with the same base can be combined into one.',
      };
    }
    if (level === 1) {
      const b = rng.pick([2, 3, 5]);
      const k = rng.int(1, 3);
      const q = rng.pick([3, 5, 6, 7].filter((v) => v % b !== 0));
      return {
        prompt: `Evaluate without a calculator.\n\n$$${logTex(b, q * b ** k)}-${logTex(b, q)}$$`,
        parts: [num(k)],
        hint: 'A difference of logarithms with the same base can be combined into a single logarithm of a quotient.',
      };
    }
    const u = round(rng.int(30, 60) / 100, 2);
    const v = round(u + rng.int(15, 35) / 100, 2);
    const [arg, value, desc] = rng.pick([
      ['12', 2 * u + v, '2\\cdot 2\\cdot 3'],
      ['18', u + 2 * v, '2\\cdot 3\\cdot 3'],
      ['\\frac{9}{2}', 2 * v - u, '\\frac{3\\cdot 3}{2}'],
      ['24', 3 * u + v, '2^3\\cdot 3'],
      ['\\frac{8}{3}', 3 * u - v, '\\frac{2^3}{3}'],
    ]);
    return {
      prompt: `Suppose $\\log_b(2)=${u}$ and $\\log_b(3)=${v}$ for some base $b$.\n\nFind $\\log_b\\left(${arg}\\right)$.`,
      parts: [num(round(value, 2), { tol: 0.0051 })],
      hint: `Rewrite the number inside using only 2s and 3s: $${arg}=${desc}$. Then break the logarithm apart with the properties.`,
    };
  },
};

const changeOfBase = {
  id: 'change-of-base',
  lesson: '5.5',
  title: 'Change of Base',
  gen(rng, level) {
    const b = level === 0 ? 2 : level === 1 ? rng.pick([3, 5, 7]) : rng.pick(['1/2', '1/3']);
    const N = rng.intExcept(5, 60, [8, 9, 16, 25, 27, 32, 49]);
    const bv = fnOf(String(b))(0);
    const value = Math.log(N) / Math.log(bv);
    const tex = level === 2 ? `\\log_{\\frac{1}{${b.split('/')[1]}}}\\left(${N}\\right)` : logTex(b, N);
    return {
      prompt: `Use the change of base formula and a calculator to evaluate. Round to three decimal places.\n\n$$${tex}$$`,
      parts: [num(round(value, 3), { tol: 0.00051 })],
      hint: 'Rewrite the logarithm as a quotient of two logarithms your calculator can compute: the log of the inside divided by the log of the base.',
    };
  },
};

// ---------- Lesson 5.6 ----------

const sameBaseEquations = {
  id: 'exponential-equations-with-a-common-base',
  lesson: '5.6',
  title: 'Exponential Equations with a Common Base',
  gen(rng, level) {
    const b = rng.pick([2, 3, 5]);
    if (level === 0) {
      const c = rng.nz(-4, 4);
      const k = rng.int(2, b === 2 ? 6 : 4);
      return {
        prompt: `Solve for $x$.\n\n$$${b}^{${T(plus('x', c))}}=${b ** k}$$`,
        parts: [num(k - c, { label: '$x=$' })],
        hint: `Rewrite the right side as a power of ${b}. When the bases match, the exponents must be equal.`,
      };
    }
    if (level === 1) {
      const [p, q] = rng.pick([[2, 3], [3, 2], [2, 1], [1, 2], [3, 1]]);
      const c = rng.nz(-4, 4);
      // (b^p)^x = (b^q)^(x + c)  ->  p x = q x + q c
      return {
        prompt: `Solve for $x$. Give an exact answer.\n\n$$${b ** p}^{x}=${b ** q}^{${T(plus('x', c))}}$$`,
        parts: [numFrac(q * c, p - q, { label: '$x=$' })],
        hint: `Both bases are powers of ${b}. Rewrite each side with base ${b}, then set the exponents equal.`,
      };
    }
    const i = rng.int(0, 2);
    const j = rng.intExcept(1, 3, [i]);
    const [P, Q] = [b ** i, b ** j];
    const mid = P + Q;
    return {
      prompt: `Solve for $x$. Separate multiple answers with commas.\n\n$$${b}^{2x}-${mid}\\cdot ${b}^{x}+${P * Q}=0$$`,
      parts: [set([i, j].sort((x, y) => x - y), { label: '$x=$' })],
      hint: `Notice that $${b}^{2x}=\\left(${b}^x\\right)^2$. Let $u=${b}^x$, solve the quadratic in $u$, and then solve for $x$.`,
    };
  },
};

const exponentialWithLogs = {
  id: 'solve-exponential-equations-with-logarithms',
  lesson: '5.6',
  title: 'Solving Exponential Equations with Logarithms',
  gen(rng, level) {
    let tex;
    let ans;
    if (level === 0) {
      const N = rng.intExcept(2, 40, [1]);
      tex = `e^{x}=${N}`;
      ans = `ln(${N})`;
    } else if (level === 1) {
      const b = rng.pick([2, 3, 5]);
      const a = rng.int(2, 6);
      const q = rng.intExcept(4, 30, [b, b * b, b ** 3, b ** 4]);
      tex = `${a}\\cdot ${b}^{x}=${a * q}`;
      ans = `ln(${q})/ln(${b})`;
    } else {
      const a = rng.int(2, 5);
      const k = rng.pick([2, 3, 4, -2, -3]);
      const c = rng.int(1, 9);
      const q = rng.int(2, 12);
      tex = `${a}e^{${k}x}+${c}=${a * q + c}`;
      ans = `ln(${q})/${k < 0 ? `(${k})` : k}`;
    }
    const value = fnOf(ans)(0);
    return {
      prompt: `Solve for $x$. Give an exact answer (for example, type ln(5)/2) or round to three decimal places.\n\n$$${tex}$$`,
      parts: [{ type: 'number', value, ans, tol: 0.00051, label: '$x=$' }],
      hint: 'Isolate the exponential expression first. Then take a logarithm of both sides to bring the exponent down.',
    };
  },
};

const oneLogEquations = {
  id: 'solve-logarithmic-equations',
  lesson: '5.6',
  title: 'Solving Logarithmic Equations',
  gen(rng, level) {
    const b = rng.pick([2, 3, 4, 5, 10]);
    const k = rng.int(1, b === 2 ? 5 : b === 10 ? 2 : 3);
    if (level === 0) {
      const c = rng.nz(-9, 9);
      return {
        prompt: `Solve for $x$.\n\n$$${logTex(b, T(plus('x', c)))}=${k}$$`,
        parts: [num(b ** k - c, { label: '$x=$' })],
        hint: 'Rewrite the equation in exponential form to remove the logarithm. Then solve the simple equation that remains.',
      };
    }
    if (level === 1) {
      const a = rng.int(2, 4);
      const x = rng.int(1, 9);
      const c = b ** k - a * x;
      const m = rng.int(2, 4);
      return {
        prompt: `Solve for $x$.\n\n$$${m}${logTex(b, T(plus(`${a}x`, c)))}=${m * k}$$`,
        parts: [num(x, { label: '$x=$' })],
        hint: 'Isolate the logarithm before doing anything else. Then convert to exponential form.',
      };
    }
    const c = rng.int(1, 9);
    const m = rng.int(2, 5);
    const q = rng.int(1, 4);
    return {
      prompt: `Solve for $x$. Give an exact answer (for example, type e^3-2) or round to three decimal places.\n\n$$${m}\\ln\\left(x+${c}\\right)-${m * q}=0$$`,
      parts: [{ type: 'number', value: Math.exp(q) - c, ans: `e^${q}-${c}`, tol: 0.00051, label: '$x=$' }],
      hint: 'Isolate the natural logarithm, then rewrite in exponential form with base $e$.',
    };
  },
};

// ---------- Lesson 5.7 ----------

const logPropertyEquations = {
  id: 'logarithmic-equations-with-properties',
  lesson: '5.7',
  title: 'Logarithmic Equations Using Properties',
  gen(rng, level) {
    if (level === 0) {
      const b = rng.pick([2, 3, 5, 10]);
      const k = rng.int(2, b === 2 ? 5 : b === 10 ? 3 : 3);
      const divisors = [];
      for (let d = 2; d < b ** k; d++) if (b ** k % d === 0) divisors.push(d);
      const c = rng.pick(divisors);
      return {
        prompt: `Solve for $x$.\n\n$$${logTex(b, 'x')}+${logTex(b, c)}=${k}$$`,
        parts: [num(b ** k / c, { label: '$x=$' })],
        hint: 'Combine the two logarithms into one using the product property. Then rewrite in exponential form.',
      };
    }
    if (level === 1) {
      const [b, k, r, d] = rng.pick([[10, 1, 5, 3], [2, 3, 4, 2], [2, 3, 8, 7], [6, 1, 3, 1], [6, 1, 6, 5], [2, 4, 8, 6], [3, 2, 9, 8], [12, 1, 4, 1], [12, 1, 6, 4], [2, 5, 8, 4], [10, 2, 20, 15], [3, 3, 9, 6], [5, 2, 25, 24]]);
      return {
        prompt: `Solve for $x$. If there is more than one solution, separate them with commas.\n\n$$${logTex(b, 'x')}+${logTex(b, `x-${d}`)}=${k}$$`,
        parts: [set([r], { label: '$x=$' })],
        hint: 'Combine the logarithms and convert to exponential form to get a quadratic equation. Then check each solution in the original equation: logarithms need positive arguments.',
      };
    }
    const b = rng.pick([2, 3]);
    const k = rng.int(1, 2);
    const x = rng.int(1, 6);
    const q = rng.int(0, 4);
    const p = b ** k * (x + q) - x;
    const arg = (c) => (c === 0 ? 'x' : `x+${c}`);
    return {
      prompt: `Solve for $x$.\n\n$$${logTex(b, arg(p))}-${logTex(b, arg(q))}=${k}$$`,
      parts: [num(x, { label: '$x=$' })],
      hint: 'Combine the difference into a single logarithm of a quotient. Convert to exponential form, then clear the fraction.',
    };
  },
};

const expLogInequalities = {
  id: 'exponential-and-logarithmic-inequalities',
  lesson: '5.7',
  title: 'Exponential and Logarithmic Inequalities',
  gen(rng, level) {
    const b = rng.pick([2, 3, 5]);
    const k = rng.int(2, b === 2 ? 5 : 3);
    const strict = rng.bool();
    const gt = rng.bool();
    const sym = gt ? (strict ? '>' : '\\ge') : strict ? '<' : '\\le';
    const br = (isLow) => (strict ? (isLow ? '(' : ')') : isLow ? '[' : ']');
    let tex;
    let ans;
    let hint = 'Solve the matching equation first to find the boundary. Then decide which side works, remembering whether the function is increasing or decreasing.';
    if (level === 0) {
      tex = `${b}^{x}${sym}${b ** k}`;
      ans = gt ? `${br(true)}${k}, inf)` : `(-inf, ${k}${br(false)}`;
    } else if (level === 1) {
      tex = `${logTex(b, 'x')}${sym}${k}`;
      ans = gt ? `${br(true)}${b ** k}, inf)` : `(0, ${b ** k}${br(false)}`;
      hint = 'Solve the matching equation to find the boundary. Also remember that the logarithm is only defined for positive inputs.';
    } else if (rng.bool()) {
      // base between 0 and 1 reverses the inequality
      tex = `\\left(\\frac{1}{${b}}\\right)^{x}${sym}${b ** k}`;
      ans = gt ? `(-inf, ${-k}${br(false)}` : `${br(true)}${-k}, inf)`;
      hint = 'Rewrite both sides as powers of the same base. Because this exponential function is decreasing, think carefully about the direction of the inequality.';
    } else {
      const h = rng.nz(-6, 6);
      tex = `${logTex(b, T(shiftStr(h)))}${sym}${k}`;
      ans = gt ? `${br(true)}${b ** k + h}, inf)` : `(${h}, ${b ** k + h}${br(false)}`;
      hint = 'Find the boundary by solving the matching equation. Then combine it with the domain restriction: the argument of the logarithm must be positive.';
    }
    return {
      prompt: `Solve the inequality. Write your answer in interval notation.\n\n$$${tex}$$`,
      parts: [interval(ans, { label: 'Solution:' })],
      hint,
    };
  },
};

const quadraticInE = {
  id: 'quadratic-type-exponential-equations',
  lesson: '5.7',
  title: 'Exponential Equations of Quadratic Type',
  gen(rng, level) {
    const p = rng.int(2, 6);
    const q = rng.intExcept(2, 9, [p]);
    let tex;
    let sols;
    if (level === 0) {
      tex = `\\left(e^{x}-${p}\\right)\\left(e^{x}-${q}\\right)=0`;
      sols = [p, q];
    } else if (level === 1) {
      tex = `e^{2x}-${p + q}e^{x}+${p * q}=0`;
      sols = [p, q];
    } else {
      // (e^x - q)(e^x + p) = 0 has only one real solution
      const mid = p - q;
      tex = `e^{2x}${mid === 0 ? '' : `${mid > 0 ? '+' : '-'}${Math.abs(mid) === 1 ? '' : Math.abs(mid)}e^{x}`}-${p * q}=0`;
      sols = [q];
    }
    sols.sort((a, b) => a - b);
    return {
      prompt: `Solve for $x$. Give exact answers (for example, type ln(3)) or round to three decimal places. Separate multiple answers with commas.\n\n$$${tex}$$`,
      parts: [set(sols.map(Math.log), { label: '$x=$', ans: sols.map((s) => `ln(${s})`).join(', '), tol: 0.00051 })],
      hint: 'Treat $e^x$ as a single quantity $u$, so that $e^{2x}=u^2$. Solve for $u$, and remember that $e^x$ can never be negative or zero.',
    };
  },
};

// ---------- Lesson 5.8 ----------

const logScales = {
  id: 'logarithmic-scales',
  lesson: '5.8',
  title: 'Logarithmic Scales',
  gen(rng, level) {
    if (level === 0) {
      const k = rng.int(2, 12);
      return {
        prompt: `The pH of a solution is given by $\\text{pH}=-\\log\\left[H^+\\right]$, where $\\left[H^+\\right]$ is the hydrogen ion concentration in moles per liter.\n\nFind the pH of a solution with $\\left[H^+\\right]=10^{-${k}}$.`,
        parts: [num(k, { label: 'pH $=$' })],
        hint: 'The common logarithm of a power of 10 is just the exponent. Then apply the negative sign in the formula.',
      };
    }
    if (level === 1) {
      if (rng.bool()) {
        const m1 = round(rng.int(50, 85) / 10, 1);
        const diff = rng.int(1, 3);
        return {
          prompt: `On the Richter scale, the magnitude of an earthquake is $M=\\log\\left(\\frac{I}{I_0}\\right)$, where $I$ is its intensity. One earthquake has magnitude ${m1} and another has magnitude ${round(m1 - diff, 1)}.\n\nHow many times as intense is the stronger earthquake?`,
          parts: [num(10 ** diff, { suffix: 'times' })],
          hint: 'Each increase of 1 in magnitude multiplies the intensity by the base of the logarithm. How many such steps separate the two earthquakes?',
        };
      }
      const m = rng.int(2, 9);
      const k = rng.int(3, 9);
      const value = 10 * Math.log10(m * 10 ** k);
      return {
        prompt: `The loudness of a sound, in decibels, is $D=10\\log\\left(\\frac{I}{I_0}\\right)$, where $I$ is the intensity of the sound and $I_0$ is a reference intensity.\n\nFind the loudness of a sound with $I=${m}\\times 10^{${k}}\\,I_0$. Round to the nearest tenth.`,
        parts: [num(round(value, 1), { suffix: 'decibels', tol: 0.051 })],
        hint: 'The ratio $\\frac{I}{I_0}$ is the number multiplying $I_0$. Take its common logarithm, then multiply by 10.',
      };
    }
    const ph = round(rng.int(22, 88) / 10, 1);
    const value = 10 ** -ph;
    return {
      prompt: `The pH of a solution is given by $\\text{pH}=-\\log\\left[H^+\\right]$. A solution has a pH of ${ph}.\n\nFind its hydrogen ion concentration $\\left[H^+\\right]$. You may enter an exact expression such as 10^(-3.5).`,
      parts: [{ type: 'number', value, ans: `10^(-${ph})`, tol: value * 0.006, label: '$\\left[H^+\\right]=$' }],
      hint: 'Substitute the pH and isolate the logarithm. Then convert to exponential form with base 10.',
    };
  },
};

const timeToReach = {
  id: 'solving-for-time-in-models',
  lesson: '5.8',
  title: 'Solving for Time in Exponential Models',
  gen(rng, level) {
    if (level === 0) {
      const rPct = rng.pick([2, 3, 4, 5, 6, 8]);
      const mult = rng.pick([2, 3]);
      return {
        prompt: `An investment earns ${rPct} percent annual interest, compounded continuously, so its value is $A=Pe^{${rPct / 100}t}$.\n\nHow many years does it take for the investment to ${mult === 2 ? 'double' : 'triple'}? Round to the nearest hundredth.`,
        parts: [num(round(Math.log(mult) / (rPct / 100), 2), { label: '$t\\approx$', suffix: 'years', tol: 0.0051 })],
        hint: `${mult === 2 ? 'Doubling' : 'Tripling'} means $A=${mult}P$. Substitute, divide out $P$, and take the natural logarithm of both sides.`,
      };
    }
    if (level === 1) {
      const a = rng.int(2, 9) * 100;
      const b = rng.pick([1.04, 1.06, 1.08, 1.1, 1.15]);
      const target = a * rng.pick([2, 3, 4, 5]);
      return {
        prompt: `A population is modeled by $P(t)=${a}\\left(${b}\\right)^t$, where $t$ is in years.\n\nWhen will the population reach ${commas(target)}? Round to the nearest hundredth.`,
        parts: [num(round(Math.log(target / a) / Math.log(b), 2), { label: '$t\\approx$', suffix: 'years', tol: 0.0051 })],
        hint: 'Set the model equal to the target and isolate the power. Then take a logarithm of both sides to solve for the exponent.',
      };
    }
    const h = rng.pick([5, 8, 12, 14, 30]);
    const pct = rng.pick([10, 15, 20, 30, 40]);
    return {
      prompt: `A radioactive substance has a half-life of ${h} days, so the fraction remaining after $t$ days is $\\left(\\frac{1}{2}\\right)^{t/${h}}$.\n\nHow long does it take until only ${pct} percent of the substance remains? Round to the nearest hundredth.`,
      parts: [num(round((h * Math.log(pct / 100)) / Math.log(0.5), 2), { label: '$t\\approx$', suffix: 'days', tol: 0.0051 })],
      hint: 'Set the fraction remaining equal to the percent written as a decimal. Take a logarithm of both sides, then solve for $t$.',
    };
  },
};

const logModels = {
  id: 'logarithmic-models',
  lesson: '5.8',
  title: 'Building Logarithmic Models',
  gen(rng, level) {
    const a = rng.int(-9, 15);
    const b = rng.nz(-6, 8);
    const f = (k) => a + b * k; // value at x = 10^k
    const model = '$f(x)=a+b\\log(x)$';
    if (level === 0) {
      const k = rng.int(2, 4);
      const str = `${a}${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}\\log(x)`;
      return {
        prompt: `A logarithmic model is $f(x)=${str}$.\n\nFind $f(${commas(10 ** k).replace(/,/g, '{,}')})$.`,
        parts: [num(f(k))],
        hint: 'The input is a power of 10, so its common logarithm is a whole number. Find that first.',
      };
    }
    const [k1, k2] = level === 1 ? [0, 1] : rng.pick([[1, 3], [1, 2], [2, 4]]);
    return {
      prompt: `A logarithmic model has the form ${model}. It satisfies $f(${commas(10 ** k1).replace(/,/g, '{,}')})=${f(k1)}$ and $f(${commas(10 ** k2).replace(/,/g, '{,}')})=${f(k2)}$.\n\nFind $a$ and $b$.`,
      parts: [num(a, { label: '$a=$' }), num(b, { label: '$b=$' })],
      hint: 'Evaluate the logarithm at each given input to turn the two conditions into two simple equations in $a$ and $b$.',
    };
  },
};

// ---------- Lesson 5.9 ----------

const semiLogConcepts = {
  id: 'semi-log-plot-concepts',
  lesson: '5.9',
  title: 'Understanding Semi-Log Plots',
  gen(rng, level) {
    if (level === 0) {
      const up = rng.bool();
      const options = ['Exponential growth', 'Exponential decay', 'Linear with positive slope', 'Linear with negative slope'];
      const what = rng.pick(['the number of users of an app', 'the mass of a sample', 'the value of an investment', 'the size of a bacteria colony', 'the brightness of a signal', 'the number of shares of a post']);
      const when = rng.pick(['each day', 'each week', 'each year', 'each hour']);
      return {
        prompt: `Data on ${what}, recorded ${when}, are graphed on a semi-log plot, where the vertical axis has a logarithmic scale. The points fall along a straight line that ${up ? 'rises' : 'falls'} from left to right.\n\nWhich model is appropriate for the original data?`,
        parts: [mcFixed(options, up ? 0 : 1)],
        hint: 'Equal steps up a logarithmic axis mean equal multiplications. What kind of function multiplies by the same factor over equal intervals?',
      };
    }
    if (level === 1) {
      const kinds = ['Linear', 'Quadratic', 'Exponential'];
      const xs = [0, 1, 2, 3, 4];
      const idx = rng.int(0, 2);
      const base = rng.pick([2, 3, 10]);
      const a = rng.int(1, 5);
      const ys = idx === 0 ? xs.map((x) => a + base * x) : idx === 1 ? xs.map((x) => a + x * x) : xs.map((x) => a * base ** x);
      return {
        prompt: `Consider the data in the table.\n\n${htable('$x$', xs, '$y$', ys)}\n\nWhat type of function fits these data? If the points were graphed on a semi-log plot (logarithmic vertical axis), would they fall on a straight line?`,
        parts: [mcFixed(kinds, idx, { label: 'Type of function:' }), mcFixed(['Yes, a straight line', 'No, not a straight line'], idx === 2 ? 0 : 1, { label: 'Semi-log plot:' })],
        hint: 'Check for a constant difference, a constant second difference, or a constant ratio in the outputs.',
      };
    }
    const m = rng.pick([2, 3, 4]);
    const c = rng.int(1, 3);
    return {
      prompt: `On a semi-log plot, a data set follows the line $\\ln(y)=${m}x+${c}$.\n\nWhich equation gives $y$ as a function of $x$?`,
      parts: [mc(rng, `$y=e^{${c}}\\cdot\\left(e^{${m}}\\right)^{x}$`, [`$y=${m}x+e^{${c}}$`, `$y=e^{${m}}\\cdot\\left(e^{${c}}\\right)^{x}$`, `$y=\\ln(${m}x+${c})$`, `$y=${c}\\cdot ${m}^{x}$`])],
      hint: 'Undo the natural logarithm by making both sides exponents of $e$. Then use exponent rules to split the sum in the exponent.',
    };
  },
};

const linearize = {
  id: 'linearizing-exponential-data',
  lesson: '5.9',
  title: 'Linearizing Exponential Models',
  gen(rng, level) {
    if (level === 0) {
      const a = rng.int(2, 9);
      const k = rng.pick(['0.3', '0.5', '2', '-0.4', '1.5', '-1']);
      return {
        prompt: `Data are modeled by $y=${a}\\cdot 10^{${k}x}$. On a semi-log plot of $\\log(y)$ versus $x$, the data form a line.\n\nWhat is the slope of that line?`,
        parts: [num(Number(k), { label: 'Slope $=$' })],
        hint: 'Take the common logarithm of both sides of the model and use the product property. Which part of the result multiplies $x$?',
      };
    }
    if (level === 1) {
      const a = rng.pick([10, 100, 1000]);
      const b = rng.pick([2, 3, 5, 7]);
      return {
        prompt: `Data are modeled by $y=${a}\\cdot ${b}^{x}$. On a semi-log plot of $\\log(y)$ versus $x$, the data form a line.\n\nFind the slope and the vertical intercept of that line. You may type exact values such as log(3), or round to three decimal places.`,
        parts: [
          { type: 'number', value: Math.log10(b), ans: `log(${b})`, tol: 0.00051, label: 'Slope $=$' },
          num(Math.log10(a), { label: 'Vertical intercept $=$' }),
        ],
        hint: 'Take the common logarithm of both sides: $\\log(y)=\\log(a)+x\\log(b)$. Match this with slope-intercept form.',
      };
    }
    const c = rng.int(1, 3);
    const m = rng.pick([0.5, 1, 2, -1, 0.25]);
    const B = 10 ** m;
    return {
      prompt: `On a semi-log plot, a data set follows the line $\\log(y)=${m}x+${c}$. The data can be modeled by $y=A\\cdot B^{x}$.\n\nFind $A$ and $B$. Round to three decimal places if needed.`,
      parts: [num(10 ** c, { label: '$A=$' }), { type: 'number', value: B, ans: `10^(${m})`, tol: 0.00051 * Math.max(1, B), label: '$B=$' }],
      hint: 'Make both sides exponents of 10 to undo the logarithm. Then split the exponent: the constant part gives $A$ and the part with $x$ gives $B$.',
    };
  },
};

const pow10 = (v) => (v >= 0 ? commas(10 ** v) : String(10 ** v));

const readSemiLog = {
  id: 'reading-semi-log-graphs',
  lesson: '5.9',
  title: 'Reading Semi-Log Graphs',
  gen(rng, level) {
    const m = level === 2 ? rng.pick([1, -1]) : level === 1 ? rng.pick([1, 2, 0.5]) : rng.pick([1, 0.5]);
    const c = m < 0 ? rng.int(4, 5) : rng.int(0, 2);
    const line = (x) => c + m * x;
    const xmax = m === 0.5 ? 8 : 5;
    const fig = plot({
      x: [0, xmax], y: [0, 6], w: 380, h: 320, xlabelEvery: 1, ylabelEvery: 1, yTick: pow10, yname: 'y (log scale)',
      curves: [{ f: line, from: 0, to: m < 0 ? c : Math.min(xmax, (6 - c) / m) }],
      points: [{ x: 0, y: c }],
    });
    const intro = `The semi-log plot shows a data model. The vertical axis has a logarithmic scale, so each grid line is 10 times the one below it.\n\n${fig}\n\n`;
    if (level === 0) {
      const step = m === 0.5 ? 2 : 1;
      const x = step * rng.int(1, 2);
      return {
        prompt: `${intro}Find the value of $y$ when $x=${x}$.`,
        parts: [num(10 ** line(x), { label: '$y=$' })],
        hint: 'Read the height of the line as usual, but use the labels on the vertical axis: they are powers of 10, not equally spaced numbers.',
      };
    }
    if (level === 1) {
      const dx = m === 0.5 ? rng.pick([2, 4]) : m === 1 ? rng.pick([1, 2]) : 1;
      return {
        prompt: `${intro}By what factor is $y$ multiplied each time $x$ increases by ${dx}?`,
        parts: [num(10 ** Math.round(m * dx), { label: 'Factor:' })],
        hint: `Pick two points on the line that are ${dx} apart horizontally, read their $y$-values from the axis labels, and divide.`,
      };
    }
    const ans = m > 0 ? `${10 ** c}*10^x` : `${10 ** c}(1/10)^x`;
    return {
      prompt: `${intro}Write an exponential function $y=a\\cdot b^x$ for the model.`,
      parts: [expr(ans, { label: '$y=$', points: [0, 0.5, 1, 1.5, 2, 2.5, 3, 4] })],
      hint: 'The value at $x=0$ gives $a$. Then read how $y$ changes when $x$ increases by 1 to find the factor $b$.',
    };
  },
};

export default [
  composeValues, composeTable, composeExpression, decompose,
  inverseExpression, inverseValues, oneToOne, inversePoints,
  evaluateLogs, convertForms, basicLogEquations, inverseOfExponential,
  logDomain, logFeatures, matchLogGraph,
  expandLogs, condenseLogs, logArithmetic, changeOfBase,
  sameBaseEquations, exponentialWithLogs, oneLogEquations,
  logPropertyEquations, expLogInequalities, quadraticInE,
  logScales, timeToReach, logModels,
  semiLogConcepts, linearize, readSemiLog,
];
