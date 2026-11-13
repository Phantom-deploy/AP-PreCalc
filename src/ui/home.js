// Home page: today's summary and the expandable list of units, lessons, and problem types.

import { UNITS, lessonsOfUnit, formatDate, COURSE, isInstructional, addDays } from '../data/calendar.js';
import { typesOfLesson } from '../problems/index.js';
import { getSkill, skillProgress, isUnitOpen, setUnitOpen, getDaily, dailyStreak, GOAL } from '../lib/store.js';
import { todayISO } from '../lib/clock.js';
import { describeDay } from '../lib/daily.js';

function meter(fraction, label) {
  const pct = Math.round(fraction * 100);
  return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${label}"><span style="width:${pct}%"></span></div>`;
}

function unitProgress(unitId) {
  const types = lessonsOfUnit(unitId).flatMap((l) => typesOfLesson(l.id));
  return types.reduce((acc, t) => acc + skillProgress(t.id), 0) / types.length;
}

function lessonHtml(lesson, today) {
  const types = typesOfLesson(lesson.id);
  const tag = lesson.date === today ? ' <span class="tag">Today</span>' : '';
  const rows = types
    .map((t) => {
      const s = getSkill(t.id);
      const done = s.correct >= GOAL;
      return (
        `<li class="skill-row"><span class="name"><a href="#/practice/${t.id}">${t.title}</a></span>` +
        `<span class="score">${meter(skillProgress(t.id), `Progress on ${t.title}`)}` +
        `<span class="progress-label"><span>${done ? '<span class="check">Complete</span>' : `Score: ${Math.min(s.correct, GOAL)}/${GOAL}`}</span><span>${s.correct > GOAL ? `${s.correct} correct` : ''}</span></span></span>` +
        `<a class="btn btn-sm btn-primary" href="#/practice/${t.id}">Practice</a></li>`
      );
    })
    .join('');
  return (
    `<div class="lesson" id="lesson-${lesson.id}"><div class="lesson-head"><h3>${lesson.id} ${lesson.title}${tag}</h3>` +
    `<span class="when">${formatDate(lesson.date, { weekdayShort: true })}${lesson.textbook ? ` &middot; Textbook ${lesson.textbook}` : ''}</span></div>` +
    `<ul class="skill-list">${rows}</ul></div>`
  );
}

function unitHtml(unit, today) {
  const lessons = lessonsOfUnit(unit.id);
  const open = isUnitOpen(unit.id);
  const p = unitProgress(unit.id);
  const count = lessons.reduce((acc, l) => acc + typesOfLesson(l.id).length, 0);
  const range = `${formatDate(lessons[0].date, { short: true })} to ${formatDate(lessons[lessons.length - 1].date, { short: true })}`;
  return (
    `<section class="unit${open ? ' open' : ''}" data-unit="${unit.id}">` +
    `<button type="button" class="unit-head" aria-expanded="${open}" aria-controls="unit-body-${unit.id}">` +
    `<span class="caret" aria-hidden="true"></span>` +
    `<span class="unit-title"><span class="name">Unit ${unit.id}: ${unit.title}</span>` +
    `<span class="dates">${range} &middot; ${lessons.length} lessons &middot; ${count} problem types</span></span>` +
    `<span class="unit-meter">${meter(p, `Unit ${unit.id} progress`)}<span>${Math.round(p * 100)}% complete</span></span></button>` +
    `<div class="unit-body" id="unit-body-${unit.id}"${open ? '' : ' hidden'}>${open ? lessons.map((l) => lessonHtml(l, today)).join('') : ''}</div></section>`
  );
}

export function renderHome(root, params = {}) {
  const today = todayISO();
  const daily = getDaily(today);
  const solved = daily.solved.filter(Boolean).length;
  const streak = dailyStreak(isInstructional, today, addDays);
  if (params.unit) setUnitOpen(Number(params.unit), true);
  root.innerHTML =
    `<div class="page-head"><h1>${COURSE.name}</h1><p class="sub">${COURSE.term} &middot; Unlimited practice for every lesson</p></div>` +
    `<div class="today-box"><div><div class="label">Today, ${formatDate(today)}</div><div class="what">${describeDay(today)}</div>` +
    `<div class="daily-status">Daily problems: ${solved} of 3 solved${streak > 1 ? ` &middot; ${streak} day streak` : ''}</div></div>` +
    `<a class="btn btn-daily btn-lg" href="#/daily">${solved === 3 ? 'Review Daily Problems' : solved > 0 ? 'Continue Daily Problems' : 'Start Daily Problems'}</a></div>` +
    `<h2>Units</h2>` +
    UNITS.map((u) => unitHtml(u, today)).join('');

  root.querySelectorAll('.unit-head').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.unit');
      const id = Number(section.dataset.unit);
      setUnitOpen(id, !section.classList.contains('open'));
      const y = window.scrollY;
      renderHome(root);
      window.scrollTo(0, y);
      root.querySelector(`.unit[data-unit="${id}"] .unit-head`)?.focus({ preventScroll: true });
    });
  });

  if (params.lesson) {
    document.getElementById(`lesson-${params.lesson}`)?.scrollIntoView({ block: 'start' });
  }
}
