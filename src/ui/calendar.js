// Course calendar page with links from each lesson to its skills.

import { COURSE, dayInfo, getLesson, addDays, fromISO, formatDate } from '../data/calendar.js';
import { todayISO } from '../lib/clock.js';
import { homeSidebar, wireSidebar } from './shell.js';

function cell(iso, today) {
  const info = dayInfo(iso);
  const cls = [];
  let body;
  if (info.kind === 'off') {
    cls.push('off');
    body = info.off;
  } else if (info.lesson) {
    const l = getLesson(info.lesson);
    body = `<a href="#/lesson/${l.id}"><b>Lesson ${l.id}</b><br>${l.title}</a>`;
  } else {
    cls.push(info.kind === 'assessment' ? 'assess' : 'review');
    body = info.label;
  }
  if (iso === today) cls.push('today');
  const ev = (info.events || []).map((e) => `<span class="ev">${e}</span>`).join('');
  return `<td class="${cls.join(' ')}"${iso === today ? ' aria-current="date"' : ''}><span class="d">${formatDate(iso, { short: true })}</span>${ev}${body}</td>`;
}

export function renderCalendar({ side, view }) {
  const today = todayISO();
  side.innerHTML = homeSidebar('calendar');
  wireSidebar(side, () => renderCalendar({ side, view }));
  let rows = '';
  let monday = COURSE.start;
  while (fromISO(monday).getDay() !== 1) monday = addDays(monday, -1);
  for (; monday <= COURSE.end; monday = addDays(monday, 7)) rows += `<tr>${[0, 1, 2, 3, 4].map((k) => cell(addDays(monday, k), today)).join('')}</tr>`;
  view.innerHTML =
    `<div class="page-head"><p class="eyebrow">${COURSE.name} &middot; ${COURSE.term}</p><h1 class="serif page-title">Course Calendar</h1>` +
    `<p class="head-note">Subject to change, so check your class calendar too. Select a lesson to practice it.</p></div>` +
    `<div class="page-body"><div class="card cal-card"><div class="cal-wrap"><table class="cal"><thead><tr><th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th></tr></thead><tbody>${rows}</tbody></table></div></div>` +
    `<p class="legend"><span class="key-box off"></span> No school <span class="key-box assess"></span> Test or assessment <span class="key-box review"></span> Review <span class="key-box today"></span> Today</p></div>`;
}
