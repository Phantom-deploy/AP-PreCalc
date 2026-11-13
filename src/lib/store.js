// Progress and preferences, kept in the browser's localStorage. No account needed.

const KEY = 'appc-practice-v1';
export const GOAL = 5; // correct answers needed to complete a problem type

function blank() {
  return { v: 1, prefs: { level: 0, open: {} }, skills: {}, daily: {} };
}

let state = null;
let memoryOnly = false;

function load() {
  if (state) return state;
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    state = parsed && parsed.v === 1 ? { ...blank(), ...parsed, prefs: { ...blank().prefs, ...parsed.prefs } } : blank();
  } catch {
    state = blank();
    memoryOnly = true;
  }
  return state;
}

function save() {
  if (memoryOnly) return;
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
  } catch {
    memoryOnly = true;
  }
}

export function getPrefs() {
  return load().prefs;
}

export function setPref(name, value) {
  load().prefs[name] = value;
  save();
}

export function isUnitOpen(id) {
  return !!load().prefs.open[id];
}

export function setUnitOpen(id, open) {
  load().prefs.open[id] = open;
  save();
}

export function getSkill(typeId) {
  return load().skills[typeId] || { correct: 0, attempts: 0, streak: 0, best: 0 };
}

// Records one finished attempt at a problem. firstTry is false when the student needed a retry.
export function recordAttempt(typeId, correct, firstTry) {
  const s = { ...getSkill(typeId) };
  s.attempts += 1;
  if (correct) {
    s.correct += 1;
    s.streak = firstTry ? s.streak + 1 : 0;
    s.best = Math.max(s.best, s.streak);
  } else {
    s.streak = 0;
  }
  load().skills[typeId] = s;
  save();
  return s;
}

export function skillProgress(typeId) {
  return Math.min(getSkill(typeId).correct, GOAL) / GOAL;
}

export function getDaily(date) {
  return load().daily[date] || { solved: [false, false, false], tries: [0, 0, 0] };
}

export function setDaily(date, record) {
  const st = load();
  st.daily[date] = record;
  // keep the stored history small
  const dates = Object.keys(st.daily).sort();
  while (dates.length > 120) delete st.daily[dates.shift()];
  save();
}

// Number of days in a row with all three daily problems solved.
// Days without school do not break the streak, and neither does an unfinished today.
export function dailyStreak(isInstructional, today, addDays) {
  const records = load().daily;
  const dates = Object.keys(records);
  if (!dates.length) return 0;
  const earliest = dates.sort()[0];
  let streak = 0;
  for (let day = today; day >= earliest; day = addDays(day, -1)) {
    const rec = records[day];
    if (rec && rec.solved.every(Boolean)) streak++;
    else if (day !== today && isInstructional(day)) break;
  }
  return streak;
}

export function resetAll() {
  state = blank();
  save();
}
