// Practice page for one skill: unlimited generated problems at a chosen difficulty.

import { getLesson, UNITS, formatDate } from '../data/calendar.js';
import { getType, typesOfLesson, generate, LEVELS } from '../problems/index.js';
import { getSkill, skillProgress, recordAttempt, getPrefs, setPref, GOAL } from '../lib/store.js';
import { randomSeed } from '../lib/rng.js';
import { mountProblem } from './problemView.js';
import { activitySidebar, wireSidebar, ring, segbar, esc } from './shell.js';

export function renderPractice({ side, view }, params) {
  const type = getType(params.typeId);
  if (!type) {
    side.innerHTML = '';
    view.innerHTML = `<div class="page-body"><div class="alert alert-warn">That skill does not exist. <a href="#/">Back to Home</a></div></div>`;
    return;
  }
  const lesson = getLesson(type.lesson);
  const unit = UNITS.find((u) => u.id === lesson.unit);
  const siblings = typesOfLesson(lesson.id);
  let level = Math.min(2, Math.max(0, Number(getPrefs().level) || 0));
  let lastSeed = null;

  function drawSide() {
    const p = siblings.reduce((a, t) => a + skillProgress(t.id), 0) / siblings.length;
    side.innerHTML = activitySidebar({
      title: `${lesson.id} ${lesson.title}`,
      sub: `Unit ${unit.id} &middot; Taught ${formatDate(lesson.date, { weekdayShort: true })}`,
      progressLabel: `Lesson progress: <b>${Math.round(p * 100)}%</b>`,
      progress: p,
      items: siblings.map((t) => {
        const s = getSkill(t.id);
        return { href: `#/practice/${t.id}`, active: t.id === type.id, icon: ring(skillProgress(t.id), s.correct >= GOAL), html: esc(t.title) };
      }),
    });
    wireSidebar(side, () => renderPractice({ side, view }, params));
  }

  view.innerHTML =
    `<div class="page-body narrow-top"><p class="crumbs"><a href="#/unit/${unit.id}">Unit ${unit.id}: ${esc(unit.title)}</a> &rsaquo; Lesson ${lesson.id}</p>` +
    `<h1 class="serif page-title">${esc(type.title)}</h1>` +
    `<div class="card score-card"><div class="score-line"><span><b>Score:</b> <span data-score></span></span><span><b>Streak:</b> <span data-streak></span></span>` +
    `<span class="diff"><span class="diff-label" id="difflabel">Difficulty:</span><span class="seg" role="group" aria-labelledby="difflabel">${LEVELS.map((n, i) => `<button type="button" data-level="${i}">${n}</button>`).join('')}</span></span></div>` +
    `<div data-segbar></div></div>` +
    `<div class="card q-card"></div></div>`;

  const slot = view.querySelector('.q-card');

  function refreshScore() {
    const s = getSkill(type.id);
    view.querySelector('[data-score]').textContent = `${Math.min(s.correct, GOAL)}/${GOAL}${s.correct >= GOAL ? ' (complete)' : ''}`;
    view.querySelector('[data-streak]').textContent = String(s.streak);
    view.querySelector('[data-segbar]').innerHTML = segbar(Math.min(s.correct, GOAL), GOAL, 'Score');
    drawSide();
  }

  function refreshLevels() {
    view.querySelectorAll('[data-level]').forEach((b) => {
      const on = Number(b.dataset.level) === level;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function newProblem() {
    let seed = randomSeed();
    if (seed === lastSeed) seed = (seed + 1) >>> 0;
    lastSeed = seed;
    let problem;
    try {
      problem = generate(type.id, level, seed);
    } catch (err) {
      console.error(err);
      problem = generate(type.id, level, (seed + 7) >>> 0);
    }
    let counted = false;
    mountProblem(slot, {
      problem,
      onNext: newProblem,
      headerButton: { label: 'New Problem', onClick: newProblem },
      onResult(r) {
        if (r.revealed) return;
        if (r.correct && r.attempts <= 2) recordAttempt(type.id, true, r.firstTry && !counted);
        else if (!counted) recordAttempt(type.id, false, false);
        counted = true;
        refreshScore();
      },
    });
  }

  view.querySelector('.seg').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-level]');
    if (!b) return;
    level = Number(b.dataset.level);
    setPref('level', level);
    refreshLevels();
    newProblem();
  });

  refreshLevels();
  refreshScore();
  newProblem();
}
