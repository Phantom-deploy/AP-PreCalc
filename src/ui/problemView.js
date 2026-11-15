// Renders one problem with its answer inputs, checks answers, and shows feedback.
// Used by both the practice page and the daily problems page.

import { renderProblemText, renderText, tex } from '../lib/render.js';
import { checkProblem, answerTex } from '../lib/check.js';
import { parse, toTex } from '../lib/expr.js';

const KEYS = {
  math: [['x²', '^2'], ['xⁿ', '^'], ['√', 'sqrt('], ['|x|', 'abs('], ['π', 'pi'], ['e', 'e'], ['ln', 'ln('], ['log', 'log('], ['logₙ', 'log_']],
  interval: [['∞', 'inf'], ['-∞', '-inf'], ['∪', ' U '], ['[', '['], [']', ']'], ['(', '('], [')', ')']],
};

const HELP = {
  interval: 'Type inf for infinity and U for union.',
  set: 'Separate values with commas. Type none if there are no values.',
  point: 'Enter an ordered pair such as (2, -5).',
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/*
  opts:
    problem      the generated problem
    solved       true when this problem was already answered correctly (daily page)
    nextLabel    label for the button that moves on
    onNext()     called when the student moves on
    onResult({ correct, firstTry, attempts, revealed })  called once when the problem is finished
                 (answered correctly, or the answer was revealed) and on each incorrect submission
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
      const keyKind = part.type === 'interval' ? 'interval' : part.type === 'number' || part.type === 'expr' || part.type === 'custom' ? 'math' : null;
      const keys = keyKind ? `<div class="keys" aria-label="Symbol shortcuts">${KEYS[keyKind].map(([lab, ins]) => `<button type="button" class="key" data-ins="${escapeHtml(ins)}" tabindex="-1">${lab}</button>`).join('')}</div>` : '';
      const labelText = part.label ? renderText(part.label) : 'Answer:';
      return (
        `<div class="part" data-i="${i}"><div class="part-row">` +
        `<label class="part-label" for="ans${i}">${labelText}</label>` +
        `<input type="text" id="ans${i}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="text">` +
        (part.suffix ? `<span class="suffix">${escapeHtml(part.suffix)}</span>` : '') +
        `</div>` +
        `<div class="preview" aria-live="polite">${HELP[part.type] ? escapeHtml(HELP[part.type]) : ''}</div>${keys}</div>`
      );
    })
    .join('');

  root.innerHTML =
    `<div class="problem">${renderProblemText(problem.prompt)}</div>` +
    `<form class="answer-area" novalidate>${partsHtml}` +
    `<div class="actions"><button type="submit" class="btn btn-primary btn-lg">Submit Answer</button></div></form>` +
    `<div class="feedback" aria-live="polite"></div>`;

  const form = root.querySelector('form');
  const feedback = root.querySelector('.feedback');
  const submitBtn = form.querySelector('button[type="submit"]');
  const partEls = [...root.querySelectorAll('.part')];

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
    const box = partEls[i].querySelector('.preview');
    const raw = inputOf(i).value.trim();
    if (!['number', 'expr', 'custom'].includes(part.type)) return;
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
      return `<div>${label}${tex(answerTex(part))}${part.suffix ? ` ${escapeHtml(part.suffix)}` : ''}</div>`;
    });
    return `<div class="solution"><b>Answer:</b> ${rows.join('')}</div>`;
  }

  const nextButton = () => `<button type="button" class="btn btn-success" data-act="next">${escapeHtml((typeof opts.nextLabel === 'function' ? opts.nextLabel() : opts.nextLabel) || 'Next Problem')}</button>`;

  function showCorrect(already) {
    setLocked(true);
    feedback.innerHTML =
      `<div class="alert alert-ok" role="status"><h3>${already ? 'Already solved' : 'Correct!'}</h3>` +
      `<p>${already ? 'You answered this one correctly earlier today.' : attempts <= 1 ? 'Nice work. You got it on the first try.' : 'You got it. Persistence pays off.'}</p>` +
      `<div class="actions">${opts.onNext ? nextButton() : ''}</div></div>`;
    feedback.querySelector('[data-act="next"]')?.focus();
  }

  function showIncorrect(msg) {
    setLocked(true);
    feedback.innerHTML =
      `<div class="alert alert-bad" role="alert"><h3>Incorrect</h3>` +
      (msg ? `<p>${renderText(msg)}</p>` : '') +
      `<div class="hint"><b>Hint:</b> ${renderText(problem.hint)}</div>` +
      `<div class="actions"><button type="button" class="btn btn-primary" data-act="retry">Try Again</button>` +
      `${opts.onNext ? nextButton() : ''}` +
      (wrongCount >= 2 ? `<button type="button" class="btn" data-act="reveal">Show Answer</button>` : '') +
      `</div></div>`;
    feedback.querySelector('[data-act="retry"]').focus();
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
      opts.onResult?.({ correct: false, firstTry: false, attempts, revealed: false, final: false });
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
      const firstWrong = partEls.findIndex((el) => el.classList.contains('wrong'));
      const target = firstWrong >= 0 ? partEls[firstWrong].querySelector('input') : null;
      target?.focus();
      if (target && target.type === 'text') target.select();
    }
    if (act === 'reveal') {
      finished = true;
      opts.onResult?.({ correct: false, firstTry: false, attempts, revealed: true, final: true });
      feedback.innerHTML =
        `<div class="alert alert-info" role="status"><h3>Answer shown</h3>${solutionHtml()}` +
        `<div class="actions">${opts.onNext ? nextButton() : ''}</div></div>`;
    }
  });

  form.addEventListener('input', (ev) => {
    const el = ev.target.closest('.part');
    if (!el) return;
    const i = Number(el.dataset.i);
    if (ev.target.type === 'text') updatePreview(i);
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
    const pos = start + ins.length;
    input.focus();
    input.setSelectionRange(pos, pos);
    updatePreview(Number(key.closest('.part').dataset.i));
  });

  if (opts.revealed) {
    finished = true;
    setLocked(true);
    feedback.innerHTML =
      `<div class="alert alert-info" role="status"><h3>Answer shown</h3><p>You chose to see the answer for this problem earlier today.</p>${solutionHtml()}` +
      `<div class="actions">${opts.onNext ? nextButton() : ''}</div></div>`;
  } else if (opts.solved) {
    finished = true;
    showCorrect(true);
  } else if (!opts.noFocus) {
    const first = root.querySelector('.part input[type="text"]');
    // avoid popping up the keyboard on phones
    if (first && globalThis.matchMedia?.('(min-width: 761px)').matches) first.focus({ preventScroll: true });
  }
}
