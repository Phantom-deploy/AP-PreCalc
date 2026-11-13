// The current local date as YYYY-MM-DD.
// For testing, add ?date=2026-12-02 to the page address to preview another day.

import { toISO } from '../data/calendar.js';

export function todayISO() {
  try {
    const override = new URLSearchParams(globalThis.location?.search || '').get('date');
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  } catch {
    // no location available (for example in tests)
  }
  return toISO(new Date());
}
