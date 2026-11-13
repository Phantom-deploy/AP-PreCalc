// App entry point: navigation bar, hash-based routing, and the automatic date check.

import { renderHome } from './ui/home.js';
import { renderPractice } from './ui/practice.js';
import { renderDaily } from './ui/daily.js';
import { renderCalendar } from './ui/calendar.js';
import { getLesson } from './data/calendar.js';
import { todayISO } from './lib/clock.js';
import { resetAll } from './lib/store.js';

const app = document.getElementById('app');

app.innerHTML =
  `<header class="navbar"><div class="navbar-inner">` +
  `<a class="brand" href="#/"><svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5 L28 27 H4 Z" fill="none" stroke="#5cb85c" stroke-width="3.5" stroke-linejoin="round"/></svg>AP Precalc Practice</a>` +
  `<nav class="nav-links" aria-label="Main"><a href="#/" data-nav="home">Home</a><a href="#/calendar" data-nav="calendar">Calendar</a></nav>` +
  `<a class="btn btn-daily" href="#/daily" data-nav="daily">Daily Problem</a>` +
  `</div></header>` +
  `<main class="container" id="view" tabindex="-1"></main>` +
  `<footer class="footer"><div class="footer-inner"><span>Progress is saved in this browser only. No account needed.</span>` +
  `<span>An independent study tool for one class. Not affiliated with DeltaMath or the College Board. <button type="button" class="link-button" id="reset">Reset my progress</button></span></div></footer>`;

const view = document.getElementById('view');
let shownDate = todayISO();

function parseRoute() {
  const path = (location.hash || '#/').replace(/^#/, '').split('?')[0];
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { name: 'home', params: {} };
  if (parts[0] === 'unit' && parts[1]) return { name: 'home', params: { unit: parts[1] } };
  if (parts[0] === 'lesson' && parts[1] && getLesson(parts[1])) {
    return { name: 'home', params: { unit: getLesson(parts[1]).unit, lesson: parts[1] } };
  }
  if (parts[0] === 'practice' && parts[1]) return { name: 'practice', params: { typeId: parts[1] } };
  if (parts[0] === 'daily') return { name: 'daily', params: { n: parts[1] } };
  if (parts[0] === 'calendar') return { name: 'calendar', params: {} };
  return { name: 'missing', params: {} };
}

function render() {
  const route = parseRoute();
  shownDate = todayISO();
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === route.name));
  try {
    if (route.name === 'home') renderHome(view, route.params);
    else if (route.name === 'practice') renderPractice(view, route.params);
    else if (route.name === 'daily') renderDaily(view, route.params);
    else if (route.name === 'calendar') renderCalendar(view);
    else view.innerHTML = `<div class="alert alert-warn">Page not found. <a href="#/">Back to all units</a></div>`;
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="alert alert-bad"><h3>Something went wrong</h3><p>Please reload the page. If the problem continues, go <a href="#/">back to all units</a>.</p></div>`;
  }
  const titles = { home: 'Home', practice: 'Practice', daily: 'Daily Problems', calendar: 'Calendar', missing: 'Not found' };
  document.title = `${titles[route.name]} | AP Precalc Practice`;
  if (!route.params.lesson) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);

// When the date changes (for example the tab is left open overnight), refresh date-driven pages.
function checkDate() {
  if (todayISO() === shownDate) return;
  const name = parseRoute().name;
  if (name === 'practice') {
    shownDate = todayISO(); // do not interrupt a problem in progress
    return;
  }
  render();
}
setInterval(checkDate, 30000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDate();
});

document.getElementById('reset').addEventListener('click', () => {
  if (window.confirm('Erase all saved scores and daily problem history on this device?')) {
    resetAll();
    render();
  }
});

render();
