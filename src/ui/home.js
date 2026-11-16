// Home page: course header, DeltaMath-style tabs, today's card, and expandable unit cards.

import { UNITS, COURSE, lessonsOfUnit, formatDate, isInstructional, addDays } from '../data/calendar.js';
import { typesOfLesson, TYPES } from '../problems/index.js';
import { getSkill, skillProgress, isUnitOpen, setUnitOpen, getDaily, dailyStreak, GOAL } from '../lib/store.js';
import { todayISO } from '../lib/clock.js';
import { describeDay } from '../lib/daily.js';
import { homeSidebar, wireSidebar, ring, esc } from './shell.js';

const CHEVRON = '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const PARTY = '<svg width="58" height="58" viewBox="0 0 64 64" fill="none" stroke="#4353f0" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 52 L24 24 L40 40 Z"/><path d="M34 22c2-4 6-6 10-5M42 30c4-1 8 1 10 4"/><path d="M30 10v4M50 12l-3 3M54 24h-4"/><circle cx="40" cy="12" r="1.5" fill="#4353f0"/><circle cx="56" cy="40" r="1.5" fill="#4353f0"/></svg>';

function skillRow(t, showLesson) {
  const s = getSkill(t.id);
  const done = s.correct >= GOAL;
  return (
    `<a class="skill-row" href="#/practice/${t.id}">${ring(skillProgress(t.id), done, done ? 'Complete' : `${Math.min(s.correct, GOAL)} of ${GOAL} correct`)}` +
    `<span class="skill-name">${esc(t.title)}${showLesson ? `<span class="skill-sub">Lesson ${t.lesson}</span>` : ''}</span>` +
    `<span class="skill-score">${done ? 'Complete' : `${Math.min(s.correct, GOAL)}/${GOAL}`}</span></a>`
  );
}

function unitCard(unit, today) {
  const lessons = lessonsOfUnit(unit.id);
  const types = lessons.flatMap((l) => typesOfLesson(l.id));
  const p = types.reduce((a, t) => a + skillProgress(t.id), 0) / types.length;
  const done = types.every((t) => getSkill(t.id).correct >= GOAL);
  const open = isUnitOpen(unit.id);
  const range = `${formatDate(lessons[0].date, { short: true })} to ${formatDate(lessons[lessons.length - 1].date, { short: true })}`;
  const body = open
    ? lessons
        .map(
          (l) =>
            `<div class="lesson" id="lesson-${l.id}"><div class="lesson-head"><span class="lesson-title">${l.id} ${esc(l.title)}${l.date === today ? ' <span class="pill accent">Today</span>' : ''}</span>` +
            `<span class="lesson-date">${formatDate(l.date, { weekdayShort: true })}${l.textbook ? ` &middot; Textbook ${l.textbook}` : ''}</span></div>` +
            typesOfLesson(l.id).map((t) => skillRow(t, false)).join('') +
            `</div>`,
        )
        .join('')
    : '';
  return (
    `<section class="card unit${open ? ' open' : ''}" id="unit-${unit.id}" data-unit="${unit.id}">` +
    `<button type="button" class="unit-head" aria-expanded="${open}" aria-controls="unit-body-${unit.id}">` +
    `${ring(p, done, `Unit ${unit.id} ${Math.round(p * 100)} percent complete`)}` +
    `<span class="unit-title"><span class="serif unit-name">Unit ${unit.id}: ${esc(unit.title)}</span>` +
    `<span class="unit-meta">${range} &middot; ${lessons.length} lessons &middot; ${types.length} skills &middot; ${Math.round(p * 100)}% complete</span></span>${CHEVRON}</button>` +
    `<div class="unit-body" id="unit-body-${unit.id}"${open ? '' : ' hidden'}>${body}</div></section>`
  );
}

function emptyCard(title, text, href, button) {
  return `<div class="card empty">${PARTY}<p class="serif empty-title">${title}</p><p>${text}</p><a class="btn btn-primary" href="${href}">${button}</a></div>`;
}

export function renderHome({ side, view }, params = {}) {
  const today = todayISO();
  const tab = params.tab || 'units';
  if (params.unit) setUnitOpen(Number(params.unit), true);
  const daily = getDaily(today);
  const solved = daily.solved.filter(Boolean).length;
  const streak = dailyStreak(isInstructional, today, addDays);
  const inProgress = TYPES.filter((t) => {
    const c = getSkill(t.id).correct;
    return c > 0 && c < GOAL;
  });
  const complete = TYPES.filter((t) => getSkill(t.id).correct >= GOAL);

  side.innerHTML = homeSidebar(params.unit ? `unit-${params.unit}` : 'units');
  wireSidebar(side, () => renderHome({ side, view }, params));

  const tabLink = (key, label, count, href) =>
    `<a class="tab${tab === key ? ' on' : ''}" href="${href}"${tab === key ? ' aria-current="page"' : ''}>${label}${count == null ? '' : ` <span class="pill">${count}</span>`}</a>`;

  let content;
  if (tab === 'progress') {
    content = inProgress.length
      ? `<div class="card list-card">${inProgress.map((t) => skillRow(t, true)).join('')}</div>`
      : emptyCard('Nothing in progress yet.', 'Skills you have started but not finished will show up here.', '#/daily', 'Start Daily Problems');
  } else if (tab === 'complete') {
    content = complete.length
      ? `<div class="card list-card">${complete.map((t) => skillRow(t, true)).join('')}</div>`
      : emptyCard('No completed skills yet.', `A skill is complete after ${GOAL} correct answers. Pick any skill to start.`, '#/unit/1', 'Start Practicing');
  } else {
    const finishedCount = daily.solved.filter((v, j) => v || (daily.revealed || [])[j]).length;
    const allDone = finishedCount === 3;
    content =
      `<div class="card today-card">${PARTY}` +
      `<p class="today-when">Today, ${formatDate(today)}</p>` +
      `<p class="serif today-what">${esc(describeDay(today))}</p>` +
      `<p>${allDone ? `Daily problems finished: ${solved} of 3 solved${streak > 1 ? ` &middot; ${streak} day streak` : ''}. Keep practicing any skill below.` : `Your 3 daily problems are ready: ${solved} of 3 solved${streak > 1 ? ` &middot; ${streak} day streak` : ''}.`}</p>` +
      `<a class="btn btn-primary" href="#/daily">${allDone ? 'Review Daily Problems' : finishedCount ? 'Continue Daily Problems' : 'Start Daily Problems'}</a></div>` +
      UNITS.map((u) => unitCard(u, today)).join('');
  }

  view.innerHTML =
    `<div class="page-head"><p class="eyebrow">${COURSE.term}</p><h1 class="serif page-title">${COURSE.name}</h1>` +
    `<nav class="tabs" aria-label="Sections">${tabLink('units', 'Units', null, '#/')}${tabLink('progress', 'In Progress', inProgress.length, '#/tab/progress')}${tabLink('complete', 'Complete', complete.length, '#/tab/complete')}</nav></div>` +
    `<div class="page-body">${content}</div>`;

  view.querySelectorAll('.unit-head').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('.unit').dataset.unit);
      setUnitOpen(id, !isUnitOpen(id));
      const y = window.scrollY;
      renderHome({ side, view }, { ...params, unit: undefined, lesson: undefined });
      window.scrollTo(0, y);
      view.querySelector(`.unit[data-unit="${id}"] .unit-head`)?.focus({ preventScroll: true });
    });
  });

  const target = params.lesson ? document.getElementById(`lesson-${params.lesson}`) : params.unit ? document.getElementById(`unit-${params.unit}`) : null;
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
