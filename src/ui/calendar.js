// Calendar page: the course calendar, with links from each lesson to its practice problems.

import { COURSE, dayInfo, getLesson, addDays, fromISO, formatDate } from '../data/calendar.js';
import { todayISO } from '../lib/clock.js';

function cell(iso, today) {
  const info = dayInfo(iso);
  const classes = [];
  let body = '';
  if (info.kind === 'off') {
    classes.push('off');
    body = info.off;
  } else if (info.lesson) {
    const lesson = getLesson(info.lesson);
    body = `<a href="#/lesson/${lesson.id}"><b>Lesson ${lesson.id}</b><br>${lesson.title}</a>`;
  } else {
    classes.push(info.kind === 'assessment' ? 'assess' : info.kind === 'review' ? 'review' : 'other');
    body = info.label;
  }
  if (iso === today) classes.push('today');
  const events = (info.events || []).map((e) => `<span class="ev">${e}</span>`).join('');
  return `<td class="${classes.join(' ')}"${iso === today ? ' aria-current="date"' : ''}><span class="d">${formatDate(iso, { short: true })}</span>${events}${body}</td>`;
}

export function renderCalendar(root) {
  const today = todayISO();
  let rows = '';
  // start from the Monday of the first week
  let monday = COURSE.start;
  while (fromISO(monday).getDay() !== 1) monday = addDays(monday, -1);
  for (; monday <= COURSE.end; monday = addDays(monday, 7)) {
    rows += `<tr>${[0, 1, 2, 3, 4].map((k) => cell(addDays(monday, k), today)).join('')}</tr>`;
  }
  root.innerHTML =
    `<div class="page-head"><h1>Course Calendar</h1><p class="sub">${COURSE.name} &middot; ${COURSE.term} &middot; Subject to change, so check your class calendar too.</p></div>` +
    `<div class="cal-wrap"><table class="cal"><thead><tr><th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th></tr></thead><tbody>${rows}</tbody></table></div>` +
    `<p class="legend">Select a lesson to practice it. Daily problems skip weekends, holidays, and other days without a lesson when deciding which lessons count as "yesterday."</p>`;
}
