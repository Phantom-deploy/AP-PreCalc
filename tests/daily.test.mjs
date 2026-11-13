import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyPlan } from '../src/lib/daily.js';
import { DAYS, LESSONS, dayInfo, isInstructional, addDays, fromISO, COURSE, LESSON_DAYS } from '../src/data/calendar.js';
import { generate, getType } from '../src/problems/index.js';

test('calendar lists every weekday of the term exactly once', () => {
  const seen = new Set();
  for (const d of DAYS) {
    assert.ok(!seen.has(d.date), `duplicate ${d.date}`);
    seen.add(d.date);
    const dow = fromISO(d.date).getDay();
    assert.ok(dow >= 1 && dow <= 5, `${d.date} is a weekend`);
  }
  for (let day = COURSE.start; day <= COURSE.end; day = addDays(day, 1)) {
    const dow = fromISO(day).getDay();
    if (dow >= 1 && dow <= 5) assert.ok(seen.has(day), `missing ${day}`);
  }
});

test('every lesson is scheduled once, in order', () => {
  assert.equal(LESSON_DAYS.length, LESSONS.length);
  assert.deepEqual(LESSON_DAYS.map((d) => d.lesson), LESSONS.map((l) => l.id));
  for (let i = 1; i < LESSON_DAYS.length; i++) assert.ok(LESSON_DAYS[i].date > LESSON_DAYS[i - 1].date);
});

test('spot checks against the printed calendar', () => {
  assert.equal(dayInfo('2026-11-11').kind, 'off');
  assert.equal(dayInfo('2026-11-12').lesson, '1.2');
  assert.equal(dayInfo('2026-11-16').kind, 'off');
  assert.equal(dayInfo('2026-11-26').kind, 'off');
  assert.equal(dayInfo('2026-12-01').lesson, '2.1');
  assert.equal(dayInfo('2026-12-03').kind, 'assessment');
  assert.equal(dayInfo('2026-12-10').lesson, '3.1');
  assert.equal(dayInfo('2026-12-25').kind, 'off');
  assert.equal(dayInfo('2027-01-08').lesson, '4.1');
  assert.equal(dayInfo('2027-01-18').kind, 'off');
  assert.equal(dayInfo('2027-01-26').lesson, '5.1');
  assert.equal(dayInfo('2027-02-09').lesson, '5.9');
  assert.equal(dayInfo('2027-02-17').kind, 'off');
  assert.equal(dayInfo('2026-11-14').off, 'Weekend');
  assert.equal(isInstructional('2026-11-20'), true);
});

test('daily plan uses instructional days, not calendar subtraction', () => {
  // Thursday Nov 12: yesterday (Nov 11) was a holiday, so the previous lesson is 1.1 from Nov 10
  let plan = dailyPlan('2026-11-12');
  assert.deepEqual(plan.slots.map((s) => s.lessonId), ['1.1', '1.1', '1.2']);
  assert.notEqual(plan.slots[0].typeId, plan.slots[1].typeId);
  // Tuesday Nov 17: Monday was a no-school day, weekend before it
  plan = dailyPlan('2026-11-17');
  assert.deepEqual(plan.slots.map((s) => s.lessonId), ['1.3', '1.2', '1.4']);
  // Monday Nov 30 after Thanksgiving recess, a review day
  plan = dailyPlan('2026-11-30');
  assert.deepEqual(plan.slots.slice(0, 2).map((s) => s.lessonId), ['1.6', '1.5']);
  assert.ok(plan.slots[2].lessonId.startsWith('1.'));
  // Friday Dec 4: Thursday was a test, so "yesterday's lesson" is 2.2 from Wednesday
  plan = dailyPlan('2026-12-04');
  assert.deepEqual(plan.slots.map((s) => s.lessonId), ['2.2', '2.1', '2.3']);
  // Monday Jan 4 after winter recess
  plan = dailyPlan('2027-01-04');
  assert.deepEqual(plan.slots.slice(0, 2).map((s) => s.lessonId), ['3.5', '3.4']);
  // a Saturday previews the next lesson
  plan = dailyPlan('2026-11-14');
  assert.deepEqual(plan.slots.map((s) => s.lessonId), ['1.3', '1.2', '1.4']);
  // before the course starts
  plan = dailyPlan('2026-11-01');
  assert.deepEqual(plan.slots.map((s) => s.lessonId), ['1.1', '1.1', '1.1']);
  // after the course ends
  plan = dailyPlan('2027-03-15');
  assert.deepEqual(plan.slots.slice(0, 2).map((s) => s.lessonId), ['5.9', '5.8']);
});

test('daily plan is stable within a day, changes across days, and always has 3 valid problems', () => {
  let changed = 0;
  let prev = null;
  for (let day = '2026-10-20'; day <= '2027-03-20'; day = addDays(day, 1)) {
    const a = dailyPlan(day);
    const b = dailyPlan(day);
    assert.equal(a.slots.length, 3, day);
    assert.deepEqual(a, b, `${day} not stable`);
    assert.equal(a.slots[2].level, 0, `${day}: preview should be easy`);
    for (const s of a.slots) {
      assert.ok(getType(s.typeId), `${day}: bad type`);
      assert.equal(getType(s.typeId).lesson, s.lessonId);
      const p1 = generate(s.typeId, s.level, s.seed);
      const p2 = generate(s.typeId, s.level, s.seed);
      assert.equal(p1.prompt.replace(/g\d+/g, 'g'), p2.prompt.replace(/g\d+/g, 'g'));
      assert.ok(!/[—–]/.test(s.heading + s.detail + (s.hook || '')));
    }
    const sig = JSON.stringify(a.slots.map((s) => [s.typeId, s.seed]));
    if (prev && sig !== prev) changed++;
    prev = sig;
  }
  assert.ok(changed > 140);
});

test('on lesson days the preview is that day\'s lesson and review skips non-lesson days', () => {
  for (let i = 0; i < LESSON_DAYS.length; i++) {
    const plan = dailyPlan(LESSON_DAYS[i].date);
    assert.equal(plan.slots[2].lessonId, LESSON_DAYS[i].lesson);
    if (i >= 1) assert.equal(plan.slots[0].lessonId, LESSON_DAYS[i - 1].lesson);
    if (i >= 2) assert.equal(plan.slots[1].lessonId, LESSON_DAYS[i - 2].lesson);
  }
});
