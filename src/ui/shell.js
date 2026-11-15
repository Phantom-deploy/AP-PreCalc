// Shared layout pieces: the left sidebar, progress rings, and segmented bars.

import { UNITS } from '../data/calendar.js';
import { getDaily, resetAll } from '../lib/store.js';
import { todayISO } from '../lib/clock.js';

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const ICONS = {
  brand: '<svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M17 3 L31 25 H3 Z" fill="none" stroke="#2f3a8f" stroke-width="3.2" stroke-linejoin="round"/><path d="M11 19 H23" stroke="#4353f0" stroke-width="3" stroke-linecap="round"/></svg>',
  book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="1"/><path d="M2 19h20"/></svg>',
  star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  cal: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>',
  user: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
};
export { ICONS };

// Progress ring like DeltaMath's skill list: empty ring, partly filled ring, or a green check.
export function ring(fraction, done, label = '') {
  if (done) {
    return `<span class="ring" aria-label="${esc(label || 'Complete')}"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#2e8540" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  }
  const r = 9;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    `<span class="ring" aria-label="${esc(label || `${Math.round(f * 100)} percent`)}"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">` +
    `<circle cx="12" cy="12" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="3.5"/>` +
    (f > 0 ? `<circle cx="12" cy="12" r="${r}" fill="none" stroke="#3940b0" stroke-width="3.5" stroke-dasharray="${(c * f).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 12 12)"/>` : '') +
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
  return (
    `<div class="side-foot">` +
    `<div class="side-item plain">${ICONS.user}<span>Saved in this browser</span><button type="button" class="link-btn" data-act="reset">Reset</button></div>` +
    `</div>`
  );
}

// Sidebar for the home and calendar pages. active: 'units' | 'unit-N' | 'calendar' | 'daily'
export function homeSidebar(active) {
  const d = getDaily(todayISO());
  const solved = d.solved.filter(Boolean).length;
  const units = UNITS.map(
    (u) =>
      `<a class="side-item${active === `unit-${u.id}` ? ' on' : ''}" href="#/unit/${u.id}">${ICONS.book}<span>Unit ${u.id}: ${esc(u.title)}</span></a>`,
  ).join('');
  return (
    `<div class="side-top">${brand()}` +
    `<a class="btn btn-primary btn-block daily-btn" href="#/daily">Daily Problem <span class="pill light">${solved}/3</span></a>` +
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
    `<div class="side-list">${items
      .map((it) => `<a class="side-skill${it.active ? ' on' : ''}" href="${it.href}"${it.active ? ' aria-current="page"' : ''}>${it.icon}<span>${it.html}</span></a>`)
      .join('')}</div>` +
    `<a class="side-item small" href="#/calendar">${ICONS.cal}<span>Course Calendar</span></a>` +
    `</div>${footer()}`
  );
}

export function wireSidebar(side, rerender) {
  side.querySelector('[data-act="reset"]')?.addEventListener('click', () => {
    if (window.confirm('Erase all saved scores and daily problem history on this device?')) {
      resetAll();
      rerender();
    }
  });
}
