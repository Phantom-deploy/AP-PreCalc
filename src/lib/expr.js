// Expression parser, evaluator, and TeX printer.
// Supports + - * / ^, implicit multiplication, parentheses, |x|,
// sqrt, cbrt, ln, log (base 10), log_b(x), abs, exp, sin, cos, tan, pi, e.

const FUNCS = ['sqrt', 'cbrt', 'log', 'ln', 'abs', 'exp', 'sin', 'cos', 'tan'];
const WORDS = [...FUNCS, 'infinity', 'inf', 'pi'].sort((a, b) => b.length - a.length);

export function normalize(input) {
  return String(input)
    .replace(/[−–—]/g, '-')
    .replace(/[×·⋅]/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/∞/g, 'inf')
    .replace(/\*\*/g, '^')
    .replace(/\\left|\\right/g, '')
    .replace(/[\[\]]/g, (c) => (c === '[' ? '(' : ')'))
    .trim();
}

function tokenize(src) {
  const s = src.toLowerCase();
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      if (s[j] === '.') {
        j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      const text = s.slice(i, j);
      if (text === '.') throw new Error('Unexpected "."');
      out.push({ t: 'num', v: parseFloat(text) });
      i = j;
      continue;
    }
    if (/[a-z]/.test(c)) {
      const word = WORDS.find((w) => s.startsWith(w, i));
      if (word) {
        out.push({ t: 'id', v: word === 'infinity' ? 'inf' : word });
        i += word.length;
      } else {
        out.push({ t: 'id', v: c });
        i++;
      }
      continue;
    }
    if ('+-*/^()|_{},'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected symbol "${c}"`);
  }
  return out;
}

class Parser {
  constructor(tokens, vars) {
    this.toks = tokens;
    this.pos = 0;
    this.vars = vars;
    this.absDepth = 0;
  }
  peek(offset = 0) {
    return this.toks[this.pos + offset];
  }
  isOp(v, offset = 0) {
    const t = this.peek(offset);
    return !!t && t.t === 'op' && t.v === v;
  }
  eat(v) {
    if (!this.isOp(v)) throw new Error(`Expected "${v}"`);
    this.pos++;
  }
  parseExpr() {
    let left = this.parseTerm();
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.peek().v;
      this.pos++;
      const right = this.parseTerm();
      left = { k: op === '+' ? 'add' : 'sub', a: left, b: right };
    }
    return left;
  }
  startsImplicit() {
    const t = this.peek();
    if (!t) return false;
    if (t.t === 'num' || t.t === 'id') return true;
    if (t.t === 'op' && t.v === '(') return true;
    if (t.t === 'op' && t.v === '|' && this.absDepth === 0) return true;
    return false;
  }
  parseTerm() {
    let left = this.parseUnary();
    for (;;) {
      if (this.isOp('*')) {
        this.pos++;
        left = { k: 'mul', a: left, b: this.parseUnary() };
      } else if (this.isOp('/')) {
        this.pos++;
        left = { k: 'div', a: left, b: this.parseUnary() };
      } else if (this.startsImplicit()) {
        left = { k: 'mul', a: left, b: this.parsePower() };
      } else {
        return left;
      }
    }
  }
  parseUnary() {
    if (this.isOp('-')) {
      this.pos++;
      return { k: 'neg', a: this.parseUnary() };
    }
    if (this.isOp('+')) {
      this.pos++;
      return this.parseUnary();
    }
    return this.parsePower();
  }
  parsePower() {
    const base = this.parsePrimary();
    if (this.isOp('^')) {
      this.pos++;
      let exponent;
      if (this.isOp('{')) {
        this.pos++;
        exponent = this.parseExpr();
        this.eat('}');
      } else {
        exponent = this.parseUnary();
      }
      return { k: 'pow', a: base, b: exponent };
    }
    return base;
  }
  parseGroup() {
    // assumes current token is ( or {
    const close = this.peek().v === '(' ? ')' : '}';
    this.pos++;
    const saved = this.absDepth;
    this.absDepth = 0;
    const inner = this.parseExpr();
    this.absDepth = saved;
    this.eat(close);
    return inner;
  }
  parseFuncArg() {
    if (this.isOp('(')) return this.parseGroup();
    return this.parsePower();
  }
  parsePrimary() {
    const t = this.peek();
    if (!t) throw new Error('Incomplete expression');
    if (t.t === 'num') {
      this.pos++;
      return { k: 'num', v: t.v };
    }
    if (t.t === 'op') {
      if (t.v === '(' || t.v === '{') return this.parseGroup();
      if (t.v === '|') {
        this.pos++;
        this.absDepth++;
        const inner = this.parseExpr();
        this.absDepth--;
        this.eat('|');
        return { k: 'fn', n: 'abs', a: inner };
      }
      throw new Error(`Unexpected "${t.v}"`);
    }
    // identifier
    this.pos++;
    const name = t.v;
    if (name === 'pi') return { k: 'const', n: 'pi' };
    if (name === 'inf') return { k: 'const', n: 'inf' };
    if (name === 'log') {
      let base = null;
      if (this.isOp('_')) {
        this.pos++;
        const b = this.peek();
        if (!b) throw new Error('Incomplete logarithm');
        if (b.t === 'op' && (b.v === '(' || b.v === '{')) base = this.parseGroup();
        else if (b.t === 'num') {
          this.pos++;
          base = { k: 'num', v: b.v };
        } else if (b.t === 'id' && b.v.length === 1) {
          this.pos++;
          base = b.v === 'e' && !this.vars.includes('e') ? { k: 'const', n: 'e' } : { k: 'var', n: b.v };
        } else throw new Error('Could not read the base of the logarithm');
      } else if (this.peek() && this.peek().t === 'num' && this.isOp('(', 1)) {
        base = { k: 'num', v: this.peek().v };
        this.pos++;
      }
      const arg = this.parseFuncArg();
      return { k: 'fn', n: 'log', a: arg, base };
    }
    if (FUNCS.includes(name)) {
      return { k: 'fn', n: name, a: this.parseFuncArg() };
    }
    if (name === 'e' && !this.vars.includes('e')) return { k: 'const', n: 'e' };
    return { k: 'var', n: name };
  }
}

export function parse(input, vars = []) {
  const src = normalize(input);
  if (!src) throw new Error('Empty expression');
  const parser = new Parser(tokenize(src), vars);
  const ast = parser.parseExpr();
  if (parser.pos < parser.toks.length) {
    const t = parser.peek();
    throw new Error(`Unexpected "${t.v}"`);
  }
  return ast;
}

function rationalExponent(node) {
  // detects p/q with odd q so that negative bases have real roots
  if (node.k === 'div' && node.a.k === 'num' && node.b.k === 'num') {
    const p = node.a.v;
    const q = node.b.v;
    if (Number.isInteger(p) && Number.isInteger(q) && q % 2 !== 0) return { p, q };
  }
  if (node.k === 'neg') {
    const r = rationalExponent(node.a);
    if (r) return { p: -r.p, q: r.q };
  }
  return null;
}

export function evaluate(node, scope = {}) {
  switch (node.k) {
    case 'num':
      return node.v;
    case 'const':
      return node.n === 'pi' ? Math.PI : node.n === 'e' ? Math.E : Infinity;
    case 'var':
      if (!(node.n in scope)) throw new Error(`Unexpected variable "${node.n}"`);
      return scope[node.n];
    case 'neg':
      return -evaluate(node.a, scope);
    case 'add':
      return evaluate(node.a, scope) + evaluate(node.b, scope);
    case 'sub':
      return evaluate(node.a, scope) - evaluate(node.b, scope);
    case 'mul':
      return evaluate(node.a, scope) * evaluate(node.b, scope);
    case 'div':
      return evaluate(node.a, scope) / evaluate(node.b, scope);
    case 'pow': {
      const base = evaluate(node.a, scope);
      const ex = evaluate(node.b, scope);
      if (base < 0 && !Number.isInteger(ex)) {
        const r = rationalExponent(node.b);
        if (r) {
          const mag = Math.pow(-base, r.p / r.q);
          return Math.abs(r.p) % 2 === 0 ? mag : -mag;
        }
      }
      return Math.pow(base, ex);
    }
    case 'fn': {
      const x = evaluate(node.a, scope);
      switch (node.n) {
        case 'sqrt':
          return Math.sqrt(x);
        case 'cbrt':
          return Math.cbrt(x);
        case 'ln':
          return Math.log(x);
        case 'log': {
          if (!node.base) return Math.log10(x);
          const b = evaluate(node.base, scope);
          if (b <= 0 || b === 1) return NaN;
          return Math.log(x) / Math.log(b);
        }
        case 'abs':
          return Math.abs(x);
        case 'exp':
          return Math.exp(x);
        case 'sin':
          return Math.sin(x);
        case 'cos':
          return Math.cos(x);
        case 'tan':
          return Math.tan(x);
        default:
          throw new Error('Unknown function');
      }
    }
    default:
      throw new Error('Bad expression');
  }
}

export function variablesOf(node, acc = new Set()) {
  if (!node || typeof node !== 'object') return acc;
  if (node.k === 'var') acc.add(node.n);
  if (node.a) variablesOf(node.a, acc);
  if (node.b) variablesOf(node.b, acc);
  if (node.base) variablesOf(node.base, acc);
  return acc;
}

// Walk every node of the tree.
export function walk(node, fn) {
  if (!node || typeof node !== 'object') return;
  fn(node);
  if (node.a) walk(node.a, fn);
  if (node.b) walk(node.b, fn);
  if (node.base) walk(node.base, fn);
}

function fmtNum(v) {
  if (!Number.isFinite(v)) return '\\infty';
  const s = String(v);
  return s.includes('e') ? v.toFixed(10).replace(/\.?0+$/, '') : s;
}

function leadsWithNumber(n) {
  if (n.k === 'num') return true;
  if (n.k === 'pow' || n.k === 'mul') return leadsWithNumber(n.a);
  return false;
}

const paren = (s) => `\\left(${s}\\right)`;

export function toTex(n) {
  switch (n.k) {
    case 'num':
      return fmtNum(n.v);
    case 'var':
      return n.n;
    case 'const':
      return n.n === 'pi' ? '\\pi ' : n.n === 'e' ? 'e' : '\\infty ';
    case 'neg': {
      const inner = toTex(n.a);
      return '-' + (['add', 'sub', 'neg'].includes(n.a.k) ? paren(inner) : inner);
    }
    case 'add': {
      const r = toTex(n.b);
      return `${toTex(n.a)}+${n.b.k === 'neg' ? paren(r) : r}`;
    }
    case 'sub': {
      const r = toTex(n.b);
      return `${toTex(n.a)}-${['add', 'sub', 'neg'].includes(n.b.k) ? paren(r) : r}`;
    }
    case 'mul': {
      const l = toTex(n.a);
      const r = toTex(n.b);
      const L = ['add', 'sub'].includes(n.a.k) ? paren(l) : l;
      const needsParenR = ['add', 'sub', 'neg'].includes(n.b.k);
      const R = needsParenR ? paren(r) : r;
      const dot = !needsParenR && leadsWithNumber(n.b);
      return dot ? `${L}\\cdot ${R}` : `${L}${R}`;
    }
    case 'div':
      return `\\frac{${toTex(n.a)}}{${toTex(n.b)}}`;
    case 'pow': {
      const b = toTex(n.a);
      const simple = n.a.k === 'var' || n.a.k === 'const' || (n.a.k === 'num' && n.a.v >= 0);
      return `${simple ? b : paren(b)}^{${toTex(n.b)}}`;
    }
    case 'fn': {
      const a = toTex(n.a);
      switch (n.n) {
        case 'sqrt':
          return `\\sqrt{${a}}`;
        case 'cbrt':
          return `\\sqrt[3]{${a}}`;
        case 'abs':
          return `\\left|${a}\\right|`;
        case 'exp':
          return `e^{${a}}`;
        case 'ln':
          return `\\ln\\left(${a}\\right)`;
        case 'log':
          return n.base ? `\\log_{${toTex(n.base)}}\\left(${a}\\right)` : `\\log\\left(${a}\\right)`;
        default:
          return `\\${n.n}\\left(${a}\\right)`;
      }
    }
    default:
      return '';
  }
}

// Convenience: plain string to TeX. Falls back to the raw string if it cannot parse.
export function T(str, vars = []) {
  try {
    return toTex(parse(str, vars));
  } catch {
    return String(str);
  }
}

// Convenience: build a numeric function of one variable from a plain string.
export function fnOf(str, v = 'x') {
  const ast = parse(str, [v]);
  return (x) => evaluate(ast, { [v]: x });
}

export function evalStr(str, scope = {}) {
  return evaluate(parse(str, Object.keys(scope)), scope);
}
