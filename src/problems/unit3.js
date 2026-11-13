// Unit 3: Transformations of Functions and Modeling (Lessons 3.1 to 3.5)

import {
  T, polyStr, fracStr, htable, num, numFrac, expr, interval, set, point, mc, mcFixed, factorStr, shiftStr, plus, coef, commas, reduce,
} from '../lib/fmt.js';
import { fnOf } from '../lib/expr.js';
import { plot } from '../lib/graph.js';

const PARENTS = {
  linear: { name: 'Linear', str: 'x', tex: 'y=x' },
  quadratic: { name: 'Quadratic', str: 'x^2', tex: 'y=x^2' },
  cubic: { name: 'Cubic', str: 'x^3', tex: 'y=x^3' },
  sqrt: { name: 'Square root', str: 'sqrt(x)', tex: 'y=\\sqrt{x}' },
  abs: { name: 'Absolute value', str: 'abs(x)', tex: 'y=|x|' },
  recip: { name: 'Reciprocal', str: '1/x', tex: 'y=\\frac{1}{x}' },
  cbrt: { name: 'Cube root', str: 'cbrt(x)', tex: 'y=\\sqrt[3]{x}' },
  exp: { name: 'Exponential', str: '2^x', tex: 'y=2^x' },
  recipSq: { name: 'Reciprocal squared', str: '1/x^2', tex: 'y=\\frac{1}{x^2}' },
};
const label = (key) => `${PARENTS[key].name}: $${PARENTS[key].tex}$`;

// Applies f(x) -> a * f(b(x - h)) + k to a parent written in terms of x.
function transformStr(parentStr, { a = 1, b = 1, h = 0, k = 0 }) {
  let inner = shiftStr(h);
  if (b !== 1) inner = h === 0 ? coef(b, 'x') : `${b === -1 ? '-' : b}(${inner})`;
  const needsWrap = inner.length > 1;
  let body;
  switch (parentStr) {
    case 'x^2':
      body = `${needsWrap ? `(${inner})` : inner}^2`;
      break;
    case 'x^3':
      body = `${needsWrap ? `(${inner})` : inner}^3`;
      break;
    case 'sqrt(x)':
      body = `sqrt(${inner})`;
      break;
    case 'cbrt(x)':
      body = `cbrt(${inner})`;
      break;
    case 'abs(x)':
      body = `abs(${inner})`;
      break;
    case '2^x':
      body = `2^(${inner})`;
      break;
    case '1/x':
      return plus(`${a}/${needsWrap ? `(${inner})` : inner}`, k);
    case '1/x^2':
      return plus(`${a}/${needsWrap ? `(${inner})` : inner}^2`, k);
    default:
      body = needsWrap ? `(${inner})` : inner;
  }
  return plus(coef(a, body), k);
}

// ---------- Lesson 3.1 ----------

const identifyParent = {
  id: 'identify-parent-function',
  lesson: '3.1',
  title: 'Identifying Parent Functions',
  gen(rng, level) {
    const pool = level === 0 ? ['linear', 'quadratic', 'cubic', 'sqrt', 'abs', 'recip'] : Object.keys(PARENTS);
    const key = rng.pick(pool);
    let str = PARENTS[key].str;
    let intro = 'The graph of a parent function is shown.';
    if (level === 2) {
      str = transformStr(str, { a: rng.pick([1, -1]), h: rng.int(-3, 3), k: rng.int(-3, 3) });
      intro = 'The graph shown is a shifted (and possibly reflected) copy of a parent function.';
    }
    const similar = { cubic: ['cbrt', 'linear'], cbrt: ['cubic', 'sqrt'], quadratic: ['abs', 'recipSq'], abs: ['quadratic', 'linear'], sqrt: ['cbrt', 'exp'], recip: ['recipSq', 'exp'], recipSq: ['recip', 'quadratic'], exp: ['quadratic', 'sqrt'], linear: ['cubic', 'abs'] };
    const wrongs = [...similar[key].filter((k) => pool.includes(k)), ...rng.shuffle(pool.filter((k) => k !== key))];
    return {
      prompt: `${intro}\n\n${plot({ x: [-8, 8], y: [-8, 8], curves: [{ f: fnOf(str) }] })}\n\nWhich parent function family does it belong to?`,
      parts: [mc(rng, label(key), wrongs.map(label))],
      hint: 'Look at the overall shape: is there a corner, an asymptote, or a starting point? Does it cover all $x$-values?',
    };
  },
};

const parentDomainRange = {
  id: 'domain-and-range-of-parent-functions',
  lesson: '3.1',
  title: 'Domain and Range of Parent Functions',
  gen(rng, level) {
    const ALL = '(-inf, inf)';
    const NOZERO = '(-inf, 0) U (0, inf)';
    const bank = [
      [
        ['x^2', ALL, '[0, inf)'],
        ['abs(x)', ALL, '[0, inf)'],
        ['sqrt(x)', '[0, inf)', '[0, inf)'],
        ['x^3', ALL, ALL],
      ],
      [
        ['1/x', NOZERO, NOZERO],
        ['1/x^2', NOZERO, '(0, inf)'],
        ['cbrt(x)', ALL, ALL],
        ['2^x', ALL, '(0, inf)'],
      ],
    ];
    let str;
    let dom;
    let ran;
    if (level < 2) {
      [str, dom, ran] = rng.pick(bank[level]);
    } else {
      const h = rng.nz(-6, 6);
      const k = rng.nz(-6, 6);
      [str, dom, ran] = rng.pick([
        [transformStr('abs(x)', { a: -1, h, k }), ALL, `(-inf, ${k}]`],
        [transformStr('x^2', { h, k }), ALL, `[${k}, inf)`],
        [transformStr('sqrt(x)', { h, k }), `[${h}, inf)`, `[${k}, inf)`],
        [transformStr('sqrt(x)', { a: -1, h, k }), `[${h}, inf)`, `(-inf, ${k}]`],
        [transformStr('1/x', { h, k }), `(-inf, ${h}) U (${h}, inf)`, `(-inf, ${k}) U (${k}, inf)`],
        [transformStr('2^x', { k }), ALL, `(${k}, inf)`],
      ]);
    }
    const askDomain = dom !== ALL && rng.bool() ? true : ran === ALL;
    return {
      prompt: `Find the <b>${askDomain ? 'domain' : 'range'}</b> of the function. Write your answer in interval notation.\n\n$$f(x)=${T(str)}$$`,
      parts: [interval(askDomain ? dom : ran, { label: askDomain ? 'Domain:' : 'Range:' })],
      hint: askDomain
        ? 'The domain is the set of allowed inputs. Which inputs would break the formula?'
        : 'The range is the set of possible outputs. Picture the graph and ask how low and how high it reaches.',
    };
  },
};

const evaluateParent = {
  id: 'evaluate-and-solve-parent-functions',
  lesson: '3.1',
  title: 'Working with Parent Functions',
  gen(rng, level) {
    const r = rng.int(2, 9);
    if (level === 0) {
      const [tex, x, y] = rng.pick([
        ['\\sqrt{x}', r * r, r],
        ['|x|', -r, r],
        ['x^3', -rng.int(2, 4), null],
        ['\\sqrt[3]{x}', -(rng.int(2, 5) ** 3), null],
        ['x^2', -r, r * r],
      ]);
      const value = y ?? (tex === 'x^3' ? x ** 3 : Math.cbrt(x));
      return {
        prompt: `Let $f(x)=${tex}$. Find $f(${x})$.`,
        parts: [num(Math.round(value), { label: `$f(${x})=$` })],
        hint: 'Substitute the input into the parent function. Pay attention to what the function does with a negative input.',
      };
    }
    if (level === 1) {
      const c = rng.int(2, 5);
      const [tex, k, sols] = rng.pick([
        ['\\sqrt{x}', r, [r * r]],
        ['|x|', r, [-r, r]],
        ['x^3', -(c ** 3), [-c]],
        ['x^2', r * r, [-r, r]],
        ['\\sqrt[3]{x}', -c, [-(c ** 3)]],
      ]);
      return {
        prompt: `Let $f(x)=${tex}$. Find all values of $x$ for which $f(x)=${k}$. Separate multiple answers with commas.`,
        parts: [set(sols, { label: '$x=$' })],
        hint: 'Undo the function with its inverse operation. Then ask whether a second input could give the same output.',
      };
    }
    const h = rng.nz(-6, 6);
    const [str, k, sols] = rng.pick([
      [`abs(${shiftStr(h)})`, r, [h - r, h + r]],
      [`(${shiftStr(h)})^2`, r * r, [h - r, h + r]],
      [`sqrt(${shiftStr(h)})`, r, [h + r * r]],
      [`(${shiftStr(h)})^3`, -8, [h - 2]],
    ]);
    return {
      prompt: `Find all values of $x$ for which $f(x)=${k}$, where $f(x)=${T(str)}$. Separate multiple answers with commas.`,
      parts: [set(sols, { label: '$x=$' })],
      hint: 'Undo the outside operation first to find what the inside must equal. Remember that some operations allow two possibilities.',
    };
  },
};

const parentProperties = {
  id: 'properties-of-parent-functions',
  lesson: '3.1',
  title: 'Properties of Parent Functions',
  gen(rng, level) {
    const clues = {
      linear: 'It has a constant rate of change.',
      quadratic: 'It is an even function with an absolute minimum, and its graph is a smooth curve with no corner.',
      abs: 'It is an even function whose graph has a sharp corner at the origin.',
      sqrt: 'Its domain is $[0,\\infty)$, and it is increasing and concave down on that domain.',
      cubic: 'It is an odd function defined for all real numbers. Its graph is concave down for $x<0$ and concave up for $x>0$.',
      recip: 'It is an odd function whose graph has a vertical asymptote.',
      exp: 'Its graph has a horizontal asymptote but no vertical asymptote.',
      cbrt: 'It is an odd function defined for all real numbers. Its graph is concave up for $x<0$ and concave down for $x>0$.',
      recipSq: 'It is an even function whose graph has a vertical asymptote.',
    };
    const pools = [
      ['linear', 'quadratic', 'abs', 'sqrt'],
      ['linear', 'quadratic', 'abs', 'sqrt', 'cubic', 'recip', 'exp'],
      Object.keys(PARENTS),
    ];
    const pool = pools[level];
    const key = level === 2 ? rng.pick(['cubic', 'cbrt', 'recipSq', 'recip', 'exp', 'quadratic']) : rng.pick(pool);
    const rivals = { cubic: ['cbrt', 'linear', 'recip'], cbrt: ['cubic', 'sqrt', 'linear'], recipSq: ['recip', 'quadratic', 'abs'], recip: ['recipSq', 'cubic', 'exp'], exp: ['recip', 'recipSq', 'sqrt'], quadratic: ['abs', 'recipSq', 'cubic'] };
    const wrongs = [...(rivals[key] || []).filter((k) => pool.includes(k)), ...rng.shuffle(pool.filter((k) => k !== key))];
    const fx = (k) => `$${PARENTS[k].tex.replace('y=', 'f(x)=')}$`;
    return {
      prompt: `Which parent function matches this description?\n\n<b>${clues[key]}</b>`,
      parts: [mc(rng, fx(key), wrongs.map(fx))],
      hint: 'Sketch each option quickly and test the description against your sketches one phrase at a time.',
    };
  },
};

// ---------- Lesson 3.2 ----------

const dirH = (h) => `${Math.abs(h)} unit${Math.abs(h) === 1 ? '' : 's'} ${h > 0 ? 'right' : 'left'}`;
const dirV = (k) => `${Math.abs(k)} unit${Math.abs(k) === 1 ? '' : 's'} ${k > 0 ? 'up' : 'down'}`;
const fOf = (h) => (h === 0 ? 'f(x)' : `f(x${h > 0 ? '-' : '+'}${Math.abs(h)})`);
const tail = (k) => (k === 0 ? '' : `${k > 0 ? '+' : '-'}${Math.abs(k)}`);

const describeTransformation = {
  id: 'describe-transformations',
  lesson: '3.2',
  title: 'Describing Transformations',
  gen(rng, level) {
    const h = rng.nz(-7, 7);
    const k = rng.nz(-7, 7);
    let g;
    let correct;
    let wrongs;
    if (level === 0) {
      const kind = rng.int(0, 3);
      if (kind === 0) {
        g = fOf(h);
        correct = `A horizontal translation ${dirH(h)}`;
        wrongs = [`A horizontal translation ${dirH(-h)}`, `A vertical translation ${dirV(h)}`, `A vertical translation ${dirV(-h)}`];
      } else if (kind === 1) {
        g = `f(x)${tail(k)}`;
        correct = `A vertical translation ${dirV(k)}`;
        wrongs = [`A vertical translation ${dirV(-k)}`, `A horizontal translation ${dirH(k)}`, `A horizontal translation ${dirH(-k)}`];
      } else {
        const overX = kind === 2;
        g = overX ? '-f(x)' : 'f(-x)';
        correct = `A reflection over the $${overX ? 'x' : 'y'}$-axis`;
        wrongs = [`A reflection over the $${overX ? 'y' : 'x'}$-axis`, 'A vertical translation 1 unit down', 'A horizontal translation 1 unit left'];
      }
    } else if (level === 1) {
      const refl = rng.bool();
      g = `${refl ? '-' : ''}${fOf(h)}${tail(k)}`;
      const desc = (hh, kk, r) => `${r ? 'A reflection over the $x$-axis, then a' : 'A'} translation ${dirH(hh)} and ${dirV(kk)}`;
      correct = desc(h, k, refl);
      wrongs = [desc(-h, k, refl), desc(h, -k, refl), desc(-h, -k, refl)];
    } else {
      const c = rng.int(2, 5);
      const kind = rng.int(0, 2);
      if (kind === 0) {
        g = `${c}f(x)${tail(k)}`;
        correct = `A vertical dilation by a factor of $${c}$, then a translation ${dirV(k)}`;
        wrongs = [
          `A horizontal dilation by a factor of $${c}$, then a translation ${dirV(k)}`,
          `A vertical dilation by a factor of $\\frac{1}{${c}}$, then a translation ${dirV(k)}`,
          `A horizontal dilation by a factor of $\\frac{1}{${c}}$, then a translation ${dirV(k)}`,
        ];
      } else if (kind === 1) {
        g = `f(${c}x)${tail(k)}`;
        correct = `A horizontal dilation by a factor of $\\frac{1}{${c}}$, then a translation ${dirV(k)}`;
        wrongs = [
          `A horizontal dilation by a factor of $${c}$, then a translation ${dirV(k)}`,
          `A vertical dilation by a factor of $${c}$, then a translation ${dirV(k)}`,
          `A vertical dilation by a factor of $\\frac{1}{${c}}$, then a translation ${dirV(k)}`,
        ];
      } else {
        g = `f\\left(\\frac{1}{${c}}x\\right)${tail(k)}`;
        correct = `A horizontal dilation by a factor of $${c}$, then a translation ${dirV(k)}`;
        wrongs = [
          `A horizontal dilation by a factor of $\\frac{1}{${c}}$, then a translation ${dirV(k)}`,
          `A vertical dilation by a factor of $${c}$, then a translation ${dirV(k)}`,
          `A vertical dilation by a factor of $\\frac{1}{${c}}$, then a translation ${dirV(k)}`,
        ];
      }
    }
    return {
      prompt: `The function $g$ is defined by $g(x)=${g}$.\n\nWhich sequence of transformations maps the graph of $f$ onto the graph of $g$?`,
      parts: [mc(rng, correct, wrongs)],
      hint: 'Changes inside the parentheses affect the graph horizontally and act opposite to how they look. Changes outside affect it vertically and act as they look.',
    };
  },
};

const writeTransformed = {
  id: 'write-transformed-functions',
  lesson: '3.2',
  title: 'Writing Transformed Functions',
  gen(rng, level) {
    const key = rng.pick(level === 2 ? ['quadratic', 'abs', 'sqrt'] : ['quadratic', 'abs', 'sqrt', 'cubic', 'recip']);
    const parent = PARENTS[key];
    const h = rng.nz(-6, 6);
    const k = rng.nz(-6, 6);
    let steps;
    let params;
    if (level === 0) {
      steps = [`translated ${dirH(h)}`, `translated ${dirV(k)}`];
      params = { h, k };
    } else if (level === 1) {
      const a = rng.pick([2, 3, 4]);
      const refl = rng.bool();
      steps = [`vertically dilated by a factor of ${a}`, ...(refl ? ['reflected over the $x$-axis'] : []), `translated ${dirH(h)}`, `translated ${dirV(k)}`];
      params = { a: refl ? -a : a, h, k };
    } else if (rng.bool()) {
      const b = rng.pick([2, 3, 4]);
      steps = [`horizontally dilated by a factor of $\\frac{1}{${b}}$`, `translated ${dirV(k)}`];
      params = { b, k };
    } else {
      steps = ['reflected over the $y$-axis', `translated ${dirV(k)}`];
      params = { b: -1, k };
    }
    const ans = transformStr(parent.str, params);
    const flipY = params.b === -1;
    const domain = key === 'sqrt' ? (flipY ? [-7, -0.5] : [(params.h || 0) + 0.5, (params.h || 0) + 7]) : key === 'recip' ? [h + 0.5, h + 5] : [-4, 4];
    const list = steps.map((s, i) => (i === 0 ? s : i === steps.length - 1 ? `and then ${s}` : `then ${s}`)).join(', ');
    return {
      prompt: `The graph of $f(x)=${parent.tex.replace('y=', '')}$ is ${list} to produce the graph of $g$.\n\nWrite a rule for $g(x)$.`,
      parts: [expr(ans, { label: '$g(x)=$', domain })],
      hint: 'Apply the transformations in order. Horizontal changes replace $x$ inside the function; vertical changes act on the whole output.',
    };
  },
};

const transformPoint = {
  id: 'transform-a-point',
  lesson: '3.2',
  title: 'Transforming Points',
  gen(rng, level) {
    const h = rng.nz(-6, 6);
    const k = rng.nz(-6, 6);
    const b = rng.nz(-6, 6);
    let a = rng.nz(-6, 6);
    let g;
    let ans;
    if (level === 0) {
      g = `${fOf(h)}${tail(k)}`;
      ans = [a + h, b + k];
    } else if (level === 1) {
      const c = rng.pick([-3, -2, -1, 2, 3]);
      g = `${c === -1 ? '-' : c}${fOf(h)}${tail(k)}`;
      ans = [a + h, c * b + k];
    } else if (rng.bool()) {
      const m = rng.pick([2, 3]);
      a = m * rng.nz(-3, 3);
      const c = rng.pick([-2, -1, 2, 3]);
      g = `${c === -1 ? '-' : c}f(${m}x)${tail(k)}`;
      ans = [a / m, c * b + k];
    } else {
      const m = rng.pick([2, 3]);
      g = `f\\left(-\\frac{1}{${m}}x\\right)${tail(k)}`;
      ans = [-m * a, b + k];
    }
    return {
      prompt: `The point $(${a}, ${b})$ lies on the graph of $y=f(x)$.\n\nWhich point must lie on the graph of $y=g(x)$, where $g(x)=${g}$?`,
      parts: [point(ans[0], ans[1], { label: 'Point:' })],
      hint: `For the new graph to use the known value $f(${a})$, the expression inside $f$ must equal $${a}$. Solve for that $x$ first, then compute the output.`,
    };
  },
};

const graphToEquation = {
  id: 'equation-from-transformed-graph',
  lesson: '3.2',
  title: 'Equations from Transformed Graphs',
  gen(rng, level) {
    const key = rng.pick(['quadratic', 'abs']);
    const parent = PARENTS[key];
    const h = rng.nz(-4, 4);
    const k = rng.nz(-4, 4);
    const a = level === 2 ? rng.pick([2, -2, 0.5, -0.5]) : rng.sign();
    const aStr = a === 0.5 ? '(1/2)' : a === -0.5 ? '-(1/2)' : a;
    const build = (aa, hh, kk) => {
      const body = key === 'abs' ? `abs(${shiftStr(hh)})` : `(${shiftStr(hh)})^2`;
      return plus(typeof aa === 'string' ? `${aa}${body}` : coef(aa, body), kk);
    };
    const ans = build(aStr, h, k);
    const f = fnOf(ans);
    const fig = plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], points: [{ x: h, y: k }, { x: h + 1, y: f(h + 1) }] });
    const prompt = `The graph of $g$ shown is a transformation of the parent function $f(x)=${parent.tex.replace('y=', '')}$. Two points on the graph are marked.\n\n${fig}\n\n`;
    const hint = 'Start with the vertex to find the shifts. Then move 1 unit right from the vertex and see how far the graph rises or falls to find the stretch and any reflection.';
    if (level === 0) {
      const wrongs = [build(a, -h, k), build(a, h, -k), build(-a, h, k), build(a, k, h)];
      return { prompt: `${prompt}Which rule defines $g$?`, parts: [mc(rng, `$g(x)=${T(ans)}$`, wrongs.map((w) => `$g(x)=${T(w)}$`))], hint };
    }
    return { prompt: `${prompt}Write a rule for $g(x)$.`, parts: [expr(ans, { label: '$g(x)=$' })], hint };
  },
};

// ---------- Lesson 3.3 ----------

function casesTex(pieces) {
  return `\\begin{cases}${pieces.map(([e, c]) => `${e} & ${c}`).join(' \\\\ ')}\\end{cases}`;
}

const evaluatePiecewise = {
  id: 'evaluate-piecewise-functions',
  lesson: '3.3',
  title: 'Evaluating Piecewise Functions',
  gen(rng, level) {
    const c = rng.int(-3, 3);
    if (level === 0) {
      const p1 = polyStr([rng.nz(-4, 4), rng.int(-6, 6)]);
      const p2 = polyStr([1, 0, rng.int(-6, 6)]);
      const x = rng.bool() ? c - rng.int(1, 4) : c + rng.int(1, 4);
      const value = x < c ? fnOf(p1)(x) : fnOf(p2)(x);
      return {
        prompt: `Evaluate $f(${x})$ for the piecewise function\n\n$$f(x)=${casesTex([[T(p1), `x<${c}`], [T(p2), `x\\ge ${c}`]])}$$`,
        parts: [num(value, { label: `$f(${x})=$` })],
        hint: `First decide which condition the input $${x}$ satisfies. Only that row's rule is used.`,
      };
    }
    if (level === 1) {
      const d = c + rng.int(2, 4);
      const p1 = polyStr([rng.nz(-4, 4), rng.int(-6, 6)]);
      const p2 = polyStr([rng.pick([-1, 1]), 0, rng.int(-6, 6)]);
      const p3 = String(rng.int(-9, 9));
      const x = rng.pick([c, d]);
      const value = x < c ? fnOf(p1)(x) : x <= d ? fnOf(p2)(x) : Number(p3);
      // the boundary c belongs to the middle piece and d belongs to the middle piece
      return {
        prompt: `Evaluate $f(${x})$ for the piecewise function\n\n$$f(x)=${casesTex([[T(p1), `x<${c}`], [T(p2), `${c}\\le x\\le ${d}`], [T(p3), `x>${d}`]])}$$`,
        parts: [num(value, { label: `$f(${x})=$` })],
        hint: 'The input sits right at a boundary. Look closely at which inequality includes "or equal to".',
      };
    }
    for (let tries = 0; tries < 300; tries++) {
      const m1 = rng.nz(-3, 3);
      const b1 = rng.int(-6, 6);
      const m2 = rng.nz(-3, 3);
      const b2 = rng.int(-6, 6);
      const x1 = c - rng.int(1, 5);
      const k = m1 * x1 + b1;
      const x2 = (k - b2) / m2;
      if (!Number.isInteger(x2) || (m1 === m2 && b1 === b2)) continue;
      const sols = [x1];
      if (x2 >= c) sols.push(x2);
      return {
        prompt: `Find all values of $x$ for which $f(x)=${k}$. Separate multiple answers with commas.\n\n$$f(x)=${casesTex([[T(polyStr([m1, b1])), `x<${c}`], [T(polyStr([m2, b2])), `x\\ge ${c}`]])}$$`,
        parts: [set(sols, { label: '$x=$' })],
        hint: 'Solve the equation using each rule separately. Then check each solution against the condition for its own row and keep only the ones that fit.',
      };
    }
    throw new Error('piecewise solve failed');
  },
};

const piecewiseGraph = {
  id: 'piecewise-graphs',
  lesson: '3.3',
  title: 'Reading Piecewise Graphs',
  gen(rng, level) {
    for (let tries = 0; tries < 300; tries++) {
      const c = rng.int(-2, 2);
      const m1 = rng.pick([-2, -1, 1, 2]);
      const m2 = rng.pick([-2, -1, 0, 1, 2]);
      const y1c = rng.int(-5, 5);
      const y2c = rng.intExcept(-5, 5, [y1c, y1c + 1, y1c - 1]);
      const left = (x) => y1c + m1 * (x - c);
      const right = (x) => y2c + m2 * (x - c);
      const xl = c - 4;
      const xr = c + 4;
      if ([left(xl), right(xr)].some((v) => Math.abs(v) > 7)) continue;
      const leftClosed = rng.bool();
      const fig = plot({
        x: [-8, 8], y: [-8, 8],
        paths: [{ pts: [[xl, left(xl)], [c, y1c]] }, { pts: [[c, y2c], [xr, right(xr)]] }],
        points: [{ x: xl, y: left(xl) }, { x: xr, y: right(xr) }, { x: c, y: y1c, open: !leftClosed }, { x: c, y: y2c, open: leftClosed }],
      });
      const intro = `The graph of the piecewise function $f$ is shown.\n\n${fig}\n\n`;
      if (level === 0) {
        const x = rng.pick([xl + 1, xl + 2, xr - 1, xr - 2]);
        return {
          prompt: `${intro}Find $f(${x})$.`,
          parts: [num(x < c ? left(x) : right(x), { label: `$f(${x})=$` })],
          hint: `Locate $x=${x}$ on the horizontal axis and read the height of the graph there.`,
        };
      }
      if (level === 1) {
        return {
          prompt: `${intro}Find $f(${c})$.`,
          parts: [num(leftClosed ? y1c : y2c, { label: `$f(${c})=$` })],
          hint: 'At a jump, an open circle means the point is not part of the graph, and a filled circle means it is.',
        };
      }
      // a height reached by exactly one piece, at an integer input other than the jump
      const options = [];
      for (let x = xl; x <= xr; x++) {
        if (x === c) continue;
        const y = x < c ? left(x) : right(x);
        const hitsLeft = m1 !== 0 && (y - y1c) / m1 + c >= xl && (y - y1c) / m1 + c <= c;
        const hitsRight = m2 === 0 ? y === y2c : (y - y2c) / m2 + c >= c && (y - y2c) / m2 + c <= xr;
        if ((x < c && !hitsRight) || (x > c && !hitsLeft && m2 !== 0)) options.push([x, y]);
      }
      if (!options.length) continue;
      const [x, y] = rng.pick(options);
      return {
        prompt: `${intro}Find the value of $x$ for which $f(x)=${y}$.`,
        parts: [num(x, { label: '$x=$' })],
        hint: `Picture the horizontal line $y=${y}$ and find where it meets the graph. Make sure the meeting point is a real point of the graph, not an open circle.`,
      };
    }
    throw new Error('piecewise graph failed');
  },
};

const piecewiseContinuity = {
  id: 'connecting-piecewise-pieces',
  lesson: '3.3',
  title: 'Making Piecewise Pieces Meet',
  gen(rng, level) {
    const c = rng.nz(-3, 3);
    const k = rng.nz(-5, 5);
    let first;
    let secondTex;
    let meet;
    if (level < 2) {
      const a = rng.nz(-4, 4);
      const b = rng.int(-6, 6);
      first = polyStr([a, b]);
      meet = a * c + b;
    } else {
      const b = rng.int(-4, 4);
      first = polyStr([rng.pick([-1, 1]), b, rng.int(-5, 5)]);
      meet = fnOf(first)(c);
    }
    if (level === 0) {
      // second piece: x + k
      const kk = meet - c;
      return build(`x+k`, kk);
    }
    // second piece: kx + d
    const d = meet - k * c;
    secondTex = `kx${d === 0 ? '' : d > 0 ? `+${d}` : `-${-d}`}`;
    return build(secondTex, k);

    function build(second, answer) {
      return {
        prompt: `For what value of the constant $k$ do the two pieces of the graph of $f$ meet at $x=${c}$, so that the graph has no jump?\n\n$$f(x)=${casesTex([[T(first), `x<${c}`], [second, `x\\ge ${c}`]])}$$`,
        parts: [num(answer, { label: '$k=$' })],
        hint: `The two rules must give the same output at $x=${c}$. Evaluate both at that input and set them equal.`,
      };
    }
  },
};

const piecewiseContext = {
  id: 'piecewise-models',
  lesson: '3.3',
  title: 'Piecewise Models in Context',
  gen(rng, level) {
    const scen = rng.pick([
      () => {
        const base = rng.int(3, 6);
        const h = rng.int(2, 3);
        const extra = rng.int(1, base - 1);
        return {
          text: `A parking garage charges ${base} dollars per hour for the first ${h} hours and ${extra} dollars for each additional hour.`,
          cost: (t) => (t <= h ? base * t : base * h + extra * (t - h)),
          cut: h,
          unit: 'hours',
          ask: (t) => `What is the total cost to park for ${t} hours?`,
          back: (cst) => `A driver paid ${cst} dollars. For how many hours was the car parked?`,
        };
      },
      () => {
        const flat = rng.int(25, 45);
        const g = rng.pick([5, 8, 10]);
        const over = rng.pick([3, 4, 5, 6]);
        return {
          text: `A phone plan costs ${flat} dollars per month and includes ${g} gigabytes of data. Each additional gigabyte costs ${over} dollars.`,
          cost: (t) => (t <= g ? flat : flat + over * (t - g)),
          cut: g,
          unit: 'gigabytes',
          ask: (t) => `What is the monthly cost when ${t} gigabytes are used?`,
          back: (cst) => `One month the bill was ${cst} dollars. How many gigabytes were used?`,
        };
      },
      () => {
        const rate = rng.int(12, 20);
        const h = 40;
        const ot = rate * 1.5;
        return {
          text: `A worker earns ${rate} dollars per hour for the first ${h} hours in a week and ${ot} dollars per hour for each hour beyond ${h}.`,
          cost: (t) => (t <= h ? rate * t : rate * h + ot * (t - h)),
          cut: h,
          unit: 'hours',
          ask: (t) => `How much does the worker earn in a week with ${t} hours of work?`,
          back: (cst) => `One week the worker earned ${commas(cst)} dollars. How many hours did the worker work?`,
        };
      },
    ])();
    const above = scen.cut + rng.int(2, 8);
    if (level === 0) {
      const t = scen.cut - rng.int(0, 1);
      return {
        prompt: `${scen.text}\n\n${scen.ask(t)}`,
        parts: [num(scen.cost(t), { suffix: 'dollars' })],
        hint: `Compare the input with ${scen.cut} ${scen.unit} to decide which pricing rule applies.`,
      };
    }
    if (level === 1) {
      return {
        prompt: `${scen.text}\n\n${scen.ask(above)}`,
        parts: [num(scen.cost(above), { suffix: 'dollars' })],
        hint: `Split the total into two parts: the amount up to ${scen.cut} ${scen.unit}, and the amount beyond it. Each part uses its own rate.`,
      };
    }
    return {
      prompt: `${scen.text}\n\n${scen.back(scen.cost(above))}`,
      parts: [num(above, { suffix: scen.unit })],
      hint: `First find the cost at exactly ${scen.cut} ${scen.unit}. The amount beyond that tells you how many extra ${scen.unit} there were.`,
    };
  },
};

// ---------- Lesson 3.4 ----------

const modelFromTable = {
  id: 'select-model-from-table',
  lesson: '3.4',
  title: 'Selecting a Model from a Table',
  gen(rng, level) {
    const kinds = level === 2 ? ['Linear', 'Quadratic', 'Cubic', 'Exponential'] : ['Linear', 'Quadratic', 'Exponential'];
    const kind = rng.pick(kinds);
    const h = level === 0 ? 1 : rng.pick([2, 3, 5]);
    const x0 = rng.int(0, 3) * h;
    const n = kind === 'Cubic' || level === 2 ? 6 : 5;
    const idx = Array.from({ length: n }, (_, i) => i);
    const xs = idx.map((i) => x0 + i * h);
    let ys;
    if (kind === 'Linear') {
      const m = rng.nz(-7, 7);
      const b = rng.int(-9, 20);
      ys = idx.map((i) => b + m * i);
    } else if (kind === 'Quadratic') {
      const a = rng.nz(-3, 3);
      const b = rng.int(-5, 5);
      const c = rng.int(-9, 9);
      ys = idx.map((i) => a * i * i + b * i + c);
    } else if (kind === 'Cubic') {
      const a = rng.pick([-1, 1, 2]);
      const b = rng.int(-3, 3);
      const c = rng.int(-9, 9);
      ys = idx.map((i) => a * (i - 2) ** 3 + b * (i - 2) + c);
    } else if (rng.bool()) {
      const b = rng.pick([2, 3]);
      const a = rng.pick([1, 2, 3, 4, 5]);
      ys = idx.map((i) => a * b ** i);
    } else {
      const a = rng.pick([3, 5, 7]) * 2 ** (n - 1);
      ys = idx.map((i) => a / 2 ** i);
    }
    return {
      prompt: `Selected values of a function $f$ are shown. The inputs are equally spaced.\n\n${htable('$x$', xs, '$f(x)$', ys)}\n\nWhich type of function best models the data?`,
      parts: [mcFixed(kinds, kinds.indexOf(kind))],
      hint: 'Test the outputs two ways: look at successive differences (and differences of differences), and look at successive ratios.',
    };
  },
};

const modelFromContext = {
  id: 'select-model-from-context',
  lesson: '3.4',
  title: 'Selecting a Model from a Description',
  gen(rng, level) {
    const kinds = ['Linear', 'Quadratic', 'Cubic', 'Exponential', 'Rational (inverse variation)'];
    const p = rng.int(2, 9);
    const n = rng.int(2, 6) * 100;
    const bank = [
      [
        [`A plumber charges a flat fee of ${n / 10} dollars plus ${p * 10} dollars per hour. The total cost depends on the number of hours worked.`, 0],
        [`A candle burns down ${p} millimeters every minute. Its height depends on the number of minutes it has been burning.`, 0],
        [`A colony of bacteria doubles every ${p} hours. The population depends on the number of hours that have passed.`, 3],
        [`An investment grows by ${p} percent every year. Its value depends on the number of years invested.`, 3],
        ['The area of a square patio depends on the length of its side.', 1],
      ],
      [
        [`A car loses ${p + 8} percent of its value each year. Its value depends on its age in years.`, 3],
        ['The volume of a cube-shaped box depends on the length of its edge.', 2],
        [`A trip is ${n} miles long. The time the trip takes depends on the average driving speed.`, 4],
        [`A bill of ${n} dollars is split equally among a group of friends. Each share depends on the number of friends.`, 4],
        ['The area of a circular garden depends on its radius.', 1],
        ['The volume of a spherical balloon depends on its radius.', 2],
        [`A subscription costs ${p + 5} dollars per month. The total paid depends on the number of months.`, 0],
      ],
      [
        ['Over equal-length input intervals, the output values change by a constant amount.', 0],
        ['Over equal-length input intervals, the output values change by a constant ratio.', 3],
        ['Over equal-length input intervals, the second differences of the output values are constant and nonzero.', 1],
        ['Over equal-length input intervals, the third differences of the output values are constant and nonzero.', 2],
        ['The output values are inversely proportional to the input values.', 4],
        ['The average rates of change over consecutive equal-length intervals themselves change at a constant nonzero rate.', 1],
        ['The product of each input value and its output value is always the same nonzero number.', 4],
        ['Each time the input increases by 1, the output is multiplied by the same positive number other than 1.', 3],
      ],
    ];
    const [text, idx] = rng.pick(bank[level]);
    return {
      prompt: `${level === 2 ? 'A function has the following property.' : 'Consider the following situation.'}\n\n<b>${text}</b>\n\nWhich type of function is the most appropriate model?`,
      parts: [mcFixed(kinds, idx)],
      hint: 'Ask how the output changes when the input goes up by one step: by adding the same amount, by multiplying by the same factor, or in some other pattern.',
    };
  },
};

const modelDomain = {
  id: 'domain-of-a-model',
  lesson: '3.4',
  title: 'Domain Restrictions of a Model',
  gen(rng, level) {
    if (level === 0) {
      const m = rng.pick([5, 8, 10, 12, 15, 20]);
      const end = rng.int(4, 12);
      return {
        prompt: `A tank is being drained. The amount of water remaining, in gallons, is modeled by $W(t)=${m * end}-${m}t$, where $t$ is the time in minutes since draining began.\n\nThe model only makes sense from the start of draining until the tank is empty. Write this domain in interval notation.`,
        parts: [interval(`[0, ${end}]`, { flex: true, label: 'Domain:' })],
        hint: 'Time starts at 0. Find the time at which the amount of water reaches zero.',
      };
    }
    const r = rng.int(2, 6);
    const g = rng.pick([16, 5]);
    const unit = g === 16 ? 'feet' : 'meters';
    const str = level === 1 ? `-${g}t^2+${g * r}t` : `-${g}t^2+${g * (r - 1)}t+${g * r}`;
    const thing = rng.pick(['ball', 'rock', 'toy rocket', 'water balloon']);
    return {
      prompt: `The height of a ${thing}, in ${unit}, $t$ seconds after it is ${level === 1 ? 'launched from the ground' : 'launched from a platform'} is modeled by $h(t)=${T(str, ['t'])}$.\n\nThe model applies from the moment of launch until the ${thing} hits the ground. Write this domain in interval notation.`,
      parts: [interval(`[0, ${r}]`, { flex: true, label: 'Domain:' })],
      hint: 'The object hits the ground when its height is 0. Factor the expression to find that time, and ignore any time that is negative.',
    };
  },
};

// ---------- Lesson 3.5 ----------

const constructModel = {
  id: 'construct-polynomial-models',
  lesson: '3.5',
  title: 'Constructing Quadratic and Cubic Models',
  gen(rng, level) {
    const a = rng.pick([-3, -2, -1, 2, 3]);
    if (level < 2) {
      const h = rng.nz(-5, 5);
      const k = rng.int(-8, 8);
      const dx = level === 0 ? 1 : rng.pick([2, 3, -2]);
      const ans = plus(coef(a, `(${shiftStr(h)})^2`), k);
      return {
        prompt: `A quadratic function $f$ has its vertex at $(${h}, ${k})$ and passes through the point $(${h + dx}, ${k + a * dx * dx})$.\n\nWrite a rule for $f(x)$.`,
        parts: [expr(ans, { label: '$f(x)=$' })],
        hint: 'Start from vertex form $a(x-h)^2+k$ with the vertex filled in. Then substitute the other point to solve for $a$.',
      };
    }
    const cubic = rng.bool();
    const roots = rng.sample([-4, -3, -2, -1, 1, 2, 3, 4], cubic ? 3 : 2).sort((x, y) => x - y);
    const x0 = rng.intExcept(-2, 2, roots);
    const y0 = a * roots.reduce((acc, r) => acc * (x0 - r), 1);
    const ans = `${a === -1 ? '-' : a}${roots.map((r) => factorStr(r)).join('')}`;
    return {
      prompt: `A ${cubic ? 'cubic' : 'quadratic'} function $f$ has zeros at $x=${roots.join('$, $x=')}$ and passes through the point $(${x0}, ${y0})$.\n\nWrite a rule for $f(x)$. You may leave your answer in factored form.`,
      parts: [expr(ans, { label: '$f(x)=$' })],
      hint: 'Each zero gives a factor. Write $f(x)=a(\\ldots)(\\ldots)$ with an unknown $a$, then use the extra point to find $a$.',
    };
  },
};

const inverseVariation = {
  id: 'inverse-variation',
  lesson: '3.5',
  title: 'Inverse Variation Models',
  gen(rng, level) {
    if (level === 0) {
      const x1 = rng.int(2, 6);
      const x2 = rng.intExcept(2, 8, [x1]);
      const y1 = x2 * rng.int(1, 5);
      return {
        prompt: `The quantity $y$ is inversely proportional to $x$. When $x=${x1}$, $y=${y1}$.\n\nFind $y$ when $x=${x2}$.`,
        parts: [numFrac(x1 * y1, x2, { label: '$y=$' })],
        hint: 'Inverse variation means $y=\\frac{k}{x}$, so the product $xy$ stays constant. Find that constant first.',
      };
    }
    if (level === 1) {
      const d1 = rng.int(2, 5);
      const d2 = rng.intExcept(2, 6, [d1]);
      const i1 = d2 * d2 * rng.int(1, 4);
      const [p, q] = reduce(i1 * d1 * d1, d2 * d2);
      return {
        prompt: `The intensity $I$ of light from a lamp varies inversely with the <b>square</b> of the distance $d$ from the lamp. At a distance of ${d1} meters, the intensity is ${i1} units.\n\nFind the intensity at a distance of ${d2} meters.`,
        parts: [numFrac(p, q, { label: '$I=$', suffix: 'units' })],
        hint: 'Here $I=\\frac{k}{d^2}$, so the product $I\\cdot d^2$ stays constant. Use the given pair to find $k$.',
      };
    }
    const x1 = rng.int(2, 6);
    const y1 = rng.int(2, 6);
    const k = rng.int(2, 5);
    const z1 = (k * x1) / y1;
    const x2 = rng.int(2, 9);
    const y2 = rng.int(2, 6);
    const [zn, zd] = reduce(k * x1, y1);
    return {
      prompt: `The quantity $z$ varies directly with $x$ and inversely with $y$. When $x=${x1}$ and $y=${y1}$, $z=${Number.isInteger(z1) ? z1 : `\\frac{${zn}}{${zd}}`}$.\n\nFind $z$ when $x=${x2}$ and $y=${y2}$.`,
      parts: [numFrac(k * x2, y2, { label: '$z=$' })],
      hint: 'The model is $z=\\frac{kx}{y}$. Use the first set of values to find $k$, then apply the model to the second set.',
    };
  },
};

const geometricModels = {
  id: 'construct-geometric-models',
  lesson: '3.5',
  title: 'Building Models from Geometry',
  gen(rng, level) {
    if (level === 0) {
      const P = rng.int(10, 40) * 2;
      return {
        prompt: `A rectangle has a perimeter of ${P} centimeters. Let $x$ be the width of the rectangle, in centimeters.\n\nWrite a function $A(x)$ for the area of the rectangle in terms of $x$.`,
        parts: [expr(`x(${P / 2}-x)`, { label: '$A(x)=$', domain: [1, 9] })],
        hint: 'Use the perimeter to write the length in terms of $x$. Then area is width times length.',
      };
    }
    if (level === 1) {
      const a = rng.int(5, 12) * 2;
      const b = a + rng.int(1, 6) * 2;
      return {
        prompt: `An open box is made from a ${a} inch by ${b} inch sheet of cardboard by cutting a square of side $x$ inches from each corner and folding up the sides.\n\nWrite a function $V(x)$ for the volume of the box.`,
        parts: [expr(`x(${a}-2x)(${b}-2x)`, { label: '$V(x)=$', domain: [0.5, 4] })],
        hint: 'After the corners are removed, each side of the base is shorter by two cuts. The height of the box is the size of the cut.',
      };
    }
    if (rng.bool()) {
      const F = rng.int(8, 30) * 6;
      return {
        prompt: `A farmer has ${F} feet of fencing to build a rectangular pen that is divided into two equal parts by a fence parallel to one pair of sides. Let $x$ be the length, in feet, of each of the three parallel fence pieces.\n\nWrite a function $A(x)$ for the total area of the pen.`,
        parts: [expr(`x(${F}-3x)/2`, { label: '$A(x)=$', domain: [1, 9] })],
        hint: 'Three pieces have length $x$. The fencing left over is shared equally by the two remaining sides.',
      };
    }
    const V = rng.int(2, 9) * 100;
    return {
      prompt: `A closed cylindrical can must hold ${V} cubic centimeters. Let $r$ be its radius in centimeters.\n\nWrite a function $S(r)$ for the total surface area of the can in terms of $r$ only. Type pi for $\\pi$.`,
      parts: [expr(`2pi r^2+${2 * V}/r`, { label: '$S(r)=$', vars: ['r'], domain: [1, 6] })],
      hint: 'Use the volume formula $V=\\pi r^2h$ to write the height in terms of $r$. Then substitute into the surface area formula $2\\pi r^2+2\\pi rh$.',
    };
  },
};

export default [
  identifyParent, parentDomainRange, evaluateParent, parentProperties,
  describeTransformation, writeTransformed, transformPoint, graphToEquation,
  evaluatePiecewise, piecewiseGraph, piecewiseContinuity, piecewiseContext,
  modelFromTable, modelFromContext, modelDomain,
  constructModel, inverseVariation, geometricModels,
];
