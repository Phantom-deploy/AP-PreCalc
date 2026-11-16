// Renders one problem in the DeltaMath layout: a "Question" section and a gray "Answer" panel.
// Checks answers, shows feedback, one hint per miss, Try Again, Next Problem, and Show Answer.

import { renderProblemText, renderText, tex } from '../lib/render.js';
import { checkProblem, answerTex } from '../lib/check.js';
import { parse, toTex } from '../lib/expr.js';
import { esc } from './shell.js';

const KEYS = {
  math: [['x²', '^2'], ['xⁿ', '^'], ['√', 'sqrt('], ['|x|', 'abs('], ['π', 'pi'], ['e', 'e'], ['ln', 'ln('], ['log', 'log('], ['logₙ', 'log_']],
  interval: [['[ , ]', '[ , ]'], ['[ , )', '[ , )'], ['( , ]', '( , ]'], ['( , )', '( , )'], ['−∞', '-inf'], ['∞', 'inf'], ['∪', ' U '], ['All Real Numbers', '(-inf, inf)']],
};

const HELP = {
  interval: 'Type inf for infinity and U for union.',
  set: 'Separate values with commas. Type none if there are no values.',
  point: 'Enter an ordered pair such as (2, -5).',
};

/*
  opts:
    problem        the generated problem
    solved         already answered correctly earlier (daily page)
    revealed       answer was already shown earlier (daily page)
    nextLabel      string or function returning the label for the move-on button
    onNext()       move on
    onResult(r)    r = { correct, firstTry, attempts, revealed }
    headerButton   { label, onClick } shown at the top right of the Question section
*/
export function mountProblem(root, opts) {
  const { problem } = opts;
  let attempts = 0;
  let finished = false;
  let wrongCount = 0;

  const partsHtml = problem.parts
    .map((part, i) => {
      if (part.type === 'choice') {
        return (
          `<div class="part" data-i="${i}">` +
          (part.label ? `<div class="choice-label">${renderText(part.label)}</div>` : '') +
          `<ul class="choices">${part.choices
            .map((c, j) => `<li><label><input type="radio" name="p${i}" value="${j}"><span>${renderText(c)}</span></label></li>`)
            .join('')}</ul></div>`
        );
      }
      const keyKind = part.type === 'interval' ? 'interval' : ['number', 'expr', 'custom'].includes(part.type) ? 'math' : null;
      const keys = keyKind
        ? `<div class="keys" aria-label="Symbol buttons">${KEYS[keyKind].map(([lab, ins]) => `<button type="button" class="key" data-ins="${esc(ins)}" tabindex="-1">${lab}</button>`).join('')}</div>`
        : '';
      return (
        `<div class="part" data-i="${i}"><div class="part-row">` +
        `<label class="part-label" for="ans${i}">${part.label ? renderText(part.label) : 'Answer:'}</label>` +
        `<input type="text" id="ans${i}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">` +
        (part.suffix ? `<span class="suffix">${esc(part.suffix)}</span>` : '') +
        `</div><div class="preview" aria-live="polite">${HELP[part.type] ? esc(HELP[part.type]) : ''}</div>${keys}</div>`
      );
    })
    .join('');

  root.innerHTML =
    `<div class="q-head"><h2 class="serif">Question</h2>` +
    (opts.headerButton ? `<button type="button" class="btn btn-outline" data-act="header">${esc(opts.headerButton.label)}</button>` : '') +
    `</div>` +
    `<div class="problem">${renderProblemText(problem.prompt)}</div>` +
    `<div class="answer-panel"><div class="a-head"><h3 class="serif">Answer</h3><span class="attempt"></span></div>` +
    `<form class="answer-area" novalidate>${partsHtml}` +
    `<div class="actions"><button type="submit" class="btn btn-primary">Submit Answer</button></div></form>` +
    `<div class="feedback" aria-live="polite"></div></div>`;

  const form = root.querySelector('form');
  const feedback = root.querySelector('.feedback');
  const attemptEl = root.querySelector('.attempt');
  const submitBtn = form.querySelector('button[type="submit"]');
  const partEls = [...root.querySelectorAll('.part')];

  const setAttempt = (text) => {
    attemptEl.textContent = text;
  };
  const MAX = 2;
  const attemptText = () => (attempts < MAX ? `Attempt ${attempts + 1} out of ${MAX}` : 'Extra attempt (no credit)');
  setAttempt(attemptText());

  root.querySelector('[data-act="header"]')?.addEventListener('click', () => opts.headerButton.onClick());

  const inputOf = (i) => partEls[i].querySelector('input[type="text"]');
  const readInputs = () =>
    problem.parts.map((part, i) => {
      if (part.type === 'choice') {
        const picked = partEls[i].querySelector('input:checked');
        return picked ? picked.value : '';
      }
      return inputOf(i).value;
    });

  function updatePreview(i) {
    const part = problem.parts[i];
    if (!['number', 'expr', 'custom'].includes(part.type)) return;
    const box = partEls[i].querySelector('.preview');
    const raw = inputOf(i).value.trim();
    if (!raw) {
      box.textContent = '';
      return;
    }
    try {
      const body = raw.includes('=') ? raw.slice(raw.lastIndexOf('=') + 1) : raw;
      box.innerHTML = `You typed: ${tex(toTex(parse(body, part.vars || ['x'])))}`;
    } catch {
      box.textContent = '';
    }
  }

  function setLocked(locked) {
    form.querySelectorAll('input, .key').forEach((el) => {
      el.disabled = locked;
    });
    submitBtn.disabled = locked;
    if (locked) globalThis.getSelection?.()?.removeAllRanges();
    partEls.forEach((el) => el.classList.toggle('locked', locked));
  }

  function mark(results) {
    partEls.forEach((el, i) => {
      el.classList.remove('right', 'wrong');
      if (results) el.classList.add(results[i].ok ? 'right' : 'wrong');
    });
  }

  function solutionHtml() {
    const rows = problem.parts.map((part) => {
      const label = part.label ? `${renderText(part.label)} ` : '';
      if (part.type === 'choice') return `<div>${label}${renderText(part.choices[part.correct])}</div>`;
      return `<div>${label}${tex(answerTex(part))}${part.suffix ? ` ${esc(part.suffix)}` : ''}</div>`;
    });
    return `<div class="solution"><b>Answer:</b><div class="sol-rows">${rows.join('')}</div></div>`;
  }

  const nextLabel = () => (typeof opts.nextLabel === 'function' ? opts.nextLabel() : opts.nextLabel) || 'Next Problem';
  const nextButton = () => `<button type="button" class="btn btn-primary" data-act="next">${esc(nextLabel())}</button>`;

  function showCorrect(already) {
    setLocked(true);
    setAttempt(already ? 'Solved earlier today' : `Solved in ${attempts} attempt${attempts === 1 ? '' : 's'}`);
    feedback.innerHTML =
      `<div class="alert alert-ok" role="status"><h3>${already ? 'Already solved' : 'Correct!'}</h3>` +
      `<p>${already ? 'You answered this one correctly earlier today.' : attempts <= 1 ? 'Nice work. You got it on the first try.' : 'You got it. Persistence pays off.'}</p>` +
      `<div class="actions">${opts.onNext ? nextButton() : ''}</div></div>`;
    feedback.querySelector('[data-act="next"]')?.focus({ preventScroll: true });
  }

  function showRevealed(earlier) {
    finished = true;
    setLocked(true);
    setAttempt('Answer shown');
    feedback.innerHTML =
      `<div class="alert alert-info" role="status"><h3>Answer shown</h3>${earlier ? '<p>You chose to see the answer for this problem earlier today.</p>' : ''}${solutionHtml()}` +
      `<div class="actions">${opts.onNext ? nextButton() : ''}</div></div>`;
  }

  function showIncorrect(msg) {
    setLocked(true);
    feedback.innerHTML =
      `<div class="alert alert-bad" role="alert"><h3>Incorrect</h3>` +
      (msg ? `<p>${renderText(msg)}</p>` : '') +
      `<div class="hint"><b>Hint:</b> ${renderText(problem.hint)}</div>` +
      `<div class="actions"><button type="button" class="btn btn-primary" data-act="retry">Try Again</button>` +
      (opts.onNext ? `<button type="button" class="btn btn-outline" data-act="next">${esc(nextLabel())}</button>` : '') +
      (wrongCount >= 2 ? `<button type="button" class="btn btn-outline" data-act="reveal">Show Answer</button>` : '') +
      `</div></div>`;
    feedback.querySelector('[data-act="retry"]').focus({ preventScroll: true });
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (finished) return;
    const result = checkProblem(problem, readInputs());
    if (result.status === 'invalid') {
      mark(null);
      feedback.innerHTML = `<div class="alert alert-warn" role="alert">${renderText(result.msg || 'Enter an answer first.')}</div>`;
      return;
    }
    attempts++;
    mark(result.results);
    if (result.status === 'correct') {
      finished = true;
      opts.onResult?.({ correct: true, firstTry: attempts === 1, attempts, revealed: false });
      showCorrect(false);
    } else {
      wrongCount++;
      opts.onResult?.({ correct: false, firstTry: false, attempts, revealed: false });
      showIncorrect(result.msg);
    }
  });

  feedback.addEventListener('click', (ev) => {
    const act = ev.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'next') opts.onNext?.();
    if (act === 'retry') {
      feedback.innerHTML = '';
      setLocked(false);
      setAttempt(attemptText());
      const firstWrong = partEls.findIndex((el) => el.classList.contains('wrong'));
      const target = firstWrong >= 0 ? partEls[firstWrong].querySelector('input') : null;
      target?.focus();
      if (target && target.type === 'text') target.select();
    }
    if (act === 'reveal') {
      opts.onResult?.({ correct: false, firstTry: false, attempts, revealed: true });
      showRevealed(false);
    }
  });

  form.addEventListener('input', (ev) => {
    const el = ev.target.closest('.part');
    if (el && ev.target.type === 'text') updatePreview(Number(el.dataset.i));
  });

  form.addEventListener('change', (ev) => {
    if (ev.target.type !== 'radio') return;
    const el = ev.target.closest('.part');
    el.querySelectorAll('li').forEach((li) => li.classList.toggle('picked', li.contains(ev.target) && ev.target.checked));
    el.classList.remove('right', 'wrong');
  });

  form.addEventListener('click', (ev) => {
    const key = ev.target.closest('.key');
    if (!key) return;
    const input = key.closest('.part').querySelector('input[type="text"]');
    const ins = key.dataset.ins;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + ins + input.value.slice(end);
    // interval templates put the cursor inside the brackets
    const pos = ins.includes(' , ') ? start + 1 : start + ins.length;
    input.focus();
    input.setSelectionRange(pos, pos);
    updatePreview(Number(key.closest('.part').dataset.i));
  });

  if (opts.revealed) showRevealed(true);
  else if (opts.solved) {
    finished = true;
    showCorrect(true);
  } else {
    const first = root.querySelector('.part input[type="text"]');
    if (first && globalThis.matchMedia?.('(min-width: 901px)').matches) first.focus({ preventScroll: true });
  }
}
