// Unit 4: Sequences and Exponential Functions (Lessons 4.1 to 4.8)

import {
  T, fracStr, fracTex, reduce, round, htable, num, numFrac, expr, interval, mc, mcFixed, shiftStr, plus, coef, commas,
} from '../lib/fmt.js';
import { fnOf, walk } from '../lib/expr.js';
import { plot } from '../lib/graph.js';

const SEQ_POINTS = [1, 2, 3, 4, 5, 6, 7, 8];
const listOf = (terms) => `$${terms.join(',\\ ')},\\ \\ldots$`;

// ---------- Lesson 4.1 ----------

const arithmeticNthTerm = {
  id: 'arithmetic-nth-term',
  lesson: '4.1',
  title: 'Terms of Arithmetic Sequences',
  gen(rng, level) {
    const a1 = rng.int(-12, 15);
    if (level === 0) {
      const d = rng.nz(-7, 9);
      const n = rng.int(10, 30);
      return {
        prompt: `An arithmetic sequence begins ${listOf([0, 1, 2, 3].map((i) => a1 + i * d))}\n\nFind the ${n}th term, $a_{${n}}$.`,
        parts: [num(a1 + (n - 1) * d, { label: `$a_{${n}}=$` })],
        hint: `Find the common difference. To get from the 1st term to the ${n}th term, how many times is it added?`,
      };
    }
    const p = rng.int(2, 6);
    if (level === 1) {
      const d = rng.nz(-7, 9);
      const q = p + rng.int(3, 6);
      const n = q + rng.int(5, 15);
      const a = (k) => a1 + (k - 1) * d;
      return {
        prompt: `In an arithmetic sequence, $a_{${p}}=${a(p)}$ and $a_{${q}}=${a(q)}$.\n\nFind $a_{${n}}$.`,
        parts: [num(a(n), { label: `$a_{${n}}=$` })],
        hint: `Going from term ${p} to term ${q} adds the common difference ${q - p} times. Use that to find the common difference first.`,
      };
    }
    const gap = rng.pick([2, 3, 4]);
    const dn = rng.pick([1, 3, 5, 7].filter((v) => v % gap !== 0 && !(gap === 4 && v % 2 === 0))) * rng.sign();
    const q = p + gap;
    const n = q + rng.int(2, 7);
    const ap = rng.int(-9, 9);
    return {
      prompt: `In an arithmetic sequence, $a_{${p}}=${ap}$ and $a_{${q}}=${ap + dn}$.\n\nFind $a_{${n}}$. Give an exact answer.`,
      parts: [numFrac(ap * gap + dn * (n - p), gap, { label: `$a_{${n}}=$` })],
      hint: 'The common difference does not have to be a whole number. Divide the total change by the number of steps between the two given terms.',
    };
  },
};

const arithmeticFormula = {
  id: 'arithmetic-explicit-formula',
  lesson: '4.1',
  title: 'Formulas for Arithmetic Sequences',
  gen(rng, level) {
    const a1 = rng.int(-12, 15);
    const d = rng.nz(-7, 9);
    const a = (k) => a1 + (k - 1) * d;
    const ans = plus(coef(d, 'n'), a1 - d);
    let prompt;
    if (level === 0) {
      prompt = `An arithmetic sequence begins ${listOf([1, 2, 3, 4].map(a))}\n\nWrite a formula for the $n$th term, $a_n$, where $a_1=${a1}$.`;
    } else if (level === 1) {
      const p = rng.int(3, 5);
      const q = p + rng.int(2, 5);
      prompt = `In an arithmetic sequence, $a_{${p}}=${a(p)}$ and $a_{${q}}=${a(q)}$.\n\nWrite a formula for the $n$th term, $a_n$.`;
    } else {
      const rows = rng.int(12, 30);
      const step = Math.abs(d);
      const first = rng.int(10, 30) + (d < 0 ? rows * step : 0);
      return {
        prompt: `A theater has ${rows} rows of seats. Row 1 has ${first} seats, and each row after it has ${step} ${d > 0 ? 'more' : 'fewer'} seats than the row in front of it.\n\nWrite a formula for the number of seats $a_n$ in row $n$.`,
        parts: [expr(plus(coef(d, 'n'), first - d), { label: '$a_n=$', vars: ['n'], points: SEQ_POINTS })],
        hint: 'Row 1 is the starting value. By row $n$, the change has been applied $n-1$ times.',
      };
    }
    return {
      prompt,
      parts: [expr(ans, { label: '$a_n=$', vars: ['n'], points: SEQ_POINTS })],
      hint: 'An arithmetic sequence is a linear function of $n$ whose slope is the common difference. Use $a_n=a_k+d(n-k)$ with any known term.',
    };
  },
};

const arithmeticFindN = {
  id: 'arithmetic-find-position',
  lesson: '4.1',
  title: 'Finding Positions in Arithmetic Sequences',
  gen(rng, level) {
    const a1 = rng.int(-9, 12);
    const d = level === 2 ? rng.int(3, 9) : rng.nz(-6, 8);
    const n = rng.int(12, 40);
    const a = (k) => a1 + (k - 1) * d;
    const start = listOf([1, 2, 3].map(a));
    if (level === 0) {
      return {
        prompt: `An arithmetic sequence begins ${start}\n\nWhich term of the sequence is equal to $${a(n)}$? Enter the position $n$.`,
        parts: [num(n, { label: '$n=$' })],
        hint: 'Write the formula for the $n$th term, set it equal to the target value, and solve for $n$.',
      };
    }
    if (level === 1) {
      return {
        prompt: `How many terms are in the finite arithmetic sequence below?\n\n$$${[1, 2, 3].map(a).join(',\\ ')},\\ \\ldots,\\ ${a(n)}$$`,
        parts: [num(n, { label: 'Number of terms:' })],
        hint: 'Find how many times the common difference is added to get from the first term to the last. The number of terms is one more than that.',
      };
    }
    const target = a(n) - rng.int(1, d - 1);
    return {
      prompt: `An arithmetic sequence begins ${start}\n\nWhat is the position $n$ of the first term that is greater than $${target}$?`,
      parts: [num(n, { label: '$n=$' })],
      hint: 'Set up an inequality with the $n$th term formula. Since $n$ must be a whole number, think carefully about which way to round.',
    };
  },
};

// ---------- Lesson 4.2 ----------

const geometricNthTerm = {
  id: 'geometric-nth-term',
  lesson: '4.2',
  title: 'Terms of Geometric Sequences',
  gen(rng, level) {
    if (level === 0) {
      const g1 = rng.int(1, 6);
      const r = rng.pick([2, 3, -2]);
      const n = rng.int(6, 8);
      return {
        prompt: `A geometric sequence begins ${listOf([0, 1, 2, 3].map((i) => g1 * r ** i))}\n\nFind the ${n}th term, $g_{${n}}$.`,
        parts: [num(g1 * r ** (n - 1), { label: `$g_{${n}}=$` })],
        hint: `Find the common ratio. To get from the 1st term to the ${n}th term, how many times do you multiply by it?`,
      };
    }
    if (level === 1) {
      const den = rng.pick([2, 3]);
      const sgn = rng.sign();
      const n = rng.int(5, 6);
      const g1 = rng.int(1, 4) * den ** 3;
      const [p, q] = reduce(g1 * sgn ** (n - 1), den ** (n - 1));
      const terms = [0, 1, 2].map((i) => fracTex(g1 * sgn ** i, den ** i));
      return {
        prompt: `A geometric sequence begins ${listOf(terms)}\n\nFind the ${n}th term, $g_{${n}}$. Give an exact answer.`,
        parts: [numFrac(p, q, { label: `$g_{${n}}=$` })],
        hint: 'Divide any term by the term before it to find the common ratio. It is a fraction here, and it may be negative.',
      };
    }
    const r = rng.pick([2, 3]);
    const g1 = rng.int(1, 5);
    const p = rng.int(2, 3);
    const q = p + rng.pick([2, 3]);
    const n = q + rng.int(1, 2);
    const g = (k) => g1 * r ** (k - 1);
    return {
      prompt: `A geometric sequence has a positive common ratio, with $g_{${p}}=${g(p)}$ and $g_{${q}}=${g(q)}$.\n\nFind $g_{${n}}$.`,
      parts: [num(g(n), { label: `$g_{${n}}=$` })],
      hint: `Going from term ${p} to term ${q} multiplies by the common ratio ${q - p} times. Divide the two terms, then take a root.`,
    };
  },
};

const geometricFormula = {
  id: 'geometric-explicit-formula',
  lesson: '4.2',
  title: 'Formulas for Geometric Sequences',
  gen(rng, level) {
    const pts = [1, 2, 3, 4, 5, 6];
    if (level === 0) {
      const g1 = rng.int(2, 9);
      const r = rng.pick([2, 3, 4, 5]);
      return {
        prompt: `A geometric sequence begins ${listOf([0, 1, 2, 3].map((i) => g1 * r ** i))}\n\nWrite a formula for the $n$th term, $g_n$, where $g_1=${g1}$.`,
        parts: [expr(`${g1}*${r}^(n-1)`, { label: '$g_n=$', vars: ['n'], points: pts })],
        hint: 'By term $n$, the first term has been multiplied by the common ratio $n-1$ times.',
      };
    }
    if (level === 1) {
      const den = rng.pick([2, 3, 4]);
      const g1 = rng.int(1, 3) * den ** 3;
      return {
        prompt: `A geometric sequence begins ${listOf([0, 1, 2, 3].map((i) => g1 / den ** i))}\n\nWrite a formula for the $n$th term, $g_n$, where $g_1=${g1}$.`,
        parts: [expr(`${g1}(1/${den})^(n-1)`, { label: '$g_n=$', vars: ['n'], points: pts })],
        hint: 'The terms are shrinking, so the common ratio is a fraction between 0 and 1. Put the ratio in parentheses before applying the exponent.',
      };
    }
    const r = rng.pick([2, 3]);
    const g0 = rng.int(2, 7);
    const p = rng.int(2, 3);
    const q = p + 2;
    return {
      prompt: `A geometric sequence has a positive common ratio, with $g_{${p}}=${g0 * r ** p}$ and $g_{${q}}=${g0 * r ** q}$.\n\nWrite a formula for the $n$th term, $g_n$.`,
      parts: [expr(`${g0}*${r}^n`, { label: '$g_n=$', vars: ['n'], points: pts })],
      hint: 'Find the common ratio from the two given terms. Then use $g_n=g_k\\cdot r^{\\,n-k}$ with either known term.',
    };
  },
};

const sequenceType = {
  id: 'arithmetic-or-geometric',
  lesson: '4.2',
  title: 'Arithmetic, Geometric, or Neither?',
  gen(rng, level) {
    const kind = rng.int(0, 2);
    let terms;
    let next;
    const a = rng.int(1, 9);
    if (kind === 0) {
      const d = level === 0 ? rng.nz(-6, 8) : rng.nz(-15, 15);
      const s = rng.int(-20, 20);
      terms = [0, 1, 2, 3].map((i) => s + i * d);
      next = s + 4 * d;
    } else if (kind === 1) {
      const r = level === 0 ? rng.pick([2, 3]) : rng.pick([2, 3, -2, -3]);
      if (level === 2 && rng.bool()) {
        const den = rng.pick([2, 3]);
        const s = a * den ** 4;
        terms = [0, 1, 2, 3].map((i) => s / den ** i);
        next = a;
      } else {
        terms = [0, 1, 2, 3].map((i) => a * r ** i);
        next = a * r ** 4;
      }
    } else {
      const which = rng.int(0, level === 0 ? 0 : 2);
      if (which === 0) terms = [1, 2, 3, 4].map((i) => (i + a) ** 2);
      else if (which === 1) terms = [a, a + 1, a + 3, a + 6];
      else terms = [1, 1, 2, 3].map((v, i) => [a, a + 1, 2 * a + 1, 3 * a + 2][i]);
      next = null;
    }
    const classify = mcFixed(['Arithmetic', 'Geometric', 'Neither'], kind, level > 0 ? { label: 'Type of sequence:' } : {});
    if (level === 0 || next === null) {
      return {
        prompt: `Classify the sequence.\n\n$$${terms.join(',\\ ')},\\ \\ldots$$`,
        parts: [classify],
        hint: 'Check the differences between neighboring terms, then check the ratios between neighboring terms. Is either one constant?',
      };
    }
    return {
      prompt: `Classify the sequence, and then find its next term.\n\n$$${terms.join(',\\ ')},\\ \\ldots$$`,
      parts: [classify, num(next, { label: 'Next term:' })],
      hint: 'Check the differences between neighboring terms, then check the ratios between neighboring terms. Whichever is constant tells you how to continue.',
    };
  },
};

const geometricContext = {
  id: 'geometric-sequences-in-context',
  lesson: '4.2',
  title: 'Geometric Sequences in Context',
  gen(rng, level) {
    if (level === 0) {
      const start = rng.int(2, 9) * 10;
      const r = rng.pick([2, 3]);
      const n = rng.int(3, 5);
      return {
        prompt: `A culture starts with ${start} bacteria, and the population ${r === 2 ? 'doubles' : 'triples'} every hour.\n\nHow many bacteria are there after ${n} hours?`,
        parts: [num(start * r ** n, { suffix: 'bacteria' })],
        hint: 'Each hour multiplies the population by the same factor. Count how many times that happens.',
      };
    }
    const h0 = rng.pick([80, 100, 120, 200]);
    const pct = rng.pick([50, 60, 75, 80]);
    const r = pct / 100;
    if (level === 1) {
      const n = rng.int(3, 4);
      const value = round(h0 * r ** n, 2);
      return {
        prompt: `A ball is dropped from a height of ${h0} inches. After each bounce it rebounds to ${pct} percent of its previous height.\n\nHow high does the ball rebound after bounce number ${n}? Round to the nearest hundredth if needed.`,
        parts: [num(value, { suffix: 'inches', tol: 0.0051 })],
        hint: 'Each bounce multiplies the height by the same decimal. Apply that multiplier once per bounce.',
      };
    }
    const limit = rng.pick([5, 10, 15, 20]);
    let n = 0;
    let hgt = h0;
    while (hgt >= limit) {
      hgt *= r;
      n++;
    }
    return {
      prompt: `A ball is dropped from a height of ${h0} inches. After each bounce it rebounds to ${pct} percent of its previous height.\n\nAfter which bounce does the rebound height first fall below ${limit} inches?`,
      parts: [num(n, { label: 'Bounce number:' })],
      hint: 'Make a list of rebound heights, one bounce at a time, and stop when the height drops under the limit.',
    };
  },
};

// ---------- Lesson 4.3 ----------

const linearVsExponential = {
  id: 'linear-or-exponential',
  lesson: '4.3',
  title: 'Linear or Exponential?',
  gen(rng, level) {
    const options = ['Linear', 'Exponential', 'Neither'];
    if (level === 1) {
      const p = rng.int(2, 9);
      const amt = rng.int(2, 9) * 10;
      const [text, idx] = rng.pick([
        [`A town's population increases by ${p} percent each year.`, 1],
        [`A town's population increases by ${amt} people each year.`, 0],
        [`A machine loses ${amt} dollars of value each year.`, 0],
        [`A machine loses ${p + 5} percent of its value each year.`, 1],
        [`The number of views of a video triples every ${p} days.`, 1],
        [`A runner covers ${p} more miles each week than the week before, so that the weekly distances are ${p}, ${2 * p}, ${3 * p}, and so on.`, 0],
        [`A substance has a half-life of ${p} hours.`, 1],
        ['The area of a square grows as its side length increases by 1 centimeter at a time.', 2],
      ]);
      return {
        prompt: `Consider the following situation.\n\n<b>${text}</b>\n\nWhich type of function models the quantity over time?`,
        parts: [mcFixed(options, idx)],
        hint: 'Linear functions change by equal differences over equal intervals. Exponential functions change by equal factors (percents) over equal intervals.',
      };
    }
    const kind = rng.int(0, 2);
    const h = level === 0 ? 1 : rng.pick([2, 3, 5]);
    const x0 = rng.int(0, 3);
    const xs = [0, 1, 2, 3, 4].map((i) => x0 + i * h);
    let ys;
    if (level === 2) {
      if (kind === 0) {
        const m = rng.pick([-2.5, -1.5, 0.5, 1.5, 2.5, 3.5]);
        const b = rng.int(10, 40);
        ys = xs.map((_, i) => b + m * i);
      } else if (kind === 1) {
        const [b, a] = rng.pick([[1.5, 16 * rng.int(1, 3)], [0.8, 625], [1.2, 625], [0.5, 16 * rng.int(1, 5)], [2.5, 16]]);
        ys = xs.map((_, i) => Math.round(a * b ** i * 1e6) / 1e6);
      } else {
        const a = rng.pick([0.5, 1.5]);
        const c = rng.int(1, 9);
        ys = xs.map((_, i) => a * (i + 1) * (i + 1) + c);
      }
    } else if (kind === 0) {
      const m = rng.nz(-8, 8);
      const b = rng.int(-10, 30);
      ys = xs.map((_, i) => b + m * i);
    } else if (kind === 1) {
      if (rng.bool()) {
        const b = rng.pick([2, 3]);
        const a = rng.int(1, 6);
        ys = xs.map((_, i) => a * b ** i);
      } else {
        const a = rng.pick([1, 3, 5]) * 16;
        ys = xs.map((_, i) => a / 2 ** i);
      }
    } else {
      const a = rng.int(1, 3);
      const c = rng.int(-4, 6);
      ys = xs.map((_, i) => a * i * i + c);
    }
    return {
      prompt: `Selected values of a function $f$ are shown. The inputs are equally spaced.\n\n${htable('$x$', xs, '$f(x)$', ys)}\n\nWhich type of function could $f$ be?`,
      parts: [mcFixed(options, kind)],
      hint: 'Compare neighboring outputs two ways: subtract them, and divide them. A constant difference means linear; a constant ratio means exponential.',
    };
  },
};

const extendPattern = {
  id: 'extend-linear-and-exponential-patterns',
  lesson: '4.3',
  title: 'Adding versus Multiplying',
  gen(rng, level) {
    const a = rng.int(0, 4);
    const w = rng.int(2, 4);
    const b = a + w;
    const c = b + w;
    if (level === 0) {
      const p = rng.int(-9, 20);
      const d = rng.nz(-9, 12);
      return {
        prompt: `The function $f$ is <b>linear</b>, with $f(${a})=${p}$ and $f(${b})=${p + d}$.\n\nFind $f(${c})$.`,
        parts: [num(p + 2 * d, { label: `$f(${c})=$` })],
        hint: 'The input intervals have the same length. A linear function adds the same amount over equal-length intervals.',
      };
    }
    if (level === 1) {
      const p = rng.int(1, 9);
      const r = rng.pick([2, 3, 4, 5]);
      return {
        prompt: `The function $g$ is <b>exponential</b>, with $g(${a})=${p}$ and $g(${b})=${p * r}$.\n\nFind $g(${c})$.`,
        parts: [num(p * r * r, { label: `$g(${c})=$` })],
        hint: 'The input intervals have the same length. An exponential function multiplies by the same factor over equal-length intervals.',
      };
    }
    const [rn, rd] = rng.pick([[3, 2], [2, 3], [1, 2], [4, 3], [5, 2]]);
    const mid = rn * rd * rng.int(1, 4);
    const a2 = w + rng.int(0, 3);
    return {
      prompt: `The function $g$ is <b>exponential</b>, with $g(${a2})=${mid}$ and $g(${a2 + w})=${(mid * rn) / rd}$.\n\nFind $g(${a2 - w})$. Give an exact answer.`,
      parts: [numFrac(mid * rd, rn, { label: `$g(${a2 - w})=$` })],
      hint: 'Find the factor that takes the first output to the second. Moving the same distance in the opposite direction undoes that factor.',
    };
  },
};

const exponentialFromPoints = {
  id: 'exponential-from-two-points',
  lesson: '4.3',
  title: 'Exponential Functions from Two Points',
  gen(rng, level) {
    const a = rng.int(2, 9);
    const b = rng.pick([2, 3, 4, 5]);
    const f = (x) => a * b ** x;
    const pair = [[0, 1], [0, 2], [1, 3]][level];
    return {
      prompt: `An exponential function of the form $f(x)=a\\cdot b^x$, with $b>0$, passes through the points $(${pair[0]}, ${f(pair[0])})$ and $(${pair[1]}, ${f(pair[1])})$.\n\nWrite a rule for $f(x)$.`,
      parts: [expr(`${a}*${b}^x`, { label: '$f(x)=$', points: [-1, 0, 1, 2, 3, 4] })],
      hint:
        level === 2
          ? 'Divide the two outputs to find $b$ raised to the difference of the inputs. Once you know $b$, work backward to the value at $x=0$.'
          : 'The value at $x=0$ is $a$. Then use the other point to find the factor $b$.',
    };
  },
};

// ---------- Lesson 4.4 ----------

const evaluateExponential = {
  id: 'evaluate-exponential-functions',
  lesson: '4.4',
  title: 'Evaluating Exponential Functions',
  gen(rng, level) {
    const a = rng.int(2, 6);
    if (level === 0) {
      const b = rng.pick([2, 3, 4, 5]);
      const x = rng.int(0, 4);
      return {
        prompt: `Let $f(x)=${T(`${a}*${b}^x`)}$. Find $f(${x})$.`,
        parts: [num(a * b ** x, { label: `$f(${x})=$` })],
        hint: 'Apply the exponent to the base first. Multiply by the coefficient last.',
      };
    }
    if (level === 1) {
      const b = rng.pick([2, 3, 4, 5]);
      const x = -rng.int(1, 3);
      return {
        prompt: `Let $f(x)=${T(`${a}*${b}^x`)}$. Find $f(${x})$. Give an exact answer.`,
        parts: [numFrac(a, b ** -x, { label: `$f(${x})=$` })],
        hint: 'A negative exponent means a reciprocal: the base moves to the denominator with a positive exponent.',
      };
    }
    const [base, p, q, root] = rng.pick([[8, 2, 3, 2], [4, 3, 2, 2], [27, 2, 3, 3], [16, 3, 4, 2], [9, 3, 2, 3], [8, 4, 3, 2], [25, 3, 2, 5], [16, 5, 4, 2]]);
    const neg = rng.bool(0.4);
    const x = `${neg ? '-' : ''}\\frac{${p}}{${q}}`;
    return {
      prompt: `Let $f(x)=${T(`${a}*${base}^x`)}$. Find $f\\left(${x}\\right)$. Give an exact answer.`,
      parts: [neg ? numFrac(a, root ** p, { label: `$f\\left(${x}\\right)=$` }) : num(a * root ** p, { label: `$f\\left(${x}\\right)=$` })],
      hint: 'A fractional exponent combines a root and a power: the denominator is the root and the numerator is the power. Take the root first to keep numbers small.',
    };
  },
};

const growthDecay = {
  id: 'exponential-growth-and-decay',
  lesson: '4.4',
  title: 'Growth, Decay, and Percent Rate',
  gen(rng, level) {
    const a = rng.int(2, 90) * 10;
    const GD = ['Exponential growth', 'Exponential decay'];
    if (level === 0) {
      const grow = rng.bool();
      const b = grow ? rng.pick(['1.5', '2', '3', '1.08', '5/4']) : rng.pick(['0.5', '0.9', '1/3', '0.25', '3/4']);
      return {
        prompt: `Does the function represent exponential growth or exponential decay?\n\n$$f(x)=${T(`${a}(${b})^x`)}$$`,
        parts: [mcFixed(GD, grow ? 0 : 1)],
        hint: 'Look at the base. Multiplying repeatedly by a number greater than 1 makes values grow; multiplying by a number between 0 and 1 makes them shrink.',
      };
    }
    if (level === 1) {
      const grow = rng.bool();
      const pct = rng.int(2, 35);
      const b = round(1 + (grow ? pct : -pct) / 100, 2);
      return {
        prompt: `The value of an account after $t$ years is modeled by $V(t)=${T(`${a}(${b})^t`, ['t'])}$.\n\nIs the value growing or decaying, and by what percent each year?`,
        parts: [mcFixed(GD, grow ? 0 : 1, { label: 'Type:' }), num(pct, { label: 'Percent rate per year:', suffix: '%' })],
        hint: 'Compare the base with 1. The distance between the base and 1, written as a percent, is the rate.',
      };
    }
    const c = rng.int(2, 5);
    const [str, grow, n, d] = rng.pick([
      [`${c}*2^(-x)`, false, 1, 2],
      [`${c}*3^(-x)`, false, 1, 3],
      [`${c}(1/4)^(-x)`, true, 4, 1],
      [`${c}(1/2)^(-x)`, true, 2, 1],
      [`${c}*9^(x/2)`, true, 3, 1],
      [`${c}*8^(-x/3)`, false, 1, 2],
      [`${c}*4^(x/2)`, true, 2, 1],
      [`${c}(1/27)^(x/3)`, false, 1, 3],
    ]);
    return {
      prompt: `Consider the function $f(x)=${T(str)}$.\n\nIs it exponential growth or decay? By what factor is the output multiplied each time $x$ increases by 1?`,
      parts: [mcFixed(GD, grow ? 0 : 1, { label: 'Type:' }), numFrac(n, d, { label: 'Factor:' })],
      hint: 'Use exponent rules to rewrite the function in the form $a\\cdot b^x$, with a plain $x$ in the exponent. Then $b$ is the factor.',
    };
  },
};

const exponentialFromTable = {
  id: 'exponential-from-table',
  lesson: '4.4',
  title: 'Exponential Functions from a Table',
  gen(rng, level) {
    let a;
    let bStr;
    let b;
    let xs;
    if (level === 2) {
      const [n, d] = rng.pick([[1, 2], [1, 3], [2, 3], [3, 2]]);
      a = d ** 3 * rng.int(1, 3);
      b = n / d;
      bStr = `(${n}/${d})`;
      xs = [0, 1, 2, 3];
    } else {
      a = rng.int(2, 9);
      b = rng.pick([2, 3, 4]);
      bStr = `*${b}`;
      xs = level === 0 ? [0, 1, 2, 3] : a % b === 0 && rng.bool() ? [-1, 0, 1, 2] : [1, 2, 3, 4];
    }
    const ys = xs.map((x) => Math.round(a * b ** x * 1e6) / 1e6);
    return {
      prompt: `The table shows values of an exponential function $f(x)=a\\cdot b^x$.\n\n${htable('$x$', xs, '$f(x)$', ys)}\n\nWrite a rule for $f(x)$.`,
      parts: [expr(`${a}${bStr}^x`, { label: '$f(x)=$', points: [-1, 0, 1, 2, 3, 4] })],
      hint: 'The ratio of neighboring outputs is the base $b$. The value of $a$ is the output when $x=0$, which you may have to work back to.',
    };
  },
};

// ---------- Lesson 4.5 ----------

const evaluateNatural = {
  id: 'evaluate-natural-exponential',
  lesson: '4.5',
  title: 'Evaluating with Base e',
  gen(rng, level) {
    const a = rng.int(2, 9);
    let str;
    let x;
    if (level === 0) {
      str = `${a}e^x`;
      x = rng.pick([-2, -1, 1, 2, 3]);
    } else if (level === 1) {
      const k = rng.pick(['0.5', '-0.5', '0.2', '-0.3', '1.5', '-0.1']);
      str = `${a}e^(${k}x)`;
      x = rng.int(2, 6);
    } else {
      const k = rng.pick(['0.25', '-0.4', '0.12', '-0.08']);
      str = plus(`${a * 10}e^(${k}x)`, rng.nz(-9, 9));
      x = rng.pick([2.5, 3.5, 7.5, 12]);
    }
    const value = fnOf(str)(x);
    return {
      prompt: `Let $f(x)=${T(str)}$. Use a calculator to find $f(${x})$. Round to the nearest hundredth.`,
      parts: [num(round(value, 2), { label: `$f(${x})\\approx$`, tol: 0.0051 })],
      hint: 'Use the $e^x$ key on your calculator. Compute the whole exponent first, and do not round until the very end.',
    };
  },
};

const compounding = {
  id: 'compound-interest',
  lesson: '4.5',
  title: 'Compound Interest',
  gen(rng, level) {
    const P = rng.int(5, 80) * 100;
    const rPct = rng.pick([2, 2.5, 3, 3.5, 4, 4.5, 5, 6]);
    const r = rPct / 100;
    const t = rng.int(3, 15);
    const cont = P * Math.exp(r * t);
    if (level === 0) {
      return {
        prompt: `An investment of ${commas(P)} dollars earns ${rPct} percent annual interest, compounded <b>continuously</b>. Use $A=Pe^{rt}$.\n\nFind the value of the investment after ${t} years. Round to the nearest cent.`,
        parts: [num(round(cont, 2), { suffix: 'dollars', tol: 0.0051 })],
        hint: 'Write the interest rate as a decimal before substituting. Compute $rt$ first, then use the $e^x$ key.',
      };
    }
    const [n, word] = rng.pick([[12, 'monthly'], [4, 'quarterly'], [2, 'semiannually'], [365, 'daily']]);
    const disc = P * (1 + r / n) ** (n * t);
    if (level === 1) {
      return {
        prompt: `An investment of ${commas(P)} dollars earns ${rPct} percent annual interest, compounded <b>${word}</b>. Use $A=P\\left(1+\\frac{r}{n}\\right)^{nt}$.\n\nFind the value of the investment after ${t} years. Round to the nearest cent.`,
        parts: [num(round(disc, 2), { suffix: 'dollars', tol: 0.0051 })],
        hint: 'Here $n$ is the number of compounding periods per year. Keep full calculator precision inside the parentheses.',
      };
    }
    return {
      prompt: `Two accounts each start with ${commas(P)} dollars and earn ${rPct} percent annual interest for ${t} years. Account A compounds <b>continuously</b> and account B compounds <b>${word}</b>.\n\nHow much more money is in account A than in account B at the end? Round to the nearest cent.`,
      parts: [num(round(cont - disc, 2), { suffix: 'dollars', tol: 0.011 })],
      hint: 'Compute each final balance with its own formula, keeping full precision. Subtract, and round only at the end.',
    };
  },
};

const continuousRate = {
  id: 'continuous-growth-rates',
  lesson: '4.5',
  title: 'Continuous Growth and Decay',
  gen(rng, level) {
    const a = rng.int(2, 90) * 10;
    const kAbs = rng.pick([0.03, 0.05, 0.08, 0.12, 0.2, 0.25]);
    const k = rng.sign() * kAbs;
    const str = `${a}e^(${k}t)`;
    const shown = `$P(t)=${T(str, ['t'])}$`;
    if (level === 0) {
      return {
        prompt: `A quantity is modeled by ${shown}, where $t$ is in years.\n\nIs the quantity growing or decaying?`,
        parts: [mcFixed(['Growing', 'Decaying'], k > 0 ? 0 : 1)],
        hint: 'Look at the sign of the coefficient of $t$ in the exponent. A negative exponent on $e$ gives values between 0 and 1.',
      };
    }
    const factor = Math.exp(k);
    if (level === 1) {
      return {
        prompt: `A quantity is modeled by ${shown}, where $t$ is in years.\n\nBy what factor is the quantity multiplied each year? Round to four decimal places.`,
        parts: [num(round(factor, 4), { tol: 0.000051 })],
        hint: 'Rewrite $e^{kt}$ as $\\left(e^{k}\\right)^t$. The yearly factor is the base of that power.',
      };
    }
    const pct = Math.abs(factor - 1) * 100;
    return {
      prompt: `A quantity is modeled by ${shown}, where $t$ is in years.\n\nBy what percent does the quantity ${k > 0 ? 'increase' : 'decrease'} each year? Round to the nearest hundredth of a percent.`,
      parts: [num(round(pct, 2), { suffix: '%', tol: 0.0051 })],
      hint: 'Find the yearly growth factor $e^{k}$ first. The percent change is how far that factor is from 1.',
    };
  },
};

const singleE = (ast) => {
  let count = 0;
  walk(ast, (n) => {
    if (n.k === 'const' && n.n === 'e') count++;
    if (n.k === 'fn' && n.n === 'exp') count++;
  });
  return count > 1 ? 'Simplify to a single power of $e$.' : null;
};

const simplifyE = {
  id: 'simplify-powers-of-e',
  lesson: '4.5',
  title: 'Simplifying Powers of e',
  gen(rng, level) {
    const a = rng.int(2, 6);
    const b = rng.int(2, 6);
    let tex;
    let ans;
    if (level === 0) {
      tex = `e^{${a}x}\\cdot e^{${b}x}`;
      ans = `e^(${a + b}x)`;
    } else if (level === 1) {
      const c = rng.int(1, 4);
      tex = `\\frac{\\left(e^{${a}x}\\right)^{${b}}}{e^{${c === 1 ? '' : c}x}}`;
      ans = `e^(${a * b - c}x)`;
    } else {
      const c = rng.int(1, 5);
      const m = rng.int(2, 3);
      tex = `\\frac{\\left(e^{x+${c}}\\right)^{${m}}\\cdot e^{-x}}{e^{${m * c}}}`;
      ans = `e^(${coef(m - 1, 'x')})`;
    }
    return {
      prompt: `Simplify the expression to a single power of $e$.\n\n$$${tex}$$`,
      parts: [expr(ans, { form: singleE, points: [-0.6, -0.3, 0.2, 0.4, 0.7, 1.1] })],
      hint: 'Use the exponent rules: multiplying powers adds exponents, dividing subtracts them, and a power of a power multiplies them.',
    };
  },
};

// ---------- Lesson 4.6 ----------

const rewriteExponential = {
  id: 'rewrite-exponential-expressions',
  lesson: '4.6',
  title: 'Rewriting Exponential Expressions',
  gen(rng, level) {
    const b = rng.pick([2, 3, 4, 5]);
    if (level === 0) {
      const c = rng.int(1, 3);
      return {
        prompt: `The expression $${b}^{x+${c}}$ can be rewritten in the form $a\\cdot ${b}^x$.\n\nFind the value of $a$.`,
        parts: [num(b ** c, { label: '$a=$' })],
        hint: 'Adding in the exponent comes from multiplying powers with the same base. Split the exponent into two parts.',
      };
    }
    if (level === 1) {
      if (rng.bool()) {
        const c = rng.int(2, 3);
        return {
          prompt: `The expression $${b}^{${c}x}$ can be rewritten in the form $d^{\\,x}$.\n\nFind the value of $d$.`,
          parts: [num(b ** c, { label: '$d=$' })],
          hint: 'A product in the exponent comes from a power of a power. Group the base with the constant part of the exponent.',
        };
      }
      const c = rng.int(1, 3);
      return {
        prompt: `The expression $\\left(\\frac{1}{${b ** c}}\\right)^{x}$ can be rewritten in the form $${b}^{kx}$.\n\nFind the value of $k$.`,
        parts: [num(-c, { label: '$k=$' })],
        hint: `Write the fraction as a power of ${b}. Remember what kind of exponent produces a reciprocal.`,
      };
    }
    const k = rng.int(2, 5);
    const [base, root, den] = rng.pick([[4, 2, 2], [9, 3, 2], [8, 2, 3], [27, 3, 3], [16, 4, 2]]);
    const c = rng.int(1, 2);
    return {
      prompt: `The function $f(x)=${k}\\cdot ${base}^{\\frac{x}{${den}}+${c}}$ can be rewritten in the form $f(x)=A\\cdot B^x$.\n\nFind $A$ and $B$.`,
      parts: [num(k * base ** c, { label: '$A=$' }), num(root, { label: '$B=$' })],
      hint: 'Split the exponent into its two parts. One part becomes a constant multiplier; the other becomes a new base raised to the $x$.',
    };
  },
};

const exponentialTransformations = {
  id: 'transformations-of-exponential-functions',
  lesson: '4.6',
  title: 'Features of Transformed Exponential Functions',
  gen(rng, level) {
    const b = rng.pick([2, 3, 4]);
    const a = rng.pick([1, 2, 3, -1, -2]);
    const h = rng.int(1, 2);
    const k = rng.nz(-8, 8);
    const str = plus(`${a === 1 ? '' : a === -1 ? '-' : `${a}*`}${b}^(${shiftStr(h)})`, k);
    const fx = `$g(x)=${T(str)}$`;
    if (level === 0) {
      return {
        prompt: `Find the equation of the horizontal asymptote of the graph of ${fx}.`,
        parts: [num(k, { label: '$y=$' })],
        hint: 'As $x$ decreases without bound, the power term shrinks toward 0. What value is left over?',
      };
    }
    if (level === 1) {
      return {
        prompt: `Find the $y$-intercept of the graph of ${fx}. Give an exact answer.`,
        parts: [numFrac(a + k * b ** h, b ** h, { label: '$y=$' })],
        hint: 'Substitute $x=0$. The exponent becomes negative, so the power becomes a fraction.',
      };
    }
    const lo = a > 0 ? `(${k}, inf)` : `(-inf, ${k})`;
    return {
      prompt: `Find the range of ${fx}. Write your answer in interval notation.`,
      parts: [interval(lo, { label: 'Range:' })],
      hint: 'The power term is always positive but can be as close to 0 as you like. Then account for the sign of the coefficient and the vertical shift.',
    };
  },
};

const matchExponentialGraph = {
  id: 'match-exponential-graph',
  lesson: '4.6',
  title: 'Matching Exponential Graphs',
  gen(rng, level) {
    const [base, other] = rng.pick([['2', '(1/2)'], ['(1/2)', '2'], ['3', '(1/3)'], ['(1/3)', '3']]);
    const s = rng.sign();
    const sg = (v) => (v > 0 ? '' : '-');
    let correct;
    let wrongs;
    let k = 0;
    if (level === 0) {
      correct = `${sg(s)}${base}^x`;
      wrongs = [`${sg(s)}${other}^x`, `${sg(-s)}${base}^x`, `${sg(-s)}${other}^x`];
    } else if (level === 1) {
      k = rng.nz(-4, 4);
      const mk = (ss, bb, kk) => plus(`${sg(ss)}${bb}^x`, kk);
      correct = mk(s, base, k);
      wrongs = [mk(s, other, k), mk(s, base, -k), mk(-s, base, k), mk(-s, other, -k)];
    } else {
      k = rng.nz(-4, 4);
      const h = rng.nz(-3, 3);
      const mk = (hh, kk, ss) => plus(`${sg(ss)}2^(${shiftStr(hh)})`, kk);
      correct = mk(h, k, s);
      wrongs = [mk(-h, k, s), mk(h, -k, s), mk(h, k, -s), mk(-h, -k, s)];
    }
    const f = fnOf(correct);
    return {
      prompt: `The graph of an exponential function is shown, with its horizontal asymptote dashed.\n\n${plot({ x: [-8, 8], y: [-8, 8], curves: [{ f }], hlines: [k] })}\n\nWhich function matches the graph?`,
      parts: [mc(rng, `$y=${T(correct)}$`, wrongs.map((w) => `$y=${T(w)}$`))],
      hint: 'Use three clues: the height of the asymptote, whether the graph sits above or below it, and the exact height where the graph crosses the $y$-axis.',
    };
  },
};

const growthFactorConversion = {
  id: 'growth-factors-over-different-time-units',
  lesson: '4.6',
  title: 'Growth Factors and Time Units',
  gen(rng, level) {
    if (level === 0) {
      const b = rng.pick([2, 3, 4]);
      const n = rng.int(2, 4);
      return {
        prompt: `A population is multiplied by ${b} every year.\n\nBy what factor is the population multiplied over ${n} years?`,
        parts: [num(b ** n)],
        hint: 'Each year applies the same multiplier again. Repeated multiplication is a power.',
      };
    }
    if (level === 1) {
      const [f, n, r] = rng.pick([[9, 2, 3], [4, 2, 2], [8, 3, 2], [27, 3, 3], [16, 4, 2], [25, 2, 5], [16, 2, 4], [64, 3, 4]]);
      return {
        prompt: `A quantity is multiplied by ${f} every ${n} years, growing by the same factor each year.\n\nWhat is the growth factor for one year?`,
        parts: [num(r)],
        hint: `The yearly factor, applied ${n} times in a row, must give ${f}. Which root undoes that?`,
      };
    }
    const pct = rng.pick([4, 5, 6, 8, 10, 12]);
    const b = 1 + pct / 100;
    return {
      prompt: `A town's population is modeled by $P(t)=${rng.int(2, 9)}{,}000\\left(${b}\\right)^t$, where $t$ is in years. The model can be rewritten as $P=P_0\\cdot c^{\\,m}$, where $m$ is the time in <b>months</b>.\n\nFind the monthly growth factor $c$. Round to four decimal places.`,
      parts: [num(round(b ** (1 / 12), 4), { label: '$c\\approx$', tol: 0.000051 })],
      hint: 'Since $t=\\frac{m}{12}$, substitute and regroup the exponent so that the new base is raised to the $m$.',
    };
  },
};

// ---------- Lesson 4.7 ----------

const writeExponentialModel = {
  id: 'write-exponential-models',
  lesson: '4.7',
  title: 'Writing Exponential Models',
  gen(rng, level) {
    const a = rng.int(2, 90) * 10;
    const opts = { label: '$A(t)=$', vars: ['t'], points: [0, 0.5, 1, 1.5, 2, 3, 4, 5] };
    if (level === 0) {
      const pct = rng.int(2, 30);
      const grow = rng.bool();
      const b = round(1 + (grow ? pct : -pct) / 100, 2);
      return {
        prompt: `A quantity starts at ${commas(a)} and ${grow ? 'increases' : 'decreases'} by ${pct} percent each year.\n\nWrite a function $A(t)$ for the quantity after $t$ years.`,
        parts: [expr(`${a}(${b})^t`, opts)],
        hint: `Each year the quantity keeps 100 percent ${grow ? 'plus' : 'minus'} the change. Write that total as a decimal: it is the growth factor.`,
      };
    }
    if (level === 1) {
      const k = rng.int(2, 9);
      const dbl = rng.bool();
      return {
        prompt: `A quantity starts at ${commas(a)} and ${dbl ? `doubles every ${k} hours` : `has a half-life of ${k} hours`}.\n\nWrite a function $A(t)$ for the quantity after $t$ hours.`,
        parts: [expr(dbl ? `${a}*2^(t/${k})` : `${a}(1/2)^(t/${k})`, opts)],
        hint: `The exponent should count how many ${dbl ? 'doublings' : 'half-lives'} have happened after $t$ hours. Check your formula at $t=${k}$.`,
      };
    }
    const k = rng.int(2, 6);
    if (rng.bool()) {
      const f = rng.pick([3, 4, 5]);
      return {
        prompt: `A quantity starts at ${commas(a)} and is multiplied by ${f} every ${k} days.\n\nWrite a function $A(t)$ for the quantity after $t$ days.`,
        parts: [expr(`${a}*${f}^(t/${k})`, opts)],
        hint: `The exponent should count how many ${k}-day periods have passed. Check your formula at $t=${k}$.`,
      };
    }
    const pct = rng.pick([10, 15, 20, 25, 30, 40]);
    return {
      prompt: `A quantity starts at ${commas(a)} and decreases by ${pct} percent every ${k} days.\n\nWrite a function $A(t)$ for the quantity after $t$ days.`,
      parts: [expr(`${a}(${round(1 - pct / 100, 2)})^(t/${k})`, opts)],
      hint: `Find the factor for one ${k}-day period first. The exponent should count how many of those periods have passed.`,
    };
  },
};

const predictWithModel = {
  id: 'predict-with-exponential-models',
  lesson: '4.7',
  title: 'Predicting with Exponential Models',
  gen(rng, level) {
    if (level === 0) {
      const a = rng.int(2, 9) * 50;
      const k = rng.int(2, 5);
      const n = rng.int(2, 4);
      return {
        prompt: `A population of ${a} insects doubles every ${k} weeks.\n\nHow many insects are there after ${k * n} weeks?`,
        parts: [num(a * 2 ** n, { suffix: 'insects' })],
        hint: 'Work out how many doubling periods fit into the given time. Each one multiplies the population by 2.',
      };
    }
    if (level === 1) {
      const a = rng.int(10, 90) * 100;
      const pct = rng.int(2, 9);
      const t = rng.int(4, 12);
      const grow = rng.bool();
      const value = a * (1 + (grow ? pct : -pct) / 100) ** t;
      return {
        prompt: `A town has ${commas(a)} residents, and its population ${grow ? 'grows' : 'shrinks'} by ${pct} percent per year.\n\nPredict the population after ${t} years. Round to the nearest whole number.`,
        parts: [num(Math.round(value), { suffix: 'residents', tol: 0.51 })],
        hint: 'Build the model (starting value) times (growth factor) to the power $t$ first. Then substitute the number of years.',
      };
    }
    const a = rng.int(2, 9) * 100;
    const h = rng.pick([4, 6, 8, 12]);
    const t = rng.intExcept(3, 20, [h, 2 * h, 3 * h]);
    return {
      prompt: `A patient receives ${a} milligrams of a medicine that has a half-life of ${h} hours.\n\nHow much of the medicine remains after ${t} hours? Round to the nearest tenth of a milligram.`,
      parts: [num(round(a * 0.5 ** (t / h), 1), { suffix: 'milligrams', tol: 0.051 })],
      hint: `The number of half-lives is the time divided by ${h}, and it does not have to be a whole number. Use it as the exponent on one half.`,
    };
  },
};

const rateFromData = {
  id: 'growth-rate-from-data',
  lesson: '4.7',
  title: 'Finding Growth Rates from Data',
  gen(rng, level) {
    const a = rng.int(2, 9) * 100;
    if (level === 0) {
      const pct = rng.pick([5, 10, 15, 20, 25, 30, 40, 50]);
      const grow = rng.bool();
      const b = a * (1 + (grow ? pct : -pct) / 100);
      return {
        prompt: `An exponential model has the value ${a} at $t=0$ years and the value ${round(b, 2)} at $t=1$ year.\n\nBy what percent does the quantity ${grow ? 'increase' : 'decrease'} each year?`,
        parts: [num(pct, { suffix: '%' })],
        hint: 'Divide the later value by the earlier value to get the yearly factor. Then compare that factor with 1.',
      };
    }
    if (level === 1) {
      const f = rng.pick([1.1, 1.2, 1.5, 0.5, 0.8, 0.9, 1.3]);
      const b = round(a * f * f, 2);
      return {
        prompt: `An exponential model $A(t)=a\\cdot b^t$ has the value ${a} at $t=0$ and the value ${commas(b)} at $t=2$.\n\nFind the growth factor $b$.`,
        parts: [num(f, { label: '$b=$' })],
        hint: 'Two time steps multiply the starting value by $b$ twice. Divide the two values, then undo the squaring.',
      };
    }
    const k = rng.int(3, 8);
    const end = a + rng.nz(-1, 6) * 100 + 50;
    const f = (end / a) ** (1 / k);
    return {
      prompt: `An exponential model $A(t)=a\\cdot b^t$ has the value ${a} at $t=0$ and the value ${commas(end)} at $t=${k}$.\n\nFind the growth factor $b$. Round to three decimal places.`,
      parts: [num(round(f, 3), { label: '$b\\approx$', tol: 0.00051 })],
      hint: `Over ${k} time steps the starting value is multiplied by $b^{${k}}$. Divide the two values, then take the appropriate root.`,
    };
  },
};

// ---------- Lesson 4.8 ----------

const residual = {
  id: 'residuals',
  lesson: '4.8',
  title: 'Calculating Residuals',
  gen(rng, level) {
    if (level === 0) {
      const pred = round(rng.int(200, 900) / 10, 1);
      const act = round(pred + rng.nz(-40, 40) / 10, 1);
      return {
        prompt: `A regression model predicts a value of ${pred} for a certain input. The actual observed value is ${act}.\n\nFind the residual.`,
        parts: [num(round(act - pred, 1), { label: 'Residual $=$' })],
        hint: 'A residual compares what really happened with what the model said. The order of the subtraction matters: actual value first.',
      };
    }
    const x = rng.int(3, 12);
    if (level === 1) {
      const m = round(rng.int(11, 59) / 10, 1);
      const b = round(rng.intExcept(-90, 150, [0]) / 10, 1);
      const pred = round(m * x + b, 2);
      const act = round(pred + rng.nz(-30, 30) / 10, 1);
      return {
        prompt: `A linear regression model for a data set is $\\hat{y}=${m}x${b < 0 ? '-' : '+'}${Math.abs(b)}$. One of the data points is $(${x}, ${act})$.\n\nFind the residual for this data point.`,
        parts: [num(round(act - pred, 2), { label: 'Residual $=$', tol: 0.0051 })],
        hint: 'First use the model to predict the output at the given input. Then subtract: actual minus predicted.',
      };
    }
    const a = round(rng.int(20, 90) / 10, 1);
    const b = rng.pick([1.1, 1.15, 1.2, 1.25, 0.9, 0.85]);
    const xs = rng.int(3, 8);
    const pred = a * b ** xs;
    const act = round(pred + rng.nz(-20, 20) / 10, 1);
    return {
      prompt: `An exponential regression model for a data set is $\\hat{y}=${a}\\left(${b}\\right)^x$. One of the data points is $(${xs}, ${act})$.\n\nFind the residual for this data point. Round to the nearest hundredth.`,
      parts: [num(round(act - pred, 2), { label: 'Residual $\\approx$', tol: 0.0051 })],
      hint: 'First use the model to predict the output at the given input, keeping full precision. Then subtract: actual minus predicted.',
    };
  },
};

const residualPlot = {
  id: 'residual-plots',
  lesson: '4.8',
  title: 'Interpreting Residual Plots',
  gen(rng, level) {
    const good = rng.bool();
    const n = 10;
    const xs = Array.from({ length: n }, (_, i) => i + 1);
    let rs;
    if (good) {
      const base = [1.5, -2, 0.8, 2.2, -1.2, -2.5, 1.8, -0.6, 2.4, -1.6];
      const flip = rng.sign();
      rs = rng.shuffle(base).map((v) => flip * v + (rng.next() - 0.5));
    } else {
      const s = level === 0 ? 1 : rng.sign();
      rs = xs.map((x) => s * (0.22 * (x - 5.5) ** 2 - 2.2) + (rng.next() - 0.5) * 0.6);
    }
    const options = [
      'Yes. The residuals are randomly scattered with no clear pattern.',
      'No. The residuals show a clear curved pattern.',
      'Yes. The residuals show a clear curved pattern.',
      'No. Some of the residuals are negative.',
    ];
    if (level === 2) {
      const list = rs.map((r) => round(r, 1));
      return {
        prompt: `A linear model was fit to a data set. The residuals, listed in order of increasing $x$, are shown.\n\n${htable('$x$', xs, 'Residual', list)}\n\nIs a linear model appropriate for these data?`,
        parts: [mcFixed(options, good ? 0 : 1)],
        hint: 'Read the signs of the residuals from left to right. Do positives and negatives mix randomly, or do they come in long runs?',
      };
    }
    const fig = plot({
      x: [0, 11], y: [-4, 4], w: 540, h: 340, xLabelsBottom: true, xlabelEvery: 1, ylabelEvery: 1, xname: 'x', yname: 'residual',
      points: xs.map((x, i) => ({ x, y: rs[i], r: 3.5 })),
    });
    return {
      prompt: `A linear model was fit to a data set. The residual plot is shown.\n\n${fig}\n\nIs a linear model appropriate for these data?`,
      parts: [mcFixed(options, good ? 0 : 1)],
      hint: 'A good model leaves behind residuals that look like random noise around zero. Any leftover shape means the model missed something.',
    };
  },
};

const overUnder = {
  id: 'overestimates-and-underestimates',
  lesson: '4.8',
  title: 'Overestimates and Underestimates',
  gen(rng, level) {
    const options = ['The model overestimates the actual value', 'The model underestimates the actual value'];
    const hintSign = 'A residual is actual minus predicted. Think about which of the two numbers must be larger for the residual to have its sign.';
    if (level === 0) {
      const r = round(rng.nz(-60, 60) / 10, 1);
      return {
        prompt: `For one data point, the residual of a regression model is $${r}$.\n\nWhat does this tell you about the model's prediction for that point?`,
        parts: [mcFixed(options, r < 0 ? 0 : 1)],
        hint: hintSign,
      };
    }
    const x = rng.int(2, 10);
    let model;
    let pred;
    if (level === 1) {
      const m = round(rng.int(11, 49) / 10, 1);
      const b = rng.int(1, 20);
      model = `\\hat{y}=${m}x+${b}`;
      pred = m * x + b;
    } else {
      const a = rng.int(2, 9);
      const b = rng.pick([1.2, 1.5, 0.8, 1.1]);
      model = `\\hat{y}=${a}\\left(${b}\\right)^x`;
      pred = a * b ** x;
    }
    const act = round(pred + rng.nz(-25, 25) / 10, 1);
    const res = round(act - pred, 2);
    return {
      prompt: `A regression model is $${model}$. One of the data points is $(${x}, ${act})$.\n\nFind the residual for this point (round to the nearest hundredth if needed), and decide whether the model overestimates or underestimates.`,
      parts: [num(res, { label: 'Residual $=$', tol: 0.0051 }), mcFixed(options, res < 0 ? 0 : 1, { label: 'Conclusion:' })],
      hint: hintSign,
    };
  },
};

const useRegression = {
  id: 'predict-with-regression-models',
  lesson: '4.8',
  title: 'Predicting with Regression Models',
  gen(rng, level) {
    const lo = rng.int(1, 5);
    const hi = lo + rng.int(8, 15);
    const inside = rng.bool();
    const x = inside ? rng.int(lo + 1, hi - 1) : hi + rng.int(2, 10);
    let model;
    let value;
    if (level === 0) {
      const m = round(rng.int(11, 79) / 10, 1);
      const b = round(rng.int(10, 300) / 10, 1);
      model = `\\hat{y}=${m}x+${b}`;
      value = m * x + b;
    } else if (level === 1) {
      const a = round(rng.nz(-9, 9) / 10, 1);
      const b = round(rng.int(11, 60) / 10, 1);
      const c = round(rng.int(10, 200) / 10, 1);
      model = `\\hat{y}=${a}x^2+${b}x+${c}`;
      value = a * x * x + b * x + c;
    } else {
      const a = round(rng.int(20, 90) / 10, 1);
      const b = rng.pick([1.05, 1.08, 1.12, 0.95, 0.9]);
      model = `\\hat{y}=${a}\\left(${b}\\right)^x`;
      value = a * b ** x;
    }
    return {
      prompt: `A regression model built from data with inputs between $x=${lo}$ and $x=${hi}$ is $${model}$.\n\nUse the model to predict the output when $x=${x}$ (round to the nearest hundredth if needed), and classify the prediction.`,
      parts: [
        num(round(value, 2), { label: 'Prediction:', tol: 0.0051 }),
        mcFixed(['Interpolation (inside the range of the data)', 'Extrapolation (outside the range of the data)'], inside ? 0 : 1, { label: 'Type:' }),
      ],
      hint: 'Substitute the input into the model for the prediction. For the classification, compare the input with the range of inputs used to build the model.',
    };
  },
};

export default [
  arithmeticNthTerm, arithmeticFormula, arithmeticFindN,
  geometricNthTerm, geometricFormula, sequenceType, geometricContext,
  linearVsExponential, extendPattern, exponentialFromPoints,
  evaluateExponential, growthDecay, exponentialFromTable,
  evaluateNatural, compounding, continuousRate, simplifyE,
  rewriteExponential, exponentialTransformations, matchExponentialGraph, growthFactorConversion,
  writeExponentialModel, predictWithModel, rateFromData,
  residual, residualPlot, overUnder, useRegression,
];
