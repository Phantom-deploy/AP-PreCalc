// App entry: two-column shell (sidebar and main), hash routing, and the automatic date check.

import { renderHome } from './ui/home.js';
import { renderPractice } from './ui/practice.js';
import { renderDaily } from './ui/daily.js';
import { renderCalendar } from './ui/calendar.js';
import { getLesson } from './data/calendar.js';
import { todayISO } from './lib/clock.js';

const app = document.getElementById('app');
app.innerHTML =
  `<div class="shell"><aside class="side" id="side" aria-label="Navigation"></aside>` +
  `<main class="main" id="view" tabindex="-1"></main></div>`;
const side = document.getElementById('side');
const view = document.getElementById('view');
const ctx = { side, view };
let shownDate = todayISO();

function parseRoute() {
  const parts = (location.hash || '#/').replace(/^#/, '').split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
  if (!parts.length) return { name: 'home', params: {} };
  if (parts[0] === 'tab' && ['progress', 'complete'].includes(parts[1])) return { name: 'home', params: { tab: parts[1] } };
  if (parts[0] === 'unit' && parts[1]) return { name: 'home', params: { unit: parts[1] } };
  if (parts[0] === 'lesson' && getLesson(parts[1] || '')) return { name: 'home', params: { unit: getLesson(parts[1]).unit, lesson: parts[1] } };
  if (parts[0] === 'practice' && parts[1]) return { name: 'practice', params: { typeId: parts[1] } };
  if (parts[0] === 'daily') return { name: 'daily', params: { n: parts[1] } };
  if (parts[0] === 'calendar') return { name: 'calendar', params: {} };
  return { name: 'missing', params: {} };
}

const TITLES = { home: 'Home', practice: 'Practice', daily: 'Daily Problems', calendar: 'Calendar', missing: 'Not found' };

function render() {
  const route = parseRoute();
  shownDate = todayISO();
  try {
    if (route.name === 'home') renderHome(ctx, route.params);
    else if (route.name === 'practice') renderPractice(ctx, route.params);
    else if (route.name === 'daily') renderDaily(ctx, route.params);
    else if (route.name === 'calendar') renderCalendar(ctx);
    else {
      renderHome(ctx, {});
      view.innerHTML = `<div class="page-body"><div class="alert alert-warn">Page not found. <a href="#/">Back to Home</a></div></div>`;
    }
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="page-body"><div class="alert alert-bad"><h3>Something went wrong</h3><p>Please reload the page, or go <a href="#/">back to Home</a>.</p></div></div>`;
  }
  document.title = `${TITLES[route.name]} | AP Precalc Practice`;
  if (!route.params.unit && !route.params.lesson) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);

// Refresh date-driven pages when the date changes, without interrupting a practice problem.
function checkDate() {
  if (todayISO() === shownDate) return;
  if (parseRoute().name === 'practice') {
    shownDate = todayISO();
    return;
  }
  render();
}
setInterval(checkDate, 30000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDate();
});

render();
