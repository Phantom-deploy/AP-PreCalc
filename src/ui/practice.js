// Practice page for one problem type: unlimited generated problems at a chosen difficulty.

import { getLesson, UNITS } from '../data/calendar.js';
import { getType, typesOfLesson, generate, LEVELS } from '../problems/index.js';
import { getSkill, recordAttempt, getPrefs, setPref, GOAL } from '../lib/store.js';
import { randomSeed } from '../lib/rng.js';
import { mountProblem } from './problemView.js';

export function renderPractice(root, params) {
  const type = getType(params.typeId);
  if (!type) {
    root.innerHTML = `<div class="alert alert-warn">That problem type does not exist. <a href="#/">Back to all units</a></div>`;
    return;
  }
  const lesson = getLesson(type.lesson);
  const unit = UNITS.find((u) => u.id === lesson.unit);
  const siblings = typesOfLesson(lesson.id);
  let level = Math.min(2, Math.max(0, Number(getPrefs().level) || 0));
  let lastSeed = null;

  const sideItems = () =>
    siblings
      .map((t) => {
        const s = getSkill(t.id);
        const done = s.correct >= GOAL;
        return `<li><a href="#/practice/${t.id}" class="${t.id === type.id ? 'active' : ''}"${t.id === type.id ? ' aria-current="page"' : ''}>${t.title}<br><span class="mini">${done ? '<span class="check">Complete</span>' : `Score: ${Math.min(s.correct, GOAL)}/${GOAL}`}</span></a></li>`;
      })
      .join('');

  root.innerHTML =
    `<div class="crumbs"><a href="#/">All Units</a> &rsaquo; <a href="#/unit/${unit.id}">Unit ${unit.id}: ${unit.title}</a> &rsaquo; Lesson ${lesson.id}</div>` +
    `<div class="practice">` +
    `<aside class="sidebar"><div class="sidebar-head">${lesson.id} ${lesson.title}</div><ul class="side-list">${sideItems()}</ul>` +
    `<div class="side-foot"><a href="#/unit/${unit.id}">Back to Unit ${unit.id}</a></div></aside>` +
    `<section class="panel"><div class="panel-head"><h2>${type.title}</h2><div class="scorebox" aria-live="polite"></div></div>` +
    `<div class="panel-body"><div class="toolbar"><div><span class="label" id="difflabel">Difficulty:</span>` +
    `<span class="btn-group" role="group" aria-labelledby="difflabel">${LEVELS.map((name, i) => `<button type="button" class="btn btn-sm" data-level="${i}">${name}</button>`).join('')}</span></div>` +
    `<button type="button" class="btn btn-sm" data-act="skip">New Problem</button></div>` +
    `<div class="problem-slot"></div></div></section></div>`;

  const slot = root.querySelector('.problem-slot');
  const scorebox = root.querySelector('.scorebox');
  const sideList = root.querySelector('.side-list');

  function refreshScore() {
    const s = getSkill(type.id);
    scorebox.innerHTML = `Score: <b>${Math.min(s.correct, GOAL)}/${GOAL}</b>${s.correct >= GOAL ? ' <span class="check">Complete</span>' : ''} &nbsp; Streak: <b>${s.streak}</b>`;
    sideList.innerHTML = sideItems();
  }

  function refreshLevelButtons() {
    root.querySelectorAll('[data-level]').forEach((b) => {
      const on = Number(b.dataset.level) === level;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on);
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
      // extremely unlikely, but never leave the student with a blank page
      console.error(err);
      problem = generate(type.id, level, (seed + 7) >>> 0);
    }
    let counted = false;
    mountProblem(slot, {
      problem,
      onNext: newProblem,
      onResult(result) {
        // each generated problem affects the score once: when solved, or on the first miss
        if (result.correct) {
          if (!counted) recordAttempt(type.id, true, result.firstTry);
          else recordSolvedAfterMiss();
          counted = true;
        } else if (!counted) {
          recordAttempt(type.id, false, false);
          counted = true;
        }
        refreshScore();
      },
    });
  }

  // A problem that was missed first and then solved on a retry still earns credit toward the goal.
  function recordSolvedAfterMiss() {
    recordAttempt(type.id, true, false);
  }

  root.querySelector('.btn-group').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-level]');
    if (!btn) return;
    level = Number(btn.dataset.level);
    setPref('level', level);
    refreshLevelButtons();
    newProblem();
  });
  root.querySelector('[data-act="skip"]').addEventListener('click', newProblem);

  refreshLevelButtons();
  refreshScore();
  newProblem();
}
