// Daily problems page: exactly three problems chosen from the course calendar.

import { formatDate } from '../data/calendar.js';
import { generate, getType, LEVELS } from '../problems/index.js';
import { dailyPlan, describeDay } from '../lib/daily.js';
import { getDaily, setDaily, recordAttempt } from '../lib/store.js';
import { todayISO } from '../lib/clock.js';
import { mountProblem } from './problemView.js';

export function renderDaily(root, params = {}) {
  const date = todayISO();
  const plan = dailyPlan(date);
  let active = Math.min(2, Math.max(0, Number(params.n || 1) - 1));
  const record = () => getDaily(date);
  if (!params.n) {
    const firstOpen = record().solved.findIndex((s) => !s);
    active = firstOpen === -1 ? 0 : firstOpen;
  }

  root.innerHTML =
    `<div class="page-head"><h1>Daily Problems</h1><p class="sub">${formatDate(date)} &middot; ${describeDay(date)}</p></div>` +
    `<div class="daily-summary"></div>` +
    `<div class="daily-tabs" role="tablist" aria-label="Daily problems"></div>` +
    `<div class="daily-panel" role="tabpanel"><div class="daily-source"></div><div class="problem-slot"></div></div>`;

  const tabs = root.querySelector('.daily-tabs');
  const source = root.querySelector('.daily-source');
  const slotEl = root.querySelector('.problem-slot');
  const summary = root.querySelector('.daily-summary');

  function drawTabs() {
    const rec = record();
    tabs.innerHTML = plan.slots
      .map((s, i) => `<button type="button" role="tab" class="daily-tab${i === active ? ' active' : ''}" aria-selected="${i === active}" data-i="${i}">Problem ${i + 1}${rec.solved[i] ? '<span class="mark check" aria-label="solved">&#10003;</span>' : ''}</button>`)
      .join('');
    const n = rec.solved.filter(Boolean).length;
    summary.innerHTML =
      n === 3
        ? `<div class="alert alert-ok" style="margin:0 0 16px"><h3>All 3 daily problems solved</h3><p>Come back tomorrow for a new set, or keep going with <a href="#/">unlimited practice</a>.</p></div>`
        : '';
  }

  function show(i) {
    active = i;
    const s = plan.slots[i];
    const type = getType(s.typeId);
    const rec = record();
    drawTabs();
    source.innerHTML =
      `<div class="kind">${s.heading}</div><div class="detail">${s.detail} &middot; ${LEVELS[s.level]} &middot; <a href="#/practice/${type.id}">${type.title}</a></div>` +
      (s.hook ? `<div class="hook">${s.hook}</div>` : '');
    const problem = generate(s.typeId, s.level, s.seed);
    const nextOpen = () => {
      const r = record();
      const done = (j) => r.solved[j] || (r.revealed || [])[j];
      for (let k = 1; k <= 3; k++) if (!done((i + k) % 3)) return (i + k) % 3;
      return -1;
    };
    const label = () => {
      const target = nextOpen();
      return target === -1 || target === i ? 'Back to Home' : `Go to Problem ${target + 1}`;
    };
    mountProblem(slotEl, {
      problem,
      solved: rec.solved[i],
      revealed: !rec.solved[i] && (rec.revealed || [])[i],
      nextLabel: label,
      onNext() {
        const target = nextOpen();
        if (target === -1 || target === i) location.hash = '#/';
        else show(target);
      },
      onResult(result) {
        const r = record();
        const updated = { solved: r.solved.slice(), tries: r.tries.slice(), revealed: (r.revealed || [false, false, false]).slice() };
        const firstTry = result.firstTry && r.tries[i] === 0;
        if (result.revealed) {
          updated.revealed[i] = true;
        } else {
          updated.tries[i] += 1;
          if (result.correct) {
            updated.solved[i] = true;
            recordAttempt(s.typeId, true, firstTry);
          }
        }
        setDaily(date, updated);
        drawTabs();
      },
    });
  }

  tabs.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-i]');
    if (btn) show(Number(btn.dataset.i));
  });

  show(active);
}
