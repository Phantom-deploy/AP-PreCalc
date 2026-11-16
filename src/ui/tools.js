// Scientific and graphing calculators, opened from the sidebar in a dialog.

import { evalStr, parse, toTex, fnOf } from '../lib/expr.js';
import { tex } from '../lib/render.js';
import { plot } from '../lib/graph.js';
import { esc } from './shell.js';

let dialog = null;

function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'tool-dialog';
  document.body.appendChild(dialog);
  dialog.addEventListener('click', (ev) => {
    if (ev.target === dialog || ev.target.closest('[data-close]')) dialog.close();
  });
  return dialog;
}

function format(v) {
  if (!Number.isFinite(v)) return Number.isNaN(v) ? 'undefined' : v > 0 ? '∞' : '-∞';
  const r = Math.round(v * 1e10) / 1e10;
  return String(r);
}

const SCI_KEYS = [
  ['7', '7'], ['8', '8'], ['9', '9'], ['÷', '/'], ['sin', 'sin('], ['cos', 'cos('],
  ['4', '4'], ['5', '5'], ['6', '6'], ['×', '*'], ['tan', 'tan('], ['π', 'pi'],
  ['1', '1'], ['2', '2'], ['3', '3'], ['−', '-'], ['ln', 'ln('], ['log', 'log('],
  ['0', '0'], ['.', '.'], ['(', '('], [')', ')'], ['+', '+'], ['xⁿ', '^'],
  ['√', 'sqrt('], ['e', 'e'], ['|x|', 'abs('], ['logₙ', 'log_'],
];

export function openScientific() {
  const d = ensureDialog();
  d.innerHTML =
    `<div class="tool"><div class="tool-head"><h2 class="serif">Scientific Calculator</h2><button type="button" class="btn btn-outline btn-close" data-close>Close</button></div>` +
    `<form class="sci-form"><input type="text" class="sci-input" aria-label="Expression" placeholder="Type an expression, for example 2^10 or ln(5)/ln(2)" autocomplete="off" spellcheck="false">` +
    `<div class="sci-preview" aria-live="polite"></div>` +
    `<div class="sci-keys">${SCI_KEYS.map(([l, v]) => `<button type="button" class="key" data-ins="${esc(v)}">${l}</button>`).join('')}` +
    `<button type="button" class="key" data-clear>Clear</button><button type="submit" class="btn btn-primary sci-eq">=</button></div></form>` +
    `<p class="tool-note">Angles are in radians. Type log_2(8) for a base 2 logarithm.</p>` +
    `<ol class="sci-history" aria-label="History"></ol></div>`;
  const input = d.querySelector('.sci-input');
  const preview = d.querySelector('.sci-preview');
  const history = d.querySelector('.sci-history');
  const show = () => {
    const raw = input.value.trim();
    if (!raw) return (preview.textContent = '');
    try {
      preview.innerHTML = `${tex(toTex(parse(raw)))} <span class="sci-eqsign">=</span> <b>${esc(format(evalStr(raw)))}</b>`;
    } catch {
      preview.textContent = '';
    }
  };
  input.addEventListener('input', show);
  d.querySelector('.sci-keys').addEventListener('click', (ev) => {
    const k = ev.target.closest('[data-ins]');
    if (ev.target.closest('[data-clear]')) {
      input.value = '';
      show();
      input.focus();
      return;
    }
    if (!k) return;
    const s = input.selectionStart ?? input.value.length;
    const e = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, s) + k.dataset.ins + input.value.slice(e);
    input.focus();
    input.setSelectionRange(s + k.dataset.ins.length, s + k.dataset.ins.length);
    show();
  });
  d.querySelector('.sci-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    let line;
    try {
      line = `${tex(toTex(parse(raw)))} = <b>${esc(format(evalStr(raw)))}</b>`;
    } catch {
      line = `<span class="bad">Could not read "${esc(raw)}". Check your parentheses.</span>`;
    }
    history.insertAdjacentHTML('afterbegin', `<li>${line}</li>`);
    input.select();
  });
  d.showModal();
  input.focus();
}

const COLORS = ['#000000', '#c0392b', '#1f5fa8'];

export function openGraphing() {
  const d = ensureDialog();
  d.innerHTML =
    `<div class="tool tool-wide"><div class="tool-head"><h2 class="serif">Graphing Calculator</h2><button type="button" class="btn btn-outline btn-close" data-close>Close</button></div>` +
    `<div class="graph-tool"><form class="graph-form">` +
    [0, 1, 2]
      .map((i) => `<label class="fn-row"><span class="swatch" style="background:${COLORS[i]}"></span><span class="serif">y${i + 1} =</span><input type="text" data-fn="${i}" autocomplete="off" spellcheck="false" placeholder="${['x^2-3', '2^x', ''][i]}"></label>`)
      .join('') +
    `<div class="win"><span>Window:</span><label>x from <input type="number" data-w="x0" value="-10"></label><label>to <input type="number" data-w="x1" value="10"></label>` +
    `<label>y from <input type="number" data-w="y0" value="-10"></label><label>to <input type="number" data-w="y1" value="10"></label></div>` +
    `<button type="submit" class="btn btn-primary">Graph</button><p class="tool-note graph-msg" aria-live="polite"></p></form>` +
    `<div class="graph-out"></div></div></div>`;
  const out = d.querySelector('.graph-out');
  const msg = d.querySelector('.graph-msg');
  const draw = () => {
    const w = {};
    d.querySelectorAll('[data-w]').forEach((el) => (w[el.dataset.w] = Number(el.value)));
    if (!(w.x1 > w.x0) || !(w.y1 > w.y0)) {
      msg.textContent = 'Each window range needs a smaller first number.';
      return;
    }
    const curves = [];
    const problems = [];
    d.querySelectorAll('[data-fn]').forEach((el) => {
      const raw = el.value.trim();
      if (!raw) return;
      try {
        const f = fnOf(raw.replace(/^y\s*=/i, ''));
        f(1);
        curves.push({ f: (x) => { try { return f(x); } catch { return NaN; } }, color: COLORS[Number(el.dataset.fn)] });
      } catch {
        problems.push(`y${Number(el.dataset.fn) + 1}`);
      }
    });
    msg.textContent = problems.length ? `Could not read ${problems.join(' and ')}. Use x as the variable.` : '';
    const span = Math.max(w.x1 - w.x0, w.y1 - w.y0);
    const step = span > 40 ? 10 : span > 20 ? 5 : 1;
    out.innerHTML = plot({ x: [w.x0, w.x1], y: [w.y0, w.y1], xstep: step, ystep: step, curves, w: 520, h: 520 });
  };
  d.querySelector('.graph-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    draw();
  });
  d.querySelector('[data-fn="0"]').value = 'x^2-3';
  d.querySelector('[data-fn="1"]').value = '2^x';
  draw();
  d.showModal();
  d.querySelector('[data-fn="0"]').focus();
}
