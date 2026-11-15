// Unit 1: Functions and Rates of Change (Lessons 1.1 to 1.6)

import {
  T, polyStr, polyEval, fracStr, fracTex, round, htable, table, num, numFrac, expr, interval, set, point, mc, mcFixed,
  shiftStr, plus, coef, commas,
} from '../lib/fmt.js';
import { fnOf } from '../lib/expr.js';
import { plot } from '../lib/graph.js';

// ---------- shared builders (also used by later units) ----------

// Cubic with turning points at x = p and x = q, shifted so its midpoint value is mid.
export function cubicTurning(p, q, s, mid = 0) {
  const raw = (x) => s * (x ** 3 / 3 - ((p + q) * x * x) / 2 + p * q * x);
  const c = mid - raw((p + q) / 2);
  return (x) => raw(x) + c;
}

// Random piecewise linear graph with integer vertices on [-6, 6].
export function zigzag(rng) {
  for (let tries = 0; tries < 200; tries++) {
    const xs = [-6, -3 + rng.int(-1, 1), rng.int(-1, 1), 3 + rng.int(-1, 1), 6];
    let dir = rng.sign();
    const ys = [rng.int(-3, 3)];
    for (let i = 1; i < xs.length; i++) {
      ys.push(ys[i - 1] + dir * rng.int(2, 6));
      dir = -dir;
    }
    if (ys.every((y) => Math.abs(y) <= 7)) return xs.map((x, i) => [x, ys[i]]);
  }
  return [[-6, -2], [-3, 4], [0, -1], [3, 5], [6, 1]];
}

export function zigzagValue(pts, x) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return NaN;
}

function zigzagSolve(pts, k) {
  const xs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if ((k - y0) * (k - y1) <= 0 && y0 !== y1) {
      const x = x0 + ((k - y0) * (x1 - x0)) / (y1 - y0);
      if (!xs.some((v) => Math.abs(v - x) < 1e-9)) xs.push(x);
    }
  }
  return xs;
}

const zigzagPlot = (pts, extra = {}) =>
  plot({ x: [-8, 8], y: [-8, 8], paths: [{ pts }], points: [pts[0], pts[pts.length - 1]].map(([x, y]) => ({ x, y })), ...extra });

const FN = ['f', 'g', 'h'];

// Classify a table as linear, quadratic, or neither (used in 1.5, 1.6, and 3.4).
export function classifyTable(rng, level, kinds = ['linear', 'quadratic', 'neither']) {
  const kind = rng.pick(kinds);
  const h = level === 0 ? 1 : rng.pick([2, 3, 5]);
  const x0 = rng.int(-2, 3) * (level === 0 ? 1 : h);
  const xs = [0, 1, 2, 3, 4].map((i) => x0 + i * h);
  let ys;
  if (kind === 'linear') {
    const m = rng.nz(-6, 6);
    const b = rng.int(-9, 9);
    ys = xs.map((x) => m * x + b);
  } else if (kind === 'quadratic') {
    const a = rng.nz(-2, 2);
    const b = rng.int(-4, 4);
    const c = rng.int(-6, 6);
    ys = xs.map((x) => a * x * x + b * x + c);
  } else if (rng.bool() || level === 0) {
    const b = rng.pick([2, 3]);
    const a = rng.pick([1, 2, 3, 5]);
    ys = [0, 1, 2, 3, 4].map((i) => a * b ** i);
  } else {
    const a = rng.pick([-1, 1]);
    const c = rng.int(-5, 5);
    ys = [0, 1, 2, 3, 4].map((i) => a * (i - 1) ** 3 + c);
  }
  return { kind, xs, ys };
}

// ---------- Lesson 1.1 ----------

const evaluateFunction = {
  id: 'evaluate-function',
  lesson: '1.1',
  title: 'Evaluating Functions',
  gen(rng, level) {
    const name = rng.pick(FN);
    let str;
    let a;
    if (level === 0) {
      str = polyStr([rng.nz(-6, 6), rng.int(-9, 9)]);
      a = rng.int(-5, 8);
    } else if (level === 1) {
      str = polyStr([rng.nz(-3, 3), rng.int(-6, 6), rng.int(-9, 9)]);
      a = rng.nz(-5, 5);
    } else {
      const kind = rng.int(0, 2);
      if (kind === 0) {
        // square root with a perfect square inside
        const r = rng.int(2, 7);
        const m = rng.int(1, 4);
        a = rng.int(1, 6);
        const b = r * r - m * a;
        str = plus(`${rng.nz(-3, 3)}sqrt(${plus(coef(m, 'x'), b)})`, rng.int(-5, 5));
      } else if (kind === 1) {
        a = rng.nz(-4, 4);
        const d = rng.intExcept(-5, 5, [a, 0]);
        const c = [rng.nz(-3, 3), rng.int(-5, 5), rng.int(-6, 6)];
        const dm = a - d;
        const need = polyEval(c, a);
        // tweak the constant so the quotient is an integer
        c[2] += dm * Math.round(need / dm) - need;
        str = `(${polyStr(c)})/(${shiftStr(d)})`;
      } else {
        a = -rng.int(1, 4);
        str = polyStr([rng.nz(-2, 2), rng.int(-4, 4), rng.int(-5, 5), rng.int(-9, 9)]);
      }
    }
    const value = round(fnOf(str)(a), 6);
    return {
      prompt: `Given the function $${name}(x)=${T(str)}$, find $${name}(${a})$.`,
      parts: [num(value, { label: `$${name}(${a})=$` })],
      hint: `Replace every $x$ with $(${a})$, keeping the parentheses, then follow the order of operations.`,
    };
  },
};

const functionFromWords = {
  id: 'function-from-words',
  lesson: '1.1',
  title: 'Writing Function Rules from Words',
  gen(rng, level) {
    const name = rng.pick(FN);
    const a = rng.int(2, 9);
    const b = rng.int(1, 9);
    const c = rng.int(2, 6);
    const options = [
      [
        [`Multiply by ${a}, then subtract ${b}`, `${a}x-${b}`],
        [`Add ${b}, then multiply by ${a}`, `${a}(x+${b})`],
        [`Subtract ${b}, then divide by ${a}`, `(x-${b})/${a}`],
        [`Divide by ${a}, then add ${b}`, `x/${a}+${b}`],
      ],
      [
        [`Square the input, then subtract ${b}`, `x^2-${b}`],
        [`Subtract ${b}, then square the result`, `(x-${b})^2`],
        [`Add ${b}, take the square root, then divide by ${a}`, `sqrt(x+${b})/${a}`],
        [`Square the input, multiply by ${a}, then add ${b}`, `${a}x^2+${b}`],
        [`Take the square root, then multiply by ${a}`, `${a}sqrt(x)`],
      ],
      [
        [`Subtract ${b}, square the result, multiply by ${a}, then add ${c}`, `${a}(x-${b})^2+${c}`],
        [`Multiply by ${a}, add ${b}, take the square root, then subtract ${c}`, `sqrt(${a}x+${b})-${c}`],
        [`Square the input, subtract ${b}, then divide ${c} by the result`, `${c}/(x^2-${b})`],
        [`Add ${b}, cube the result, then divide by ${a}`, `(x+${b})^3/${a}`],
        [`Multiply by ${a}, subtract the result from ${b}, then square`, `(${b}-${a}x)^2`],
      ],
    ];
    const [words, rule] = rng.pick(options[level]);
    return {
      prompt: `A function $${name}$ takes an input $x$ and does the following: <b>${words}.</b>\n\nWrite a rule for $${name}(x)$.`,
      parts: [expr(rule, { label: `$${name}(x)=$`, domain: [0.5, 6] })],
      hint: 'Build the rule one step at a time. Use parentheses whenever a step applies to everything done so far.',
    };
  },
};

const isFunction = {
  id: 'is-a-function',
  lesson: '1.1',
  title: 'Identifying Functions',
  gen(rng, level) {
    if (level === 2) {
      const k = rng.int(2, 9);
      const items = [
        [`y=${T(`${k}x^2-${rng.int(1, 9)}`)}`, true],
        [`x=y^2+${k}`, false],
        [`y=\\left|x-${k}\\right|`, true],
        [`x^2+y^2=${k * k}`, false],
        [`y=\\sqrt{x+${k}}`, true],
        [`x=\\left|y\\right|-${k}`, false],
        [`y=x^3-${k}x`, true],
        [`y^2=${k}x`, false],
        [`y=${k}`, true],
        [`x=${k}`, false],
      ];
      const [eq, yes] = rng.pick(items);
      return {
        prompt: `Does the equation below define $y$ as a function of $x$?\n\n$$${eq}$$`,
        parts: [mcFixed(['Yes, $y$ is a function of $x$', 'No, $y$ is not a function of $x$'], yes ? 0 : 1)],
        hint: 'Pick an $x$ value and ask how many $y$ values go with it. A function allows only one.',
      };
    }
    const yes = rng.bool();
    const n = level === 0 ? 5 : 6;
    let xs = rng.shuffle([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]).slice(0, n);
    const ys = xs.map(() => rng.int(-6, 9));
    if (!yes) {
      // repeat one input with a different output
      const i = rng.int(1, n - 1);
      xs[i] = xs[0];
      if (ys[i] === ys[0]) ys[i] += rng.int(1, 3);
    } else if (level === 1) {
      // repeated outputs are fine, and a repeated identical pair is fine too
      ys[1] = ys[0];
    }
    const order = rng.shuffle(xs.map((x, i) => i));
    xs = order.map((i) => xs[i]);
    const yy = order.map((i) => ys[i]);
    const shown =
      level === 0
        ? `$$\\{${xs.map((x, i) => `(${x},${yy[i]})`).join(',\\ ')}\\}$$`
        : htable('Input', xs, 'Output', yy);
    return {
      prompt: `Does the ${level === 0 ? 'set of ordered pairs' : 'table'} below represent a function?\n\n${shown}`,
      parts: [mcFixed(['Yes, it is a function', 'No, it is not a function'], yes ? 0 : 1)],
      hint: 'Look for an input that appears more than once. If it does, compare the outputs that go with it.',
    };
  },
};

const domainOfFunction = {
  id: 'domain',
  lesson: '1.1',
  title: 'Domain of a Function',
  gen(rng, level) {
    const a = rng.nz(-8, 8);
    let str;
    let ans;
    let hint = 'Ask which inputs would cause trouble: a negative under a square root or a zero in a denominator.';
    if (level === 0) {
      str = `sqrt(${shiftStr(a)})`;
      ans = `[${a}, inf)`;
    } else if (level === 1) {
      if (rng.bool()) {
        const m = rng.int(2, 5);
        const k = rng.int(1, 6);
        str = `sqrt(${m * k}-${m}x)`;
        ans = `(-inf, ${k}]`;
      } else {
        str = `${rng.int(1, 9)}/(${shiftStr(a)})`;
        ans = `(-inf, ${a}) U (${a}, inf)`;
      }
    } else if (rng.bool()) {
      str = `${rng.int(1, 9)}/sqrt(${shiftStr(a)})`;
      ans = `(${a}, inf)`;
      hint = 'There are two restrictions at once here: the square root and the denominator. Combine them.';
    } else {
      const b = rng.intExcept(-8, 8, [a, 0]);
      const [p, q] = [Math.min(a, b), Math.max(a, b)];
      str = `(x+${rng.int(1, 5)})/((${shiftStr(p)})(${shiftStr(q)}))`;
      ans = `(-inf, ${p}) U (${p}, ${q}) U (${q}, inf)`;
    }
    return {
      prompt: `Find the domain of the function. Write your answer in interval notation.\n\n$$f(x)=${T(str)}$$`,
      parts: [interval(ans, { label: 'Domain:' })],
      hint,
    };
  },
};

const functionInContext = {
  id: 'function-in-context',
  lesson: '1.1',
  title: 'Function Notation in Context',
  gen(rng, level) {
    const scen = rng.pick([
      () => {
        const b = rng.pick([206, 208, 211, 220]);
        const m = rng.pick([0.5, 0.8, 0.7, 1]);
        return {
          text: `Researchers estimate the maximum heart rate $H(x)$, in beats per minute, of a person who is $x$ years old with the function $H(x)=${b}-${m === 1 ? '' : m}x$.`,
          f: (x) => b - m * x,
          name: 'H',
          inputs: [20, 30, 40, 50, 60],
          unit: 'beats per minute',
          inputWord: 'age',
        };
      },
      () => {
        const fee = rng.int(15, 40);
        const rate = rng.pick([0.2, 0.25, 0.4, 0.5]);
        return {
          text: `A rental company charges $C(m)$ dollars to rent a truck and drive it $m$ miles, where $C(m)=${fee}+${rate}m$.`,
          f: (x) => fee + rate * x,
          name: 'C',
          inputs: [40, 60, 80, 100, 120],
          unit: 'dollars',
          inputWord: 'number of miles',
        };
      },
      () => {
        const start = rng.int(60, 95) * 10;
        const rate = rng.pick([12, 15, 18, 24, 25]);
        return {
          text: `A water tank is draining. The amount of water left after $t$ minutes is $W(t)=${start}-${rate}t$ gallons.`,
          f: (x) => start - rate * x,
          name: 'W',
          inputs: [5, 10, 15, 20, 25],
          unit: 'gallons',
          inputWord: 'number of minutes',
        };
      },
    ])();
    const x = rng.pick(scen.inputs);
    const y = round(scen.f(x), 4);
    if (level === 0) {
      return {
        prompt: `${scen.text}\n\nFind $${scen.name}(${x})$.`,
        parts: [num(y, { label: `$${scen.name}(${x})=$`, suffix: scen.unit })],
        hint: `The notation $${scen.name}(${x})$ means the input is ${x}. Substitute it into the formula.`,
      };
    }
    if (level === 1) {
      return {
        prompt: `${scen.text}\n\nFind the ${scen.inputWord} for which the output of the function is ${y} ${scen.unit}.`,
        parts: [num(x, { label: `Input $=$` })],
        hint: `This time the output is given. Set the formula equal to ${y} and solve for the input.`,
      };
    }
    const x2 = rng.pick(scen.inputs.filter((v) => v !== x));
    return {
      prompt: `${scen.text}\n\nFind $${scen.name}(${x2})-${scen.name}(${x})$.`,
      parts: [num(round(scen.f(x2) - scen.f(x), 4), { label: `$${scen.name}(${x2})-${scen.name}(${x})=$`, suffix: scen.unit })],
      hint: 'Evaluate the function at each input separately, then subtract the two outputs in the order shown.',
    };
  },
};

// ---------- Lesson 1.2 ----------

const increasingDecreasing = {
  id: 'increasing-decreasing',
  lesson: '1.2',
  title: 'Increasing and Decreasing Intervals',
  gen(rng, level) {
    if (level === 0) {
      const h = rng.int(-4, 4);
      const k = rng.int(-5, 5);
      const a = rng.sign() * rng.pick([0.5, 1]);
      const askInc = rng.bool();
      const rightSide = (a > 0) === askInc;
      const f = (x) => a * (x - h) ** 2 + k;
      return {
        prompt: `The graph of $y=f(x)$ is shown. Its vertex is at $(${h}, ${k})$.\n\n${plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], points: [{ x: h, y: k }] })}\n\nOn what interval is $f$ ${askInc ? 'increasing' : 'decreasing'}?`,
        parts: [interval(rightSide ? `(${h}, inf)` : `(-inf, ${h})`, { flex: true, label: 'Interval:' })],
        hint: `Trace the graph from left to right. Where is it going ${askInc ? 'uphill' : 'downhill'}? Report the $x$-values, not the $y$-values.`,
      };
    }
    const gap = rng.pick([2, 3, 4]);
    const p = rng.int(-5, 1);
    const q = p + gap;
    const s = rng.sign() * { 2: 3, 3: 1, 4: 0.5 }[gap];
    const f = cubicTurning(p, q, s, rng.int(-1, 1));
    const middleIsDec = s > 0;
    // medium asks for the single bounded interval, hard asks for the union
    const askInc = level === 1 ? !middleIsDec : middleIsDec;
    const ans = level === 1 ? `(${p}, ${q})` : `(-inf, ${p}) U (${q}, inf)`;
    const fig = plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], points: [{ x: p, y: f(p) }, { x: q, y: f(q) }] });
    return {
      prompt: `The graph of $y=f(x)$ is shown. The marked turning points occur at $x=${p}$ and $x=${q}$, and the graph continues in the same directions beyond the window.\n\n${fig}\n\nFind all intervals on which $f$ is ${askInc ? 'increasing' : 'decreasing'}.${level === 2 ? ' Use $\\cup$ (type U) to join intervals.' : ''}`,
      parts: [interval(ans, { flex: true, label: 'Interval(s):' })],
      hint: `Read left to right and find where the graph goes ${askInc ? 'uphill' : 'downhill'}. The turning points are where the direction switches.`,
    };
  },
};

const readGraph = {
  id: 'read-graph',
  lesson: '1.2',
  title: 'Reading Values from a Graph',
  gen(rng, level) {
    for (let tries = 0; tries < 100; tries++) {
      const pts = zigzag(rng);
      const fig = zigzagPlot(pts);
      const intro = `The graph of $y=f(x)$ is shown on the domain $-6\\le x\\le 6$.\n\n${fig}\n\n`;
      if (level === 0) {
        const candidates = [];
        for (let x = -6; x <= 6; x++) if (Number.isInteger(zigzagValue(pts, x))) candidates.push(x);
        const x = rng.pick(candidates);
        return {
          prompt: `${intro}Find $f(${x})$.`,
          parts: [num(zigzagValue(pts, x), { label: `$f(${x})=$` })],
          hint: `Find $${x}$ on the horizontal axis, then move straight up or down to the graph and read the height.`,
        };
      }
      if (level === 1) {
        const ys = pts.map((p) => p[1]);
        const ks = [];
        for (let k = Math.min(...ys); k <= Math.max(...ys); k++) {
          const sol = zigzagSolve(pts, k);
          if (sol.length >= 2 && sol.every(Number.isInteger)) ks.push(k);
        }
        if (!ks.length) continue;
        const k = rng.pick(ks);
        const sol = zigzagSolve(pts, k).sort((a, b) => a - b);
        return {
          prompt: `${intro}Find all values of $x$ for which $f(x)=${k}$. Separate your answers with commas.`,
          parts: [set(sol, { label: '$x=$' })],
          hint: `Here the output is given. Picture the horizontal line $y=${k}$ and find every place it meets the graph.`,
        };
      }
      const ys = pts.map((p) => p[1]);
      return {
        prompt: `${intro}Find the absolute maximum value and the absolute minimum value of $f$ on its domain.`,
        parts: [
          num(Math.max(...ys), { label: 'Absolute maximum value:' }),
          num(Math.min(...ys), { label: 'Absolute minimum value:' }),
        ],
        hint: 'The maximum and minimum values are outputs, so report the heights of the highest and lowest points, not where they occur.',
      };
    }
    throw new Error('read-graph failed to generate');
  },
};

const tripGraph = {
  id: 'trip-graph',
  lesson: '1.2',
  title: 'Interpreting a Graph in Context',
  gen(rng, level) {
    const who = rng.pick(['Easton', 'Maya', 'Jordan', 'Priya', 'Luis', 'Avery']);
    const [stop1, stop2] = rng.pick([
      ['the bank', 'the grocery store'],
      ['the library', 'a friend’s house'],
      ['the post office', 'the park'],
      ['a cafe', 'the bookstore'],
    ]);
    const d1 = rng.pick([1, 1.5]);
    const d2 = d1 + rng.pick([0.5, 1, 1.5]);
    const t1 = 20 * d1;
    const t2 = t1 + rng.pick([5, 10, 15]);
    const t3 = t2 + rng.pick([5, 10]);
    const t4 = t3 + rng.pick([10, 15, 20]);
    const t5 = t4 + 10 * d2;
    const pts = [[0, 0], [t1, d1], [t2, d1], [t3, d2], [t4, d2], [t5, 0]];
    const xmax = Math.ceil((t5 + 1) / 10) * 10;
    const fig = plot({
      x: [0, xmax], y: [0, 3.5], xstep: 5, ystep: 0.5, xlabelEvery: 2, ylabelEvery: 2, w: 560, h: 380, padL: 44,
      paths: [{ pts }], xname: 't (minutes)', yname: 'd (miles)',
    });
    const intro = `${who} walks from home to ${stop1}, then to ${stop2}, and then returns home. The graph shows the distance from home, $d(t)$, in miles, $t$ minutes after leaving.\n\n${fig}\n\n`;
    if (level === 0) {
      if (rng.bool()) {
        return {
          prompt: `${intro}How many minutes does ${who} spend at ${stop2}?`,
          parts: [num(t4 - t3, { suffix: 'minutes' })],
          hint: 'While someone is stopped, the distance from home does not change. Which flat part of the graph is the second stop?',
        };
      }
      return {
        prompt: `${intro}How many minutes does the whole trip take?`,
        parts: [num(t5, { suffix: 'minutes' })],
        hint: 'The trip is over when the distance from home returns to 0.',
      };
    }
    if (level === 1) {
      return {
        prompt: `${intro}On what time interval is $d$ decreasing?`,
        parts: [interval(`(${t4}, ${t5})`, { flex: true, label: 'Interval:' })],
        hint: 'Decreasing distance from home means the walker is heading back. Find where the graph slopes downward.',
      };
    }
    const D = rng.pick([0.5, 1].filter((v) => v < d1));
    return {
      prompt: `${intro}At what times is ${who} exactly ${D} mile${D === 1 ? '' : 's'} from home? Separate your answers with commas.`,
      parts: [set([20 * D, t4 + 10 * (d2 - D)], { label: '$t=$' })],
      hint: `Picture a horizontal line at a height of ${D}. It crosses the graph once on the way out and once on the way back.`,
    };
  },
};

const keyFeatures = {
  id: 'key-features-context',
  lesson: '1.2',
  title: 'Key Features of a Model',
  gen(rng, level) {
    const z = rng.pick([40, 60, 80, 100, 120]);
    const a = rng.pick([1, 2, 3, 5]);
    const item = rng.pick(['baby formula', 'a board game', 'concert tickets', 'a phone case']);
    if (level === 0) {
      return {
        prompt: `A company's revenue from selling ${item}, in thousands of dollars, is modeled by $R(p)=${T(`-${a}p(p-${z})`, ['p'])}$, where $p$ is the price in dollars.\n\nBesides $p=0$, at what price is the revenue equal to zero?`,
        parts: [num(z, { label: '$p=$', suffix: 'dollars' })],
        hint: 'A product equals zero only when one of its factors equals zero. Check each factor.',
      };
    }
    if (level === 1) {
      return {
        prompt: `A company's revenue from selling ${item}, in thousands of dollars, is modeled by $R(p)=${T(`-${a}p(p-${z})`, ['p'])}$, where $p$ is the price in dollars. The graph of $R$ is a parabola that opens downward.\n\nWhat price gives the maximum revenue?`,
        parts: [num(z / 2, { label: '$p=$', suffix: 'dollars' })],
        hint: 'A parabola is symmetric, so its highest point sits exactly halfway between its two zeros.',
      };
    }
    return {
      prompt: `A company's revenue from selling ${item}, in thousands of dollars, is modeled by $R(p)=${T(`-${a}p^2+${a * z}p`, ['p'])}$, where $p$ is the price in dollars.\n\nFind the price that maximizes revenue and the maximum revenue.`,
      parts: [
        num(z / 2, { label: 'Price: $p=$', suffix: 'dollars' }),
        num((a * z * z) / 4, { label: 'Maximum revenue:', suffix: 'thousand dollars' }),
      ],
      hint: 'Factor the expression to find where the revenue is zero. The maximum happens halfway between those two prices.',
    };
  },
};

// ---------- Lesson 1.3 ----------

const SHAPES = [
  { inc: true, up: true, text: 'Increasing and concave up' },
  { inc: true, up: false, text: 'Increasing and concave down' },
  { inc: false, up: true, text: 'Decreasing and concave up' },
  { inc: false, up: false, text: 'Decreasing and concave down' },
];

function shapeDiffs(rng, shape, n) {
  // positive magnitudes, strictly increasing
  const mags = [rng.int(1, 3)];
  for (let i = 1; i < n; i++) mags.push(mags[i - 1] + rng.int(1, 4));
  // increasing diffs means concave up
  if (shape.inc) return shape.up ? mags : mags.slice().reverse();
  return shape.up ? mags.slice().reverse().map((m) => -m) : mags.map((m) => -m);
}

const concavityTable = {
  id: 'concavity-from-table',
  lesson: '1.3',
  title: 'Concavity from a Table',
  gen(rng, level) {
    const idx = rng.int(0, 3);
    const shape = SHAPES[idx];
    const diffs = shapeDiffs(rng, shape, 4);
    const choices = mcFixed(SHAPES.map((s) => s.text), idx);
    if (level === 2) {
      const h = rng.pick([1, 2, 5]);
      const x0 = rng.int(0, 4);
      const list = diffs.map((d, i) => `$[${x0 + i * h}, ${x0 + (i + 1) * h}]$: $${fracTex(d, h)}$`).join(', &nbsp; ');
      return {
        prompt: `The average rates of change of a function $f$ over consecutive intervals of equal width are listed below.\n\n${list}\n\nWhich statement best describes the graph of $f$ on $[${x0}, ${x0 + 4 * h}]$?`,
        parts: [choices],
        hint: 'The sign of the rates tells you whether $f$ rises or falls. Whether the rates themselves go up or down tells you the concavity.',
      };
    }
    const h = level === 0 ? 1 : rng.pick([2, 3, 5]);
    const x0 = rng.int(0, 3);
    const xs = [0, 1, 2, 3, 4].map((i) => x0 + i * h);
    const ys = [rng.int(-5, 20) + (shape.inc ? 0 : 40)];
    diffs.forEach((d) => ys.push(ys[ys.length - 1] + d));
    return {
      prompt: `Selected values of a function $f$ are shown in the table.\n\n${htable('$x$', xs, '$f(x)$', ys)}\n\nBased on the table, which statement best describes the graph of $f$?`,
      parts: [choices],
      hint: 'Find the change in $f(x)$ from each column to the next. Then ask whether those changes are getting larger or smaller.',
    };
  },
};

const concavityGraph = {
  id: 'concavity-from-graph',
  lesson: '1.3',
  title: 'Concavity Intervals from a Graph',
  gen(rng, level) {
    const askUp = rng.bool();
    if (level < 2) {
      const h = rng.int(-4, 4);
      const k = rng.int(-2, 2);
      const a = rng.sign() * rng.pick([0.25, 0.5]);
      const b = rng.pick([0, 1, 2]) * Math.sign(a);
      const f = (x) => a * (x - h) ** 3 - b * (x - h) + k;
      const rightSide = (a > 0) === askUp;
      const ans = rightSide ? `(${h}, inf)` : `(-inf, ${h})`;
      const fig = plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], points: [{ x: h, y: k }] });
      const prompt = `The graph of $y=f(x)$ is shown. The marked point at $x=${h}$ is a point of inflection.\n\n${fig}\n\nOn what interval is the graph of $f$ concave ${askUp ? 'up' : 'down'}?`;
      const hint = `Concave ${askUp ? 'up looks like part of a cup' : 'down looks like part of a frown'}. The bend switches at the point of inflection.`;
      if (level === 0) {
        const T2 = (s) => `$${s.replace('inf', '\\infty')}$`;
        const wrong = [rightSide ? `(-inf, ${h})` : `(${h}, inf)`, `(${k}, inf)`, `(-inf, ${k})`, `(${h - 2}, ${h + 2})`];
        return { prompt, parts: [mc(rng, T2(ans), wrong.map(T2))], hint };
      }
      return { prompt, parts: [interval(ans, { flex: true, label: 'Interval:' })], hint };
    }
    const g = rng.pick([1, 1.5, 2]);
    const m = g === 1.5 ? rng.int(-2, 1) + 0.5 : rng.int(-2, 2);
    const s = rng.sign();
    const k = (s * 0.8) / g ** 4;
    const f = (x) => k * ((x - m) ** 4 - 6 * g * g * (x - m) ** 2) + 4 * s;
    const [p, q] = [m - g, m + g];
    // for s > 0 the graph is concave down between the inflection points
    const middle = (s > 0) !== askUp;
    const ans = middle ? `(${p}, ${q})` : `(-inf, ${p}) U (${q}, inf)`;
    const fig = plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], points: [{ x: p, y: f(p) }, { x: q, y: f(q) }] });
    return {
      prompt: `The graph of $y=f(x)$ is shown. The two marked points, at $x=${p}$ and $x=${q}$, are points of inflection.\n\n${fig}\n\nFind all intervals on which the graph of $f$ is concave ${askUp ? 'up' : 'down'}. Use $\\cup$ (type U) to join intervals if needed.`,
      parts: [interval(ans, { flex: true, label: 'Interval(s):' })],
      hint: 'Concavity can only switch at a point of inflection. Decide the bend (cup or frown) in each of the three regions.',
    };
  },
};

const rateBehavior = {
  id: 'rate-of-change-behavior',
  lesson: '1.3',
  title: 'How Is the Rate of Change Changing?',
  gen(rng, level) {
    if (level === 2) {
      const items = [
        ['The number of people waiting in line is increasing, but at a decreasing rate.', 1],
        ['The value of a car is decreasing, and it loses less value each year than the year before.', 2],
        ['A population is growing, and it grows by more each year than the year before.', 0],
        ['The temperature of a cooling drink is falling faster and faster.', 3],
        ['The height of a rocket is increasing at an increasing rate.', 0],
        ['Sales are rising, but the weekly gains keep shrinking.', 1],
        ['The amount of medicine in the bloodstream is dropping, quickly at first and then more slowly.', 2],
        ['The water level in a lake is dropping, slowly at first and then more quickly.', 3],
      ];
      const [text, idx] = rng.pick(items);
      return {
        prompt: `Consider this situation: <b>${text}</b>\n\nWhich statement describes the graph of the quantity as a function of time?`,
        parts: [mcFixed(SHAPES.map((s) => s.text), idx)],
        hint: 'Answer two separate questions: is the quantity going up or down, and are its changes growing or shrinking in value (not just in size)?',
      };
    }
    const p = rng.int(-5, 1);
    const q = p + 4;
    const s = rng.sign() * 0.5;
    const f = cubicTurning(p, q, s, rng.int(-1, 1));
    const spots = [
      { x: p - 1, inc: true, up: false },
      { x: p + 1, inc: false, up: false },
      { x: q - 1, inc: false, up: true },
      { x: q + 1, inc: true, up: true },
    ];
    const spot = rng.pick(spots);
    const inc = s > 0 ? spot.inc : !spot.inc;
    const up = s > 0 ? spot.up : !spot.up;
    const fig = plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], points: [{ x: spot.x, y: f(spot.x), label: 'A', color: 'red' }] });
    if (level === 0) {
      return {
        prompt: `The graph of $y=f(x)$ is shown with point $A$ marked.\n\n${fig}\n\nNear point $A$, the graph of $f$ is:`,
        parts: [mcFixed(['Concave up', 'Concave down'], up ? 0 : 1)],
        hint: 'Look at just a small piece of the curve around $A$. Does it bend like a cup or like a frown?',
      };
    }
    const options = [
      '$f$ is increasing and its rate of change is increasing',
      '$f$ is increasing and its rate of change is decreasing',
      '$f$ is decreasing and its rate of change is increasing',
      '$f$ is decreasing and its rate of change is decreasing',
    ];
    const idx = (inc ? 0 : 2) + (up ? 0 : 1);
    return {
      prompt: `The graph of $y=f(x)$ is shown with point $A$ marked.\n\n${fig}\n\nWhich statement is true at point $A$?`,
      parts: [mcFixed(options, idx)],
      hint: 'Uphill or downhill tells you about $f$. The bend tells you about the rate of change: concave up means the rate of change is increasing.',
    };
  },
};

// ---------- Lesson 1.4 ----------

const arocFunction = {
  id: 'aroc-from-function',
  lesson: '1.4',
  title: 'Average Rate of Change from a Formula',
  gen(rng, level) {
    let str;
    let a;
    let b;
    let ansPart;
    if (level < 2) {
      const c = level === 0 ? [rng.nz(-3, 3), rng.int(-5, 5), rng.int(-9, 9)] : [rng.pick([-1, 1, 2]), rng.int(-3, 3), rng.int(-5, 5), rng.int(-9, 9)];
      str = polyStr(c);
      a = level === 0 ? rng.int(0, 3) : rng.int(-3, 1);
      b = a + rng.int(2, 4);
      ansPart = num((polyEval(c, b) - polyEval(c, a)) / (b - a));
    } else if (rng.bool()) {
      const k = rng.pick([6, 8, 10, 12]) * rng.sign();
      a = rng.pick([1, 2]);
      b = rng.pick([3, 4, 5, 6].filter((v) => v !== a));
      str = `${k}/x`;
      ansPart = numFrac(k * (a - b), a * b * (b - a));
    } else {
      const c = rng.int(0, 5);
      const r1 = rng.int(1, 3);
      const r2 = r1 + rng.int(1, 3);
      a = r1 * r1 - c;
      b = r2 * r2 - c;
      str = `sqrt(${plus('x', c)})`;
      ansPart = numFrac(r2 - r1, b - a);
    }
    return {
      prompt: `Find the average rate of change of $f(x)=${T(str)}$ on the interval $[${a}, ${b}]$.`,
      parts: [ansPart],
      hint: `Compute $f(${b})$ and $f(${a})$ first. Then divide the change in output by the change in input.`,
    };
  },
};

const arocTable = {
  id: 'aroc-from-table',
  lesson: '1.4',
  title: 'Average Rate of Change from a Table',
  gen(rng, level) {
    if (level === 2) {
      const scen = rng.pick([
        { text: 'The table shows the amount of water $W(t)$, in gallons, in a tank $t$ minutes after a valve is opened.', f: 'W', v: 't', unit: 'gallons per minute', dir: -1 },
        { text: 'The table shows the height $h(t)$, in feet, of a hot air balloon $t$ minutes after launch.', f: 'h', v: 't', unit: 'feet per minute', dir: 1 },
        { text: 'The table shows the value $V(t)$, in dollars, of a laptop $t$ years after it was bought.', f: 'V', v: 't', unit: 'dollars per year', dir: -1 },
      ]);
      const xs = [0];
      for (let i = 0; i < 4; i++) xs.push(xs[i] + rng.int(2, 5));
      const ys = [scen.dir > 0 ? rng.int(5, 20) * 10 : rng.int(60, 90) * 10];
      for (let i = 0; i < 4; i++) ys.push(ys[i] + scen.dir * rng.int(3, 12) * 5);
      const i = rng.int(0, 2);
      const j = rng.int(i + 2, 4);
      return {
        prompt: `${scen.text}\n\n${htable(`$${scen.v}$`, xs, `$${scen.f}(${scen.v})$`, ys)}\n\nFind the average rate of change of $${scen.f}$ from $${scen.v}=${xs[i]}$ to $${scen.v}=${xs[j]}$.`,
        parts: [numFrac(ys[j] - ys[i], xs[j] - xs[i], { suffix: scen.unit })],
        hint: 'Use only the two columns named in the question. The sign of your answer should match whether the quantity went up or down.',
      };
    }
    const xs = [rng.int(-4, 1)];
    for (let i = 0; i < 4; i++) xs.push(xs[i] + (level === 0 ? rng.pick([1, 2]) : rng.int(1, 4)));
    const ys = [rng.int(-9, 9)];
    let i;
    let j;
    if (level === 0) {
      // make differences divisible so the answer is an integer
      for (let k = 0; k < 4; k++) ys.push(ys[k] + (xs[k + 1] - xs[k]) * rng.nz(-5, 5));
      i = rng.int(0, 3);
      j = i + 1;
    } else {
      for (let k = 0; k < 4; k++) ys.push(ys[k] + rng.nz(-8, 8));
      i = rng.int(0, 2);
      j = rng.int(i + 2, 4);
    }
    return {
      prompt: `Selected values of a function $f$ are shown in the table.\n\n${htable('$x$', xs, '$f(x)$', ys)}\n\nFind the average rate of change of $f$ on the interval $[${xs[i]}, ${xs[j]}]$.`,
      parts: [numFrac(ys[j] - ys[i], xs[j] - xs[i])],
      hint: 'Average rate of change is the change in output divided by the change in input. Subtract in the same order on top and bottom.',
    };
  },
};

const arocGraph = {
  id: 'aroc-from-graph',
  lesson: '1.4',
  title: 'Average Rate of Change from a Graph',
  gen(rng, level) {
    if (level === 2) {
      const pts = zigzag(rng);
      const i = rng.int(0, 2);
      const j = rng.int(i + 2, 4);
      const [a, b] = [pts[i][0], pts[j][0]];
      return {
        prompt: `The graph of $y=f(x)$ is shown.\n\n${zigzagPlot(pts, { points: pts.map(([x, y]) => ({ x, y })) })}\n\nFind the average rate of change of $f$ on the interval $[${a}, ${b}]$.`,
        parts: [numFrac(pts[j][1] - pts[i][1], b - a)],
        hint: 'Only the two endpoints of the interval matter. What happens in between does not affect the average rate of change.',
      };
    }
    const h = rng.int(-3, 3);
    const s = rng.sign();
    const k = -s * rng.int(2, 6);
    const f = (x) => s * (x - h) ** 2 + k;
    const visible = [];
    for (let x = h - 3; x <= h + 3; x++) if (Math.abs(f(x)) <= 7 && Math.abs(x) <= 7) visible.push(x);
    const a = rng.pick(visible.slice(0, -2));
    const b = rng.pick(visible.filter((x) => x >= a + 2));
    const marks = [{ x: a, y: f(a) }, { x: b, y: f(b) }];
    return {
      prompt: `The graph of $y=f(x)$ is shown.${level === 0 ? ' The points where $x=' + a + '$ and $x=' + b + '$ are marked.' : ''}\n\n${plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], points: marks })}\n\nFind the average rate of change of $f$ on the interval $[${a}, ${b}]$.`,
      parts: [numFrac(f(b) - f(a), b - a)],
      hint: `Read the heights of the graph at $x=${a}$ and $x=${b}$. The average rate of change is the slope of the line through those two points.`,
    };
  },
};

const rateAtPoint = {
  id: 'estimate-rate-at-point',
  lesson: '1.4',
  title: 'Estimating the Rate of Change at a Point',
  gen(rng, level) {
    const A = rng.pick([1, 2, 3]);
    const B = rng.int(-4, 4);
    const C = rng.int(-5, 5);
    const a = rng.int(1, 4);
    const str = polyStr([A, B, C]);
    const h = [1, 0.1, 0.01][level];
    const aroc = round(A * (2 * a + h) + B, 4);
    const parts = [num(aroc, { label: `Average rate of change on $[${a}, ${round(a + h, 2)}]$:` })];
    let ask = `Find the average rate of change of $f$ on the interval $[${a}, ${round(a + h, 2)}]$.`;
    if (level === 2) {
      ask += ` Then use it to estimate, to the nearest whole number, the rate of change of $f$ at $x=${a}$.`;
      parts.push(num(2 * A * a + B, { label: `Estimated rate of change at $x=${a}$:` }));
    }
    return {
      prompt: `Let $f(x)=${T(str)}$.\n\n${ask}`,
      parts,
      hint: 'A very short interval gives a good estimate of the rate of change at a point. Be careful to keep every decimal place when you evaluate $f$.',
    };
  },
};

// ---------- Lesson 1.5 ----------

const linearTwoPoints = {
  id: 'linear-from-two-points',
  lesson: '1.5',
  title: 'Linear Functions from Two Points',
  gen(rng, level) {
    const x1 = rng.int(-5, 3);
    if (level === 2) {
      const d = rng.pick([2, 3, 4, 5]);
      const n = rng.nz(-7, 7);
      const [p, q] = [n / gcdInt(n, d), d / gcdInt(n, d)];
      const x1m = rng.int(-2, 2) * q;
      const x2 = x1m + q * rng.int(1, 3);
      const b = rng.int(-6, 6);
      const y = (x) => (p * x) / q + b;
      const slope = fracStr(p, q);
      const rule = plus(q === 1 ? coef(p, 'x') : `(${slope})x`, b);
      return {
        prompt: `A linear function $f$ satisfies $f(${x1m})=${y(x1m)}$ and $f(${x2})=${y(x2)}$.\n\nWrite a rule for $f(x)$.`,
        parts: [expr(rule, { label: '$f(x)=$' })],
        hint: 'Find the slope first, and expect a fraction. Then use one of the points to find the starting value $b$ in $f(x)=mx+b$.',
      };
    }
    const m = rng.nz(-5, 5);
    const b = rng.int(-9, 9);
    const x2 = x1 + rng.int(1, 5);
    const y = (x) => m * x + b;
    if (level === 0) {
      return {
        prompt: `A linear function passes through the points $(${x1}, ${y(x1)})$ and $(${x2}, ${y(x2)})$.\n\nFind its rate of change (slope).`,
        parts: [num(m, { label: 'Slope $=$' })],
        hint: 'Slope is the change in $y$ divided by the change in $x$. Subtract the coordinates in the same order.',
      };
    }
    return {
      prompt: `A linear function $f$ passes through the points $(${x1}, ${y(x1)})$ and $(${x2}, ${y(x2)})$.\n\nWrite a rule for $f(x)$.`,
      parts: [expr(polyStr([m, b]), { label: '$f(x)=$' })],
      hint: 'Find the slope first. Then substitute one point into $y=mx+b$ to solve for $b$.',
    };
  },
};

function gcdInt(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

const linearMissing = {
  id: 'linear-table-missing-value',
  lesson: '1.5',
  title: 'Completing a Linear Table',
  gen(rng, level) {
    const m = rng.nz(-6, 6);
    const b = rng.int(-12, 12);
    let xs;
    if (level === 0) {
      const x0 = rng.int(-3, 3);
      xs = [0, 1, 2, 3, 4].map((i) => x0 + i);
    } else if (level === 1) {
      const h = rng.pick([2, 3, 4, 5]);
      const x0 = rng.int(-2, 2) * h;
      xs = [0, 1, 2, 3, 4].map((i) => x0 + i * h);
    } else {
      xs = [rng.int(-6, 0)];
      for (let i = 0; i < 4; i++) xs.push(xs[i] + rng.int(1, 5));
    }
    const hide = level === 2 ? rng.int(1, 3) : rng.int(1, 4);
    const ys = xs.map((x) => m * x + b);
    const shown = ys.map((y, i) => (i === hide ? '<b>?</b>' : y));
    return {
      prompt: `The table shows values of a <b>linear</b> function $f$.\n\n${htable('$x$', xs, '$f(x)$', shown)}\n\nFind the missing value.`,
      parts: [num(ys[hide], { label: `$f(${xs[hide]})=$` })],
      hint:
        level === 2
          ? 'The inputs are not evenly spaced, so find the rate of change per 1 unit of $x$ from two known columns first.'
          : 'A linear function changes by the same amount over equal-length input intervals. Find that constant change.',
    };
  },
};

const linearContext = {
  id: 'linear-model-context',
  lesson: '1.5',
  title: 'Linear Models in Context',
  gen(rng, level) {
    const scen = rng.pick([
      () => {
        const b = rng.int(40, 90) * 10;
        const m = -rng.pick([8, 10, 12, 15, 20]);
        return { text: `A pool holds ${b} gallons of water and drains at a constant rate of ${-m} gallons per minute.`, what: 'the amount of water in the pool', b, m, name: 'W', unit: 'gallons', tUnit: 'minutes' };
      },
      () => {
        const b = rng.int(2, 9) * 50;
        const m = rng.pick([15, 20, 25, 30, 40]);
        return { text: `Sam has ${b} dollars in savings and adds ${m} dollars every week.`, what: 'the amount in savings', b, m, name: 'S', unit: 'dollars', tUnit: 'weeks' };
      },
      () => {
        const b = rng.int(20, 36);
        const m = -rng.pick([2, 3, 4]);
        return { text: `A candle is ${b} centimeters tall and burns down at a constant rate of ${-m} centimeters per hour.`, what: 'the height of the candle', b, m, name: 'H', unit: 'centimeters', tUnit: 'hours' };
      },
      () => {
        const b = rng.int(3, 12) * 100;
        const m = rng.pick([150, 200, 250, 300]);
        return { text: `A hiker starts at an elevation of ${commas(b)} feet and climbs at a constant rate of ${m} feet per hour.`, what: 'the elevation of the hiker', b, m, name: 'E', unit: 'feet', tUnit: 'hours' };
      },
    ])();
    const { b, m, name } = scen;
    const maxT = m < 0 ? Math.floor(b / -m) : 12;
    const t = rng.int(2, Math.max(3, Math.min(maxT - 1, 9)));
    if (level === 0) {
      return {
        prompt: `${scen.text}\n\nFind ${scen.what} after ${t} ${scen.tUnit}.`,
        parts: [num(b + m * t, { suffix: scen.unit })],
        hint: `Start with the initial amount, then account for ${t} ${scen.tUnit} of change at the given rate.`,
      };
    }
    if (level === 1) {
      return {
        prompt: `${scen.text}\n\nWrite a function $${name}(t)$ for ${scen.what}, in ${scen.unit}, after $t$ ${scen.tUnit}.`,
        parts: [expr(plus(coef(m, 't'), b), { label: `$${name}(t)=$`, vars: ['t'] })],
        hint: 'A linear model has the form (starting value) + (rate of change)(time). Decide whether the rate is positive or negative.',
      };
    }
    const target = b + m * t;
    return {
      prompt: `${scen.text}\n\nAfter how many ${scen.tUnit} will ${scen.what} be ${commas(target)} ${scen.unit}?`,
      parts: [num(t, { label: '$t=$', suffix: scen.tUnit })],
      hint: `Write the linear model first, set it equal to ${commas(target)}, and solve for $t$.`,
    };
  },
};

const constantRate = {
  id: 'constant-rate-of-change',
  lesson: '1.5',
  title: 'Constant Rate of Change',
  gen(rng, level) {
    const m = rng.nz(-6, 6);
    const b = rng.int(-9, 9);
    const f = (x) => m * x + b;
    const a = rng.int(-3, 3);
    const c = a + rng.int(2, 5);
    const given = `$f$ is a linear function with $f(${a})=${f(a)}$ and $f(${c})=${f(c)}$.`;
    if (level === 0) {
      const p = rng.int(8, 15);
      const q = p + rng.int(3, 20);
      return {
        prompt: `${given}\n\nWhat is the average rate of change of $f$ on the interval $[${p}, ${q}]$?`,
        parts: [num(m)],
        hint: 'For a linear function, the average rate of change is the same on every interval. Find it from the two given values.',
      };
    }
    if (level === 1) {
      const w = rng.int(3, 9);
      return {
        prompt: `${given}\n\nBy how much does the output of $f$ change whenever the input increases by ${w}? Use a negative number for a decrease.`,
        parts: [num(m * w)],
        hint: 'First find how much the output changes when the input increases by 1. Then scale that up.',
      };
    }
    const far = c + rng.int(6, 15);
    return {
      prompt: `${given}\n\nFind $f(${far})$.`,
      parts: [num(f(far), { label: `$f(${far})=$` })],
      hint: `Find the constant rate of change, then figure out how many units $${far}$ is from one of the known inputs.`,
    };
  },
};

// ---------- Lesson 1.6 ----------

const secondDifferences = {
  id: 'second-differences',
  lesson: '1.6',
  title: 'Second Differences of Quadratics',
  gen(rng, level) {
    const a = level === 2 ? rng.pick([-3, -2, -1, 1, 2, 3]) : rng.nz(-3, 3);
    const b = rng.int(-5, 5);
    const c = rng.int(-8, 8);
    const h = level === 2 ? rng.pick([2, 3]) : 1;
    const x0 = rng.int(-2, 2) * h;
    const n = level === 1 ? 4 : 5;
    const xs = Array.from({ length: n }, (_, i) => x0 + i * h);
    const f = (x) => a * x * x + b * x + c;
    const ys = xs.map(f);
    const tbl = htable('$x$', xs, '$f(x)$', ys);
    if (level === 0) {
      return {
        prompt: `The table shows values of a quadratic function $f$.\n\n${tbl}\n\nFind the constant second difference of the outputs.`,
        parts: [num(2 * a, { label: 'Second difference $=$' })],
        hint: 'Subtract neighboring outputs to get the first differences. Then subtract neighboring first differences.',
      };
    }
    if (level === 1) {
      const next = xs[n - 1] + h;
      return {
        prompt: `The table shows values of a quadratic function $f$.\n\n${tbl}\n\nUse the pattern in the differences to find $f(${next})$.`,
        parts: [num(f(next), { label: `$f(${next})=$` })],
        hint: 'The first differences of a quadratic change by a constant amount. Extend the first differences one more step.',
      };
    }
    return {
      prompt: `The table shows values of a quadratic function $f(x)=ax^2+bx+c$. Notice that the inputs increase by ${h} each time.\n\n${tbl}\n\nFind the value of $a$.`,
      parts: [num(a, { label: '$a=$' })],
      hint: `When inputs are spaced $h$ apart, the second difference of a quadratic equals $2ah^2$. Here $h=${h}$.`,
    };
  },
};

const arocPattern = {
  id: 'average-rates-of-quadratics',
  lesson: '1.6',
  title: 'Average Rates of Change of Quadratics',
  gen(rng, level) {
    const a = rng.nz(-3, 3);
    const b = rng.int(-6, 6);
    const c = rng.int(-6, 6);
    if (level === 0) {
      const r0 = rng.int(-9, 9);
      const d = 2 * a;
      const rates = [0, 1, 2].map((i) => r0 + i * d);
      return {
        prompt: `For a quadratic function $f$, the average rates of change over the intervals $[0,1]$, $[1,2]$, and $[2,3]$ are $${rates.join('$, $')}$.\n\nWhat is the average rate of change of $f$ on $[3,4]$?`,
        parts: [num(r0 + 3 * d)],
        hint: 'For a quadratic, average rates of change over consecutive equal-length intervals go up or down by a constant amount.',
      };
    }
    if (level === 1) {
      const s = rng.int(-2, 2);
      const r1 = a * (2 * s + 1) + b;
      const r2 = a * (2 * s + 3) + b;
      return {
        prompt: `Let $f(x)=${T(polyStr([a, b, c]))}$.\n\nFind the average rate of change of $f$ on $[${s}, ${s + 1}]$ and on $[${s + 1}, ${s + 2}]$.`,
        parts: [num(r1, { label: `On $[${s}, ${s + 1}]$:` }), num(r2, { label: `On $[${s + 1}, ${s + 2}]$:` })],
        hint: 'Each interval has width 1, so each average rate of change is just a difference of two outputs.',
      };
    }
    const w = rng.pick([2, 3]);
    const r0 = rng.int(-9, 9);
    const d = rng.nz(-4, 4) * w;
    const k = rng.int(3, 5);
    return {
      prompt: `For a quadratic function $f$, the average rate of change on $[0, ${w}]$ is $${r0}$ and the average rate of change on $[${w}, ${2 * w}]$ is $${r0 + d}$.\n\nWhat is the average rate of change of $f$ on $[${k * w}, ${(k + 1) * w}]$?`,
      parts: [num(r0 + k * d)],
      hint: `The intervals all have width ${w}, so the average rates form a pattern with a constant difference. Count how many steps away the new interval is.`,
    };
  },
};

const classifyLinQuad = {
  id: 'linear-quadratic-or-neither',
  lesson: '1.6',
  title: 'Linear, Quadratic, or Neither?',
  gen(rng, level) {
    const { kind, xs, ys } = classifyTable(rng, level);
    return {
      prompt: `Selected values of a function $f$ are shown.\n\n${htable('$x$', xs, '$f(x)$', ys)}\n\nWhich type of function could $f$ be?`,
      parts: [mcFixed(['Linear', 'Quadratic', 'Neither linear nor quadratic'], ['linear', 'quadratic', 'neither'].indexOf(kind))],
      hint: 'Compute the first differences of the outputs. If they are not constant, compute the differences of those differences.',
    };
  },
};

const quadraticVertex = {
  id: 'quadratic-vertex',
  lesson: '1.6',
  title: 'Vertex of a Quadratic',
  gen(rng, level) {
    const h = rng.nz(-5, 5);
    const k = rng.int(-8, 8);
    const a = rng.nz(-3, 3);
    if (level === 0) {
      const str = plus(`${coef(a, `(${shiftStr(h)})^2`)}`, k);
      return {
        prompt: `Find the vertex of the graph of $f(x)=${T(str)}$.`,
        parts: [point(h, k, { label: 'Vertex:' })],
        hint: 'In the form $a(x-h)^2+k$ the vertex is $(h,k)$. Watch the sign inside the parentheses.',
      };
    }
    if (level === 1) {
      const c = [a, -2 * a * h, a * h * h + k];
      return {
        prompt: `Find the vertex of the graph of $f(x)=${T(polyStr(c))}$.`,
        parts: [point(h, k, { label: 'Vertex:' })],
        hint: 'The $x$-coordinate of the vertex of $ax^2+bx+c$ is $-\\frac{b}{2a}$. Substitute it back in to get the $y$-coordinate.',
      };
    }
    const m = rng.int(1, 4);
    const c0 = rng.int(0, 12) * 4;
    return {
      prompt: `A ball is launched upward. Its height in feet after $t$ seconds is $h(t)=${T(`-16t^2+${32 * m}t${c0 ? `+${c0}` : ''}`, ['t'])}$.\n\nWhen does the ball reach its maximum height, and what is that height?`,
      parts: [num(m, { label: 'Time: $t=$', suffix: 'seconds' }), num(16 * m * m + c0, { label: 'Maximum height:', suffix: 'feet' })],
      hint: 'The maximum occurs at the vertex of the parabola. Find its $t$-coordinate first, then evaluate the height there.',
    };
  },
};

export default [
  evaluateFunction, functionFromWords, isFunction, domainOfFunction, functionInContext,
  increasingDecreasing, readGraph, tripGraph, keyFeatures,
  concavityTable, concavityGraph, rateBehavior,
  arocFunction, arocTable, arocGraph, rateAtPoint,
  linearTwoPoints, linearMissing, linearContext, constantRate,
  secondDifferences, arocPattern, classifyLinQuad, quadraticVertex,
];
