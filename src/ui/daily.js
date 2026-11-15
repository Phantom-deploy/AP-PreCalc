// Daily problems: exactly three problems chosen from the course calendar.

import { formatDate } from '../data/calendar.js';
import { generate, getType, LEVELS } from '../problems/index.js';
import { dailyPlan, describeDay } from '../lib/daily.js';
import { getDaily, setDaily, recordAttempt } from '../lib/store.js';
import { todayISO } from '../lib/clock.js';
import { mountProblem } from './problemView.js';
import { activitySidebar, wireSidebar, ring, segbar, esc } from './shell.js';

export function renderDaily({ side, view }, params = {}) {
  const date = todayISO();
  const plan = dailyPlan(date);
  const record = () => {
    const r = getDaily(date);
    return { solved: r.solved.slice(), tries: r.tries.slice(), revealed: (r.revealed || [false, false, false]).slice() };
  };
  const done = (r, j) => r.solved[j] || r.revealed[j];
  let active = params.n ? Math.min(2, Math.max(0, Number(params.n) - 1)) : Math.max(0, record().solved.findIndex((s) => !s));

  function drawSide() {
    const r = record();
    const n = r.solved.filter(Boolean).length;
    side.innerHTML = activitySidebar({
      title: 'Daily Problems',
      sub: `${formatDate(date)}<br>${esc(describeDay(date))}`,
      progressLabel: `Solved: <b>${n} of 3</b>`,
      progress: n / 3,
      items: plan.slots.map((s, i) => ({
        href: `#/daily/${i + 1}`,
        active: i === active,
        icon: ring(r.revealed[i] && !r.solved[i] ? 1 : 0, r.solved[i], r.solved[i] ? 'Solved' : r.revealed[i] ? 'Answer shown' : 'Not solved'),
        html: `Problem ${i + 1}: ${esc(s.heading)}${r.revealed[i] && !r.solved[i] ? ' <span class="muted">(answer shown)</span>' : ''}`,
      })),
    });
    wireSidebar(side, () => renderDaily({ side, view }, params));
  }

  function show(i) {
    active = i;
    const s = plan.slots[i];
    const type = getType(s.typeId);
    const r = record();
    const n = r.solved.filter(Boolean).length;
    const finished = [0, 1, 2].every((j) => done(r, j));
    drawSide();
    view.innerHTML =
      `<div class="page-body narrow-top"><p class="crumbs">Daily Problems &rsaquo; ${formatDate(date)}</p>` +
      `<h1 class="serif page-title">Daily Problem ${i + 1}</h1>` +
      (n === 3
        ? `<div class="alert alert-ok banner"><h3>All 3 daily problems solved</h3><p>Come back tomorrow for a new set, or keep going with <a href="#/">unlimited practice</a>.</p></div>`
        : finished
          ? `<div class="alert alert-info banner"><h3>Daily problems finished</h3><p>You solved ${n} of 3 today. Practice the skills you missed from the <a href="#/">home page</a>, and come back tomorrow for a new set.</p></div>`
          : '') +
      `<div class="card score-card"><div class="score-line"><span><b>Solved today:</b> ${n}/3</span><span><b>Source:</b> ${esc(s.heading)}</span><span><b>Level:</b> ${LEVELS[s.level]}</span></div>${segbar(n, 3, 'Daily problems solved')}` +
      `<p class="source">${esc(s.detail)} &middot; Skill: <a href="#/practice/${type.id}">${esc(type.title)}</a></p>${s.hook ? `<p class="hook">${esc(s.hook)}</p>` : ''}</div>` +
      `<div class="card q-card"></div></div>`;

    const nextOpen = () => {
      const rr = record();
      for (let k = 1; k <= 3; k++) if (!done(rr, (i + k) % 3)) return (i + k) % 3;
      return -1;
    };
    mountProblem(view.querySelector('.q-card'), {
      problem: generate(s.typeId, s.level, s.seed),
      solved: r.solved[i],
      revealed: !r.solved[i] && r.revealed[i],
      nextLabel: () => {
        const t = nextOpen();
        return t === -1 || t === i ? 'Back to Home' : `Go to Problem ${t + 1}`;
      },
      onNext() {
        const t = nextOpen();
        location.hash = t === -1 || t === i ? '#/' : `#/daily/${t + 1}`;
      },
      onResult(res) {
        const rr = record();
        const firstTry = res.firstTry && rr.tries[i] === 0;
        if (res.revealed) rr.revealed[i] = true;
        else {
          rr.tries[i] += 1;
          if (res.correct) {
            rr.solved[i] = true;
            recordAttempt(s.typeId, true, firstTry);
          }
        }
        setDaily(date, rr);
        drawSide();
        const nn = rr.solved.filter(Boolean).length;
        const segEl = view.querySelector('.score-card .segbar');
        if (segEl) segEl.outerHTML = segbar(nn, 3, 'Daily problems solved');
        const first = view.querySelector('.score-line span');
        if (first) first.innerHTML = `<b>Solved today:</b> ${nn}/3`;
      },
    });
  }

  show(active);
}
