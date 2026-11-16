// Shared layout pieces: the left sidebar, progress rings, and segmented bars.

import { UNITS } from '../data/calendar.js';
import { getDaily, resetAll, getPrefs, setPref } from '../lib/store.js';
import { openScientific, openGraphing } from './tools.js';
import { todayISO } from '../lib/clock.js';

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const ICONS = {
  brand: '<svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M17 3 L31 25 H3 Z" fill="none" stroke="#2f3a8f" stroke-width="3.2" stroke-linejoin="round"/><path d="M11 19 H23" stroke="#4353f0" stroke-width="3" stroke-linecap="round"/></svg>',
  book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="1"/><path d="M2 19h20"/></svg>',
  star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></svg>',
  cal: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>',
  calc: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01" stroke-width="2.2" stroke-linecap="round"/></svg>',
  graph: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 3v18M3 20h18" opacity=".55"/><path d="M5 17c3-1 4-9 7-9s3 5 5 5 2-6 3-8"/><path d="M17 4l3 1-1 3"/></svg>',
  plus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v9M7.5 12h9"/></svg>',
  user: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
};
export { ICONS };

// Progress ring like DeltaMath's skill list: empty ring, partly filled ring, or a green check.
export function ring(fraction, done, label = '') {
  if (done) {
    return `<span class="ring" aria-label="${esc(label || 'Complete')}"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#2e8540" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  }
  const r = 8.5;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    `<span class="ring" aria-label="${esc(label || `${Math.round(f * 100)} percent`)}"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">` +
    `<circle class="trk" cx="12" cy="12" r="${r}" fill="none" stroke-width="4.5"/>` +
    (f > 0 ? `<circle cx="12" cy="12" r="${r}" fill="none" stroke="#333dab" stroke-width="4.5" stroke-dasharray="${(c * f).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 12 12)"/>` : '') +
    `</svg></span>`
  );
}

export function bar(fraction, label) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(label)}"><span style="width:${pct}%"></span></div>`;
}

export function segbar(filled, total, label) {
  let out = `<div class="segbar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${filled}" aria-label="${esc(label)}">`;
  for (let i = 0; i < total; i++) out += `<span class="${i < filled ? 'on' : ''}"></span>`;
  return out + '</div>';
}

function brand() {
  return `<a class="brand" href="#/">${ICONS.brand}<span>AP Precalc <b>Practice</b></span></a>`;
}

function footer() {
  const name = getPrefs().name;
  return (
    `<div class="side-foot">` +
    `<button type="button" class="side-item tool-link" data-act="sci">${ICONS.calc}<span>Scientific Calculator</span></button>` +
    `<button type="button" class="side-item tool-link" data-act="graph">${ICONS.graph}<span>Graphing Calculator</span></button>` +
    `<div class="side-item plain account">${ICONS.user}<button type="button" class="name-btn" data-act="name" title="Change the name shown here">${name ? esc(name) : 'Add your name'}</button>` +
    `<button type="button" class="link-btn" data-act="reset" title="Erase progress saved in this browser">Reset</button></div>` +
    `</div>`
  );
}

// Sidebar for the home and calendar pages. active: 'units' | 'unit-N' | 'calendar' | 'daily'
export function homeSidebar(active) {
  const d = getDaily(todayISO());
  const solved = d.solved.filter(Boolean).length;
  const units = UNITS.map(
    (u) =>
      `<a class="side-item${active === `unit-${u.id}` ? ' on' : ''}" href="#/unit/${u.id}">${ICONS.book}<span>Unit ${u.id}<span class="unit-long">: ${esc(u.title)}</span></span></a>`,
  ).join('');
  return (
    `<div class="side-top">${brand()}` +
    `<div class="side-label">TODAY</div>` +
    `<a class="side-item daily-link${active === 'daily' ? ' on' : ''}" href="#/daily">${ICONS.plus}<span>Daily Problem</span><span class="pill">${solved}/3</span></a>` +
    `<div class="side-label">UNITS</div>` +
    `<a class="side-item${active === 'units' ? ' on' : ''}" href="#/">${ICONS.star}<span>All Units</span></a>` +
    units +
    `<a class="side-item${active === 'calendar' ? ' on' : ''}" href="#/calendar">${ICONS.cal}<span>Course Calendar</span></a>` +
    `</div>${footer()}`
  );
}

// Sidebar for a focused activity (practice or daily): back link, title, progress, and a list.
export function activitySidebar({ title, sub, progressLabel, progress, items }) {
  return (
    `<div class="side-top">${brand()}` +
    `<a class="back-link" href="#/">${ICONS.back}<span>Back to Home</span></a>` +
    `<div class="side-title">${esc(title)}</div>` +
    `<div class="side-sub">${sub}</div>` +
    `<div class="side-grade">${progressLabel}</div>${bar(progress, progressLabel.replace(/<[^>]+>/g, ''))}` +
    `<button type="button" class="list-toggle" data-act="toggle-list" aria-expanded="false">Show ${items.length} ${items.length === 1 ? 'item' : 'items'} in this list</button>` +
    `<div class="side-list">${items
      .map((it) => `<a class="side-skill${it.active ? ' on' : ''}" href="${it.href}"${it.active ? ' aria-current="page"' : ''}>${it.icon}<span>${it.html}</span></a>`)
      .join('')}</div>` +
    `<a class="side-item small" href="#/calendar">${ICONS.cal}<span>Course Calendar</span></a>` +
    `</div>${footer()}`
  );
}

export function wireSidebar(side, rerender) {
  side.querySelector('[data-act="sci"]')?.addEventListener('click', openScientific);
  side.querySelector('[data-act="graph"]')?.addEventListener('click', openGraphing);
  side.querySelector('[data-act="name"]')?.addEventListener('click', () => {
    const value = window.prompt('Your name (saved only in this browser):', getPrefs().name || '');
    if (value === null) return;
    setPref('name', value.trim().slice(0, 40));
    rerender();
  });
  side.querySelector('[data-act="toggle-list"]')?.addEventListener('click', (ev) => {
    const open = side.classList.toggle('list-open');
    ev.currentTarget.setAttribute('aria-expanded', String(open));
    const btn = ev.currentTarget;
    btn.dataset.label = btn.dataset.label || btn.textContent;
    btn.textContent = open ? 'Hide list' : btn.dataset.label;
  });
  side.querySelector('[data-act="reset"]')?.addEventListener('click', () => {
    if (window.confirm('Erase all saved scores and daily problem history on this device?')) {
      resetAll();
      rerender();
    }
  });
}
